"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotificationBell({ count }: { count: number }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-9 w-9 p-0"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Button>
  );
}
