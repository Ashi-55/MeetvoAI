"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Copy, Download, RefreshCw, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CodePreview } from "./CodePreview";
import { LivePreview } from "./LivePreview";

export function WebsiteBuilder({
  html,
  loading,
  onRegenerate,
  onEditWithAI,
  onSaveProfile,
}: {
  html: string;
  loading: boolean;
  onRegenerate: () => void;
  onEditWithAI: (instruction: string) => void;
  onSaveProfile: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Tabs.Root
        defaultValue="preview"
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List className="flex shrink-0 gap-1 rounded-lg border border-border bg-bg-secondary p-1">
          <Tabs.Trigger
            value="preview"
            className="rounded-md px-3 py-1.5 text-sm text-foreground-secondary data-[state=active]:bg-bg-card data-[state=active]:text-foreground"
          >
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="code"
            className="rounded-md px-3 py-1.5 text-sm text-foreground-secondary data-[state=active]:bg-bg-card data-[state=active]:text-foreground"
          >
            Code
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          value="preview"
          className="min-h-0 flex-1 overflow-hidden pt-2 data-[state=inactive]:hidden"
        >
          {loading ? (
            <div className="h-[min(60vh,480px)] animate-pulse rounded-lg bg-bg-hover" />
          ) : (
            <LivePreview html={html} />
          )}
        </Tabs.Content>
        <Tabs.Content
          value="code"
          className="min-h-0 flex-1 overflow-auto pt-2 data-[state=inactive]:hidden"
        >
          {loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-bg-hover" />
          ) : (
            <CodePreview code={html} />
          )}
        </Tabs.Content>
      </Tabs.Root>
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          disabled={loading}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Regenerate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const instruction = window.prompt(
              "Describe changes (e.g. “dark blue background”):"
            );
            if (instruction?.trim()) onEditWithAI(instruction.trim());
          }}
          disabled={loading}
        >
          Edit with AI
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "meetvo-site.html";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Download started");
          }}
          disabled={!html}
        >
          <Download className="mr-1 h-4 w-4" />
          Download HTML
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(html);
              toast.success("Copied to clipboard");
            } catch {
              toast.error("Could not copy");
            }
          }}
          disabled={!html}
        >
          <Copy className="mr-1 h-4 w-4" />
          Copy code
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onSaveProfile}
          disabled={!html}
        >
          <Save className="mr-1 h-4 w-4" />
          Save to profile
        </Button>
      </div>
    </div>
  );
}
