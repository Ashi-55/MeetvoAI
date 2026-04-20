"use client";

import type { ConversationListItem } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function ConversationList({
  items,
  selectedId,
  onSelect,
}: {
  items: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map(
        ({ conversation, otherParticipant, lastMessage, unreadCount }) => (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bg-hover",
                selectedId === conversation.id && "bg-bg-hover"
              )}
            >
              <Avatar
                src={otherParticipant.avatar_url}
                alt={otherParticipant.full_name ?? "User"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">
                    {otherParticipant.full_name ?? "Conversation"}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-accent-blue px-2 py-0.5 text-xs text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-foreground-secondary">
                  {lastMessage?.content ?? "No messages yet"}
                </p>
              </div>
            </button>
          </li>
        )
      )}
    </ul>
  );
}
