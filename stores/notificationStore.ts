'use client';

import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),
  addNotification: (notification) => {
    const { notifications } = get();
    const updated = [notification, ...notifications];
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.is_read).length });
  },
  markRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.is_read).length });
  },
  markAllRead: () => {
    const { notifications } = get();
    set({ notifications: notifications.map((n) => ({ ...n, is_read: true })), unreadCount: 0 });
  },
}));
