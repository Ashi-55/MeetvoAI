"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CreditCard,
  Crown,
  Home,
  LayoutGrid,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Shield,
  Sparkles,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Header } from "./Header";

const businessNav = [
  { href: "/dashboard/business", label: "Overview", icon: Home },
  {
    href: "/dashboard/business/marketplace",
    label: "Marketplace",
    icon: LayoutGrid,
  },
  { href: "/builders", label: "Browse Builders", icon: Users },
  {
    href: "/dashboard/business/studio",
    label: "Builder Studio",
    icon: Sparkles,
  },
  {
    href: "/dashboard/business/projects",
    label: "My Projects",
    icon: Briefcase,
  },
  { href: "/dashboard/business/demos", label: "Demo Calls", icon: Video },
  {
    href: "/dashboard/business/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/business/payments",
    label: "Payments",
    icon: CreditCard,
  },
];

const builderNav = [
  { href: "/dashboard/builder", label: "Overview", icon: Home },
  {
    href: "/dashboard/builder/studio",
    label: "Builder Studio",
    icon: Sparkles,
  },
  { href: "/dashboard/builder/agents", label: "My Agents", icon: LayoutGrid },
  { href: "/dashboard/builder/demos", label: "Demo Calls", icon: Video },
  {
    href: "/dashboard/builder/projects",
    label: "My Projects",
    icon: Briefcase,
  },
  {
    href: "/dashboard/builder/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  { href: "/dashboard/builder/earnings", label: "Earnings", icon: Wallet },
  {
    href: "/dashboard/builder/subscription",
    label: "Subscription",
    icon: Crown,
  },
  {
    href: "/dashboard/builder/verification",
    label: "Verification",
    icon: Shield,
  },
];

function titleFromPath(path: string): string {
  const seg = path.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? "Dashboard";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isBusiness = pathname.startsWith("/dashboard/business");
  const nav = isBusiness ? businessNav : builderNav;

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-border bg-bg-secondary transition-[width]",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-3">
          {!collapsed ? (
            <Link
              href="/"
              className="font-display text-sm font-semibold text-foreground"
            >
              MeetvoAI
            </Link>
          ) : (
            <span className="mx-auto font-display text-xs font-bold text-accent-blue">
              M
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === pathname ||
              (href !== "/dashboard/builder" &&
                href !== "/dashboard/business" &&
                pathname.startsWith(href));
            return (
              <Link
                key={href + label}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "ring-accent-blue/40 bg-bg-hover text-foreground ring-1"
                    : "text-foreground-secondary hover:bg-bg-hover hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active && "text-accent-blue"
                  )}
                />
                {!collapsed ? label : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div
            className={cn(
              "flex items-center gap-2",
              collapsed && "justify-center"
            )}
          >
            <Avatar
              src={profile?.avatar_url}
              alt={profile?.full_name ?? "User"}
              size="sm"
            />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.full_name ?? "Account"}
                </p>
                <p className="truncate text-xs capitalize text-foreground-muted">
                  {profile?.role ?? "—"}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header title={titleFromPath(pathname)} />
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
