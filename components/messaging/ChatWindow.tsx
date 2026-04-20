"use client";

import type { Message, Profile } from "@/types";
import { MessageBubble } from "./MessageBubble";

export function ChatWindow({
  messages,
  self,
  peer,
}: {
  messages: Message[];
  self: Profile;
  peer: Profile;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isOwn={m.sender_id === self.id}
          peerName={peer.full_name ?? "Peer"}
        />
      ))}
    </div>
  );
}
