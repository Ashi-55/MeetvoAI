'use client';

import { useChatStore } from '@/stores/chatStore';
import { BadgeCheck } from 'lucide-react';
import type { ChatSession } from '@/types';

export function MinimisedChatTab({ session }: { session: ChatSession }) {
  const { openChat } = useChatStore();
  const initials = session.participantName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <button
      onClick={() => openChat(session)}
      className="flex items-center gap-2 bg-surface border border-border rounded-t-xl px-3 py-2 hover:bg-surface2 transition-colors shadow-xl shadow-black/40"
    >
      <div className="relative">
        <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">{initials}</div>
        {session.isVerified && <BadgeCheck size={10} className="absolute -bottom-0.5 -right-0.5 text-blue" />}
      </div>
      <span className="text-text text-xs font-medium max-w-[80px] truncate">{session.participantName}</span>
    </button>
  );
}
