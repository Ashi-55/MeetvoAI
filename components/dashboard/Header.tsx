"use client";

import { Input } from "@/components/ui/Input";
import { NotificationBell } from "./NotificationBell";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-bg-primary px-4">
      <h1 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex max-w-md flex-1 items-center gap-3">
        <Input placeholder="Search..." className="h-9" />
        <NotificationBell count={0} />
      </div>
    </header>
  );
}
