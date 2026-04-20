"use client";

export function CodePreview({ code }: { code: string }) {
  return (
    <pre className="max-h-[480px] overflow-auto rounded-lg border border-border bg-bg-secondary p-4 font-mono text-xs text-foreground">
      <code>{code}</code>
    </pre>
  );
}
