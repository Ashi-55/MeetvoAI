"use client";

import { useNotificationStore } from "@/store/notificationStore";

export function useNotifications() {
  const { items, unreadCount, setItems, markRead } = useNotificationStore();
  return { items, unreadCount, setItems, markRead };
}
