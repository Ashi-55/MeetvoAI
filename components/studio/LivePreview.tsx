"use client";

export function LivePreview({ html }: { html: string }) {
  const srcDoc = html || "<html><body></body></html>";
  return (
    <iframe
      title="Preview"
      className="h-full min-h-[400px] w-full rounded-lg border border-border bg-white"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={srcDoc}
    />
  );
}
