"use client";

import type { Project, ProjectStatus } from "@/types";
import { Card } from "@/components/ui/Card";

const columns: ProjectStatus[] = [
  "inquiry",
  "negotiation",
  "active",
  "in_review",
  "completed",
  "disputed",
];

export function DealPipeline({ projects }: { projects: Project[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col} className="min-w-[280px] space-y-3">
          <h3 className="text-sm font-medium capitalize text-foreground-secondary">
            {col.replace("_", " ")}
          </h3>
          {projects
            .filter((p) => p.status === col)
            .map((p) => (
              <Card key={p.id} className="p-4">
                <p className="font-medium text-foreground">{p.title}</p>
              </Card>
            ))}
        </div>
      ))}
    </div>
  );
}
