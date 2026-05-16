'use client';

import { useChatStore } from '@/stores/chatStore';
import { ChatPopup } from './ChatPopup';
import { MinimisedChatTab } from './MinimisedChatTab';

export function ChatManager() {
  const { openChats, minimisedChats } = useChatStore();

  return (
    <>
      {openChats.map((chat, i) => (
        <ChatPopup key={chat.conversationId} session={chat} offsetIndex={i} />
      ))}
      <div className="fixed bottom-0 right-6 flex items-end gap-2 z-40">
        {minimisedChats.map((chat) => (
          <MinimisedChatTab key={chat.conversationId} session={chat} />
        ))}
      </div>
    </>
  );
}
