'use client';

import { create } from 'zustand';
import type { ChatSession } from '@/types';

interface ChatState {
  openChats: ChatSession[];
  minimisedChats: ChatSession[];
  totalUnread: number;
  openChat: (session: ChatSession) => void;
  minimiseChat: (conversationId: string) => void;
  closeChat: (conversationId: string) => void;
  updateUnread: (conversationId: string, count: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  openChats: [],
  minimisedChats: [],
  totalUnread: 0,
  openChat: (session) => {
    const { openChats, minimisedChats } = get();
    const conversationId = session.conversationId ?? session.id;
    const existing = [...openChats, ...minimisedChats].find(
      (c) => (c.conversationId ?? c.id) === conversationId
    );
    if (existing) {
      set({
        openChats: [...openChats.filter((c) => (c.conversationId ?? c.id) !== conversationId), { ...existing, isMinimised: false, conversationId }],
        minimisedChats: minimisedChats.filter((c) => (c.conversationId ?? c.id) !== conversationId),
      });
    } else {
      set({ openChats: [...openChats, { ...session, isMinimised: false, conversationId }] });
    }
  },
  minimiseChat: (conversationId) => {
    const { openChats, minimisedChats } = get();
    const chat = openChats.find((c) => (c.conversationId ?? c.id) === conversationId);
    if (chat) {
      set({
        openChats: openChats.filter((c) => (c.conversationId ?? c.id) !== conversationId),
        minimisedChats: [...minimisedChats, { ...chat, isMinimised: true, conversationId }],
      });
    }
  },
  closeChat: (conversationId) => {
    const { openChats, minimisedChats } = get();
    set({
      openChats: openChats.filter((c) => (c.conversationId ?? c.id) !== conversationId),
      minimisedChats: minimisedChats.filter((c) => (c.conversationId ?? c.id) !== conversationId),
    });
  },
  updateUnread: (conversationId, count) => {
    const { openChats, minimisedChats } = get();
    const update = (chats: ChatSession[]) =>
      chats.map((c) => ((c.conversationId ?? c.id) === conversationId ? { ...c } : c));
    const allChats = [...update(openChats), ...update(minimisedChats)];
    const total = allChats.reduce((sum) => sum + count, 0);
    set({ totalUnread: total });
  },
}));
