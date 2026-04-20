import type { Agent } from "@/types";
import { AgentCard } from "./AgentCard";

export function AgentGrid({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}
