"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
}

export function Sidebar({
  links,
  footer,
}: {
  links: SidebarLink[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-bg-secondary">
      <div className="p-4 font-display text-lg font-semibold text-foreground">
        MeetvoAI
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-secondary transition hover:bg-bg-hover hover:text-foreground",
              pathname === l.href && "bg-bg-hover text-foreground"
            )}
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>
      {footer ? (
        <div className="border-t border-border p-3">{footer}</div>
      ) : null}
    </aside>
  );
}
