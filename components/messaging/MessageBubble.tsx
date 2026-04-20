"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function MessageBubble({
  message,
  isOwn,
  peerName,
}: {
  message: Message;
  isOwn: boolean;
  peerName: string;
}) {
  return (
    <div
      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
      title={format(new Date(message.created_at), "PPpp")}
    >
      <div
        className={cn(
          "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2 text-sm",
          isOwn
            ? "bg-accent-blue text-white"
            : "bg-bg-card text-foreground ring-1 ring-border"
        )}
      >
        {!isOwn ? (
          <p className="mb-1 text-xs text-foreground-secondary">{peerName}</p>
        ) : null}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
