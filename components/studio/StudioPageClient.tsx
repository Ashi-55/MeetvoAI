"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import type { AgentFlowJson, StudioBuild, StudioIntent } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { AgentFlowBuilder } from "./AgentFlowBuilder";
import { WebsiteBuilder } from "./WebsiteBuilder";
import { VoiceInput } from "./VoiceInput";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CHIPS = [
  "🌐 Build me a landing page for my restaurant",
  "🤖 Create a WhatsApp customer support bot",
  "📋 Build a lead capture agent for my real estate business",
  "🔊 Create a voice assistant for appointment booking",
];

async function consumeSSE(
  response: Response,
  onEvent: (data: Record<string, unknown>) => void
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        onEvent(JSON.parse(json) as Record<string, unknown>);
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
}

export function StudioPageClient() {
  const { session, profile } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<StudioIntent | null>(null);
  const [html, setHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [flow, setFlow] = useState<AgentFlowJson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<StudioBuild[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("studio_builds")
      .select("*")
      .eq("builder_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setHistory(data as StudioBuild[]);
  }, [session?.user, supabase]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const runGeneration = useCallback(
    async (userText: string, historyOverride?: ChatMessage[]) => {
      if (!userText.trim()) return;
      setLoading(true);
      setPreviewLoading(true);
      setStarted(true);
      setIntent(null);
      setHtml("");
      setFlow(null);

      const prior = historyOverride ?? [...messages];
      setMessages([...prior, { role: "user", content: userText }]);
      let assistant = "";
      let detectedIntent: StudioIntent | null = null;
      let htmlOut = "";
      let flowOut: AgentFlowJson | null = null;

      try {
        const res = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userText,
            conversationHistory: prior,
          }),
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? res.statusText);
        }

        await consumeSSE(res, (data) => {
          const t = data.type as string;
          if (t === "intent") {
            detectedIntent = data.intent as StudioIntent;
            setIntent(detectedIntent);
          }
          if (t === "text_delta" && typeof data.text === "string") {
            assistant += data.text;
            setMessages(() => {
              const base = [
                ...prior,
                { role: "user" as const, content: userText },
              ];
              base.push({ role: "assistant", content: assistant });
              return base;
            });
          }
          if (t === "phase" && data.name === "html") {
            setPreviewLoading(true);
          }
          if (t === "html_delta" && typeof data.text === "string") {
            htmlOut += data.text;
            setHtml(htmlOut);
            setPreviewLoading(false);
          }
          if (t === "agent_flow" && data.flow) {
            flowOut = data.flow as AgentFlowJson;
            setFlow(flowOut);
            setPreviewLoading(false);
          }
          if (t === "error" && typeof data.message === "string") {
            toast.error(data.message);
          }
        });

        setPreviewLoading(false);

        if (session?.user && detectedIntent && detectedIntent !== "unclear") {
          const now = new Date().toISOString();
          const turns = [
            ...prior.map((m) => ({
              role: m.role,
              content: m.content,
              createdAt: now,
            })),
            {
              role: "user" as const,
              content: userText,
              createdAt: now,
            },
            {
              role: "assistant" as const,
              content: assistant,
              createdAt: now,
            },
          ];
          await supabase.from("studio_builds").insert({
            builder_id: session.user.id,
            build_name:
              userText.slice(0, 80) + (userText.length > 80 ? "…" : ""),
            build_type: detectedIntent === "website" ? "website" : "ai_agent",
            prompt_used: userText,
            generated_code: htmlOut || null,
            flow_json: flowOut,
            conversation_history: turns,
          });
          void loadHistory();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        toast.error(msg);
        setPreviewLoading(false);
      } finally {
        setLoading(false);
      }
    },
    [loadHistory, messages, session?.user, supabase]
  );

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await runGeneration(text);
  }, [input, loading, runGeneration]);

  const onVoice = useCallback((text: string) => {
    setInput(text);
  }, []);

  const newBuild = useCallback(() => {
    setStarted(false);
    setMessages([]);
    setHtml("");
    setFlow(null);
    setIntent(null);
    setInput("");
  }, []);

  if (
    profile &&
    profile.role !== "builder" &&
    profile.role !== "admin" &&
    profile.role !== "business"
  ) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-10 text-center">
        <p className="text-foreground">
          Studio access is only available for authorized MeetvoAI accounts.
        </p>
        <Link
          href="/dashboard/business"
          className="hover:bg-accent-blue/90 mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-accent-blue px-6 text-sm font-medium text-white shadow-glow transition"
        >
          Go to business dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Builder Studio
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSidebarOpen((s) => !s)}
          >
            <Menu className="mr-1 h-4 w-4" />
            History
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={newBuild}>
            New build
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 gap-4">
        <AnimatePresence>
          {sidebarOpen ? (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary"
            >
              <div className="h-full w-[260px] space-y-2 overflow-y-auto p-3">
                <p className="text-xs font-medium text-foreground-muted">
                  Recent builds
                </p>
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setStarted(true);
                      setHtml(h.generated_code ?? "");
                      setFlow((h.flow_json as AgentFlowJson) ?? null);
                      setIntent(
                        h.build_type === "website" ? "website" : "agent"
                      );
                    }}
                    className="w-full rounded-md border border-border bg-bg-card px-2 py-2 text-left text-xs text-foreground hover:border-accent-blue"
                  >
                    <span className="block truncate font-medium">
                      {h.build_name ?? "Untitled"}
                    </span>
                    <span className="text-foreground-muted">
                      {h.build_type}
                    </span>
                  </button>
                ))}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-32 text-center">
            <div className="mb-8 flex items-center gap-2">
              <div className="bg-accent-blue/20 flex h-9 w-9 items-center justify-center rounded-lg font-display text-lg font-bold text-accent-blue">
                M
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                MeetvoAI
              </span>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl font-display text-3xl font-semibold text-foreground md:text-4xl"
            >
              What do you want to build today?
            </motion.h2>
            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setInput(c)}
                  className="rounded-xl border border-border bg-bg-card px-4 py-3 text-left text-sm text-foreground-secondary transition hover:border-accent-blue hover:text-foreground"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="flex min-h-0 flex-col rounded-lg border border-border bg-bg-secondary">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((m, i) => (
                  <div
                    key={`${i}-${m.role}`}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="bg-accent-blue/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-accent-blue">
                        M
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-accent-blue text-white"
                          : "text-foreground"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading ? (
                  <div className="flex items-center gap-2 pl-10 text-sm text-foreground-secondary">
                    <span className="flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce [animation-delay:150ms]">
                        .
                      </span>
                      <span className="animate-bounce [animation-delay:300ms]">
                        .
                      </span>
                    </span>
                    {intent === "website"
                      ? "Building your website..."
                      : intent === "agent"
                        ? "Designing your agent flow..."
                        : "Thinking..."}
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="flex min-h-0 flex-col rounded-lg border border-border bg-bg-card p-3">
              {intent === "website" || html ? (
                <WebsiteBuilder
                  html={html}
                  loading={previewLoading}
                  onRegenerate={() => {
                    const lastUser = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    if (lastUser) void runGeneration(lastUser.content, []);
                  }}
                  onEditWithAI={(instruction) => {
                    void runGeneration(
                      `Apply this change to the website: ${instruction}`,
                      messages
                    );
                  }}
                  onSaveProfile={async () => {
                    if (!session?.user || !profile) return;
                    const { data: bp } = await supabase
                      .from("builder_profiles")
                      .select("id")
                      .eq("user_id", session.user.id)
                      .single();
                    if (!bp) {
                      toast.error("Create a builder profile first.");
                      return;
                    }
                    const { error } = await supabase.from("agents").insert({
                      builder_id: bp.id,
                      title: "Studio website",
                      description: "Generated in Builder Studio",
                      category: "Website",
                      agent_type: "website",
                      generated_code: html,
                      price: 0,
                      is_published: false,
                    });
                    if (error) toast.error(error.message);
                    else toast.success("Saved draft agent");
                  }}
                />
              ) : flow ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <AgentFlowBuilder flow={flow} />
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const lastUser = [...messages]
                          .reverse()
                          .find((m) => m.role === "user");
                        if (lastUser) void runGeneration(lastUser.content, []);
                      }}
                    >
                      Regenerate flow
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const t = window.prompt("Describe flow changes:");
                        if (t) void runGeneration(t, messages);
                      }}
                    >
                      Edit flow with AI
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        if (!session?.user) return;
                        const { data: bp } = await supabase
                          .from("builder_profiles")
                          .select("id")
                          .eq("user_id", session.user.id)
                          .single();
                        if (!bp) {
                          toast.error("Builder profile required.");
                          return;
                        }
                        const { error } = await supabase.from("agents").insert({
                          builder_id: bp.id,
                          title: flow.agentName,
                          description: flow.description,
                          category: "AI Agent",
                          agent_type: "ai_agent",
                          flow_json: flow,
                          price: 0,
                          is_published: false,
                        });
                        if (error) toast.error(error.message);
                        else toast.success("Agent saved as draft");
                      }}
                    >
                      Save agent
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
                  {previewLoading ? (
                    <>
                      <Skeleton className="h-40 w-full max-w-md" />
                      <p className="text-sm text-foreground-secondary">
                        Preparing preview…
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-foreground-secondary">
                      Preview will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-bg-primary/95 fixed bottom-0 left-0 right-0 z-30 border-t border-border p-4 backdrop-blur-md md:left-[240px]">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="focus-within:ring-accent-blue/40 relative min-h-[56px] flex-1 rounded-2xl border border-border bg-[#1C1C26] p-2 shadow-glow focus-within:border-accent-blue focus-within:ring-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the website or AI agent you want to build..."
                className="max-h-[200px] min-h-[56px] resize-none border-0 bg-transparent focus-visible:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
            </div>
            <VoiceInput onTranscript={onVoice} disabled={loading} />
            <Button
              type="button"
              variant="primary"
              className="h-12 w-12 shrink-0 rounded-xl p-0"
              disabled={loading || !input.trim()}
              onClick={() => void handleSubmit()}
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
