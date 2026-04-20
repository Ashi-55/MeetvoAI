"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Agent } from "@/types";
import { AgentCard } from "./AgentCard";
import { FilterSidebar } from "./FilterSidebar";
import { SearchBar } from "./SearchBar";

export function MarketplaceView({ agents }: { agents: Agent[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return agents;
    return agents.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        (a.description ?? "").toLowerCase().includes(s) ||
        (a.category ?? "").toLowerCase().includes(s)
    );
  }, [agents, q]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
      <FilterSidebar />
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-semibold">Marketplace</h1>
          <div className="max-w-md flex-1">
            <SearchBar value={q} onChange={setQ} />
          </div>
        </div>
        {agents.length === 0 ? (
          <p className="rounded-lg border border-border bg-bg-card p-8 text-center text-foreground-secondary">
            No published agents yet. Builders can publish from the dashboard.
          </p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Link key={a.id} href={`/agent/${a.id}`}>
                <AgentCard agent={a} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-bg-card p-8 text-center text-foreground-secondary">
            No agents match your search.
          </p>
        )}
      </div>
    </div>
  );
}
