import { create } from "zustand";
import type { AppNotification } from "@/types";

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  setItems: (items: AppNotification[]) => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) =>
    set({
      items,
      unreadCount: items.filter((n) => !n.read).length,
    }),
  markRead: (id) => {
    const items = get().items.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      items,
      unreadCount: items.filter((n) => !n.read).length,
    });
  },
}));
