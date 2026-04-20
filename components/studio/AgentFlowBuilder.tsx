"use client";

import { useCallback, useMemo, useState } from "react";
import type { AgentFlowJson, AgentFlowNode } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const typeColors: Record<AgentFlowNode["type"], string> = {
  trigger: "bg-accent-blue/20 text-accent-blue border-accent-blue/40",
  condition: "bg-accent-orange/20 text-accent-orange border-accent-orange/40",
  action: "bg-accent-green/20 text-accent-green border-accent-green/40",
  ai: "bg-accent-purple/20 text-accent-purple border-accent-purple/40",
  output: "bg-teal-400/20 text-teal-300 border-teal-400/40",
};

export function AgentFlowBuilder({ flow }: { flow: AgentFlowJson }) {
  const [selected, setSelected] = useState<string | null>(
    flow.nodes[0]?.id ?? null
  );
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    const init: Record<string, { x: number; y: number }> = {};
    flow.nodes.forEach((n, i) => {
      init[n.id] = { x: 40, y: 40 + i * 120 };
    });
    return init;
  });

  const selectedNode = useMemo(
    () => flow.nodes.find((n) => n.id === selected) ?? null,
    [flow.nodes, selected]
  );

  const onDrag = useCallback((id: string, dx: number, dy: number) => {
    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: (prev[id]?.x ?? 0) + dx,
        y: (prev[id]?.y ?? 0) + dy,
      },
    }));
  }, []);

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4 lg:flex-row">
      <div className="relative min-h-[400px] flex-1 overflow-auto rounded-lg border border-border bg-bg-secondary">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {flow.connections.map((c, i) => {
            const a = positions[c.from];
            const b = positions[c.to];
            if (!a || !b) return null;
            const x1 = a.x + 80;
            const y1 = a.y + 24;
            const x2 = b.x + 80;
            const y2 = b.y + 24;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`${c.from}-${c.to}-${i}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke="currentColor"
                strokeWidth={1.5}
                fill="none"
                className="text-border-light"
              />
            );
          })}
        </svg>
        {flow.nodes.map((node) => (
          <FlowNodeCard
            key={node.id}
            node={node}
            selected={selected === node.id}
            position={positions[node.id] ?? { x: 0, y: 0 }}
            onSelect={() => setSelected(node.id)}
            onDrag={(dx, dy) => onDrag(node.id, dx, dy)}
          />
        ))}
      </div>
      <aside className="w-full shrink-0 space-y-3 rounded-lg border border-border bg-bg-card p-4 lg:w-72">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {flow.agentName}
          </h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            {flow.description}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground-muted">Trigger</p>
          <Badge tone="blue">{flow.triggerType}</Badge>
        </div>
        {selectedNode ? (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground-muted">
              Selected node
            </p>
            <p className="font-medium text-foreground">{selectedNode.label}</p>
            <p className="text-sm text-foreground-secondary">
              {selectedNode.description}
            </p>
            <pre className="max-h-32 overflow-auto rounded bg-bg-secondary p-2 text-xs text-foreground-muted">
              {JSON.stringify(selectedNode.config ?? {}, null, 2)}
            </pre>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-medium text-foreground-muted">
            Capabilities
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground-secondary">
            {flow.capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground-muted">Deploy</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {flow.deploymentChannels.map((c) => (
              <Badge key={c} tone="purple">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function FlowNodeCard({
  node,
  selected,
  position,
  onSelect,
  onDrag,
}: {
  node: AgentFlowNode;
  selected: boolean;
  position: { x: number; y: number };
  onSelect: () => void;
  onDrag: (dx: number, dy: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [last, setLast] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "absolute w-[160px] cursor-grab rounded-lg border p-3 text-left shadow-sm active:cursor-grabbing",
        typeColors[node.type],
        selected && "ring-2 ring-accent-blue"
      )}
      style={{ left: position.x, top: position.y }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
        setLast({ x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (!dragging || !last) return;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        setLast({ x: e.clientX, y: e.clientY });
        onDrag(dx, dy);
      }}
      onPointerUp={(e) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setDragging(false);
        setLast(null);
      }}
    >
      <p className="text-[10px] font-medium uppercase text-foreground-muted">
        {node.type}
      </p>
      <p className="text-sm font-semibold text-foreground">{node.label}</p>
    </div>
  );
}
