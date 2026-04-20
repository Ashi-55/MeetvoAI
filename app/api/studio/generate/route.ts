import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { detectIntent } from "@/lib/studio-intent";
import type { AgentFlowJson } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function sseLine(obj: Record<string, unknown>): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```$/i, "");
  }
  return t.trim();
}

function parseAgentFlow(text: string): AgentFlowJson {
  const cleaned = stripJsonFence(text);
  const parsed = JSON.parse(cleaned) as AgentFlowJson;
  if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
    throw new Error("Invalid agent flow JSON");
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profile?.role !== "builder" &&
      profile?.role !== "admin" &&
      profile?.role !== "business"
    ) {
      return NextResponse.json(
        { error: "Authorized account required for Studio" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      prompt: string;
      conversationHistory?: { role: "user" | "assistant"; content: string }[];
    };

    const prompt = body.prompt?.trim() ?? "";
    if (!prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const intent = detectIntent(prompt);
    const geminiClient = getGeminiClient();
    const model = getGeminiModel(geminiClient);

    const history = (body.conversationHistory ?? [])
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseLine(obj)));
        };

        try {
          send({ type: "intent", intent });

          if (intent === "unclear") {
            const chat = model.startChat({
              history,
              generationConfig: {
                maxOutputTokens: 512,
              },
            });

            const result = await chat.sendMessageStream(prompt);
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                send({ type: "text_delta", text });
              }
            }
            send({ type: "done" });
            controller.close();
            return;
          }

          if (intent === "website") {
            // Plan phase
            const planPrompt = `You are MeetvoAI Studio. Briefly outline the site structure and sections you will build (2–4 sentences). Plain text only, no code yet.\n\nUser request: ${prompt}`;
            const planChat = model.startChat({
              history,
              generationConfig: {
                maxOutputTokens: 1024,
              },
            });
            const planResult = await planChat.sendMessageStream(planPrompt);
            for await (const chunk of planResult.stream) {
              const text = chunk.text();
              if (text) {
                send({ type: "text_delta", text });
              }
            }

            send({ type: "phase", name: "html" });

            // HTML generation phase
            const htmlPrompt = `You are an expert web developer. Generate complete, beautiful, production-ready HTML with embedded CSS and JavaScript based on the user's description. The output must be a single complete HTML file. Make it visually stunning, mobile responsive, and professional. Use modern CSS (gradients, animations, flexbox, grid). Include real placeholder content relevant to the business described. Return ONLY the complete HTML code, nothing else, no markdown code blocks.\n\nUser request: ${prompt}`;
            const planHistory = await planChat.getHistory();
            const htmlChat = model.startChat({
              history: [...history, ...planHistory],
              generationConfig: {
                maxOutputTokens: 8192,
              },
            });
            const htmlResult = await htmlChat.sendMessageStream(htmlPrompt);
            for await (const chunk of htmlResult.stream) {
              const text = chunk.text();
              if (text) {
                send({ type: "html_delta", text });
              }
            }

            send({ type: "done" });
            controller.close();
            return;
          }

          /* agent — analysis stream, then structured JSON */
          send({ type: "phase", name: "analysis" });

          const analysisPrompt = `You are MeetvoAI Studio. Describe the automation architecture you will design: triggers, steps, and outputs. 3–5 short sentences, plain text only.\n\nUser request: ${prompt}`;
          const analysisChat = model.startChat({
            history,
            generationConfig: {
              maxOutputTokens: 768,
            },
          });
          const analysisResult =
            await analysisChat.sendMessageStream(analysisPrompt);
          for await (const chunk of analysisResult.stream) {
            const text = chunk.text();
            if (text) {
              send({ type: "text_delta", text });
            }
          }

          send({ type: "phase", name: "agent_json" });

          const jsonPrompt = `You are an AI automation expert. Analyze the user's request and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "agentName": string,
  "description": string,
  "triggerType": "whatsapp" | "voice" | "webhook" | "schedule" | "form",
  "nodes": [
    {
      "id": string,
      "type": "trigger" | "condition" | "action" | "ai" | "output",
      "label": string,
      "description": string,
      "config": {}
    }
  ],
  "connections": [
    { "from": string, "to": string, "label": string }
  ],
  "capabilities": string[],
  "deploymentChannels": string[]
}\n\nUser request: ${prompt}`;

          const analysisHistory = await analysisChat.getHistory();
          const combinedHistory = [...history, ...analysisHistory];
          const jsonChat = model.startChat({
            history: combinedHistory,
            generationConfig: {
              maxOutputTokens: 4096,
            },
          });
          const jsonResult = await jsonChat.sendMessage(jsonPrompt);
          const response = jsonResult.response;
          const text = response.text();

          const flow = parseAgentFlow(text);
          send({ type: "agent_flow", flow });

          send({ type: "done" });
          controller.close();
        } catch (e) {
          const message = e instanceof Error ? e.message : "Generation failed";
          controller.enqueue(
            encoder.encode(sseLine({ type: "error", message }))
          );
          controller.enqueue(encoder.encode(sseLine({ type: "done" })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
