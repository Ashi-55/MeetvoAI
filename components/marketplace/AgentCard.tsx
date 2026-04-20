import type { Agent } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="h-full">
      <CardContent>
        {agent.category ? (
          <Badge tone="blue" className="mb-2">
            {agent.category}
          </Badge>
        ) : null}
        <h3 className="font-display font-semibold text-foreground">
          {agent.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">
          {agent.description}
        </p>
      </CardContent>
    </Card>
  );
}
