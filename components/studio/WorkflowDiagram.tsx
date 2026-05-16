'use client';

import { useMemo, useState } from 'react';

type NodeType = 'trigger' | 'ai_process' | 'action' | 'output' | string;

type DiagramNode = {
  id: string;
  type: NodeType;
  content?: string;
  name?: string;
  description?: string;
  integrations?: string[];
  position?: { x: number; y: number };
};

type DiagramConnection = {
  from: string;
  to: string;
  label?: string;
};

const TYPE_COLORS: Record<string, string> = {
  trigger: '#4F8EF7',
  ai_process: '#00C9A7',
  action: '#7C5CBF',
  output: '#68D391',
};

function nodeMeta(type: NodeType) {
  const color = TYPE_COLORS[type] ?? '#5B21FF';
  const badge = String(type).replace(/_/g, ' ');

  let emoji = '💬';
  if (type === 'trigger') emoji = '📱';
  if (type === 'ai_process') emoji = '💬';
  if (type === 'action') emoji = '📊';
  if (type === 'output') emoji = '🌐';

  // Better mapping to your required platform emojis
  // (keep deterministic but simple)
  if (type === 'trigger') emoji = '💬';

  return { color, badge, emoji };
}

function clamp2Lines(text?: string) {
  const t = (text ?? '').trim();
  return t;
}

export function WorkflowDiagram({
  automation,
}: {
  automation: {
    nodes: DiagramNode[];
    connections: DiagramConnection[];
  };
}) {
  const nodes = automation?.nodes ?? [];
  const connections = automation?.connections ?? [];

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const layout = useMemo(() => {
    const maxNodes = nodes.length || 1;
    // Centered top-to-bottom layout
    // Node card: 160w x 70h
    const nodeW = 160;
    const nodeH = 70;
    const vGap = 40;
    const totalH = maxNodes * nodeH + (maxNodes - 1) * vGap;

    // SVG coordinate system
    const padTop = 10;
    const centerX = 400; // in a 800 wide viewBox

    const yForIndex = (idx: number) => padTop + idx * (nodeH + vGap);

    const positionedNodes = nodes.map((n, idx) => {
      const meta = nodeMeta(n.type);
      return {
        ...n,
        _idx: idx,
        _x: centerX - nodeW / 2,
        _y: yForIndex(idx),
        _w: nodeW,
        _h: nodeH,
        _color: meta.color,
        _badge: meta.badge,
        _emoji: meta.emoji,
      };
    });

    // Map ids to coordinates
    const byId: Record<string, (typeof positionedNodes)[number]> = {};
    for (const pn of positionedNodes) byId[pn.id] = pn;

    return {
      nodeW,
      nodeH,
      vGap,
      totalH,
      positionedNodes,
      byId,
    };
  }, [nodes]);

  const activeNode = activeNodeId ? layout.byId[activeNodeId] : null;

  const viewBox = `0 0 800 ${Math.max(layout.totalH + 40, 240)}`;

  return (
    <div className="w-full">
      <div className="overflow-auto">
        <svg viewBox={viewBox} width="100%" height="auto">
          <defs>
            <marker
              id="wf-arrow"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,12 L12,6 z" fill="#1A2744" />
            </marker>
          </defs>

          {connections.map((c, idx) => {
            const from = layout.byId[c.from];
            const to = layout.byId[c.to];
            if (!from || !to) return null;

            const startX = from._x + from._w / 2;
            const startY = from._y + from._h;
            const endX = to._x + to._w / 2;
            const endY = to._y;
            const midY = (startY + endY) / 2;

            // Curved cubic bezier:
            // M startX startY C startX midY endX midY endX endY
            const d = `M ${startX} ${startY} C ${startX} ${midY} ${endX} ${midY} ${endX} ${endY}`;

            return (
              <path
                key={`${c.from}-${c.to}-${idx}`}
                d={d}
                fill="none"
                stroke="#1A2744"
                strokeWidth={2}
                markerEnd="url(#wf-arrow)"
                opacity={activeNodeId && (activeNodeId === c.from || activeNodeId === c.to) ? 1 : 0.85}
              />
            );
          })}

          {layout.positionedNodes.map((n) => {
            const isActive = n.id === activeNodeId;
            const fill = `${n._color}1A`; // 10% opacity approximation
            const border = n._color;

            const title = (n.name ?? n.content ?? n.id).toString();
            const desc = clamp2Lines(n.description ?? n.content);

            return (
              <g
                key={n.id}
                onClick={() => setActiveNodeId(n.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={n._x}
                  y={n._y}
                  width={n._w}
                  height={n._h}
                  rx={10}
                  fill={fill}
                  stroke={border}
                  strokeWidth={isActive ? 3 : 2}
                  opacity={activeNodeId && !isActive ? 0.75 : 1}
                />

                <text x={n._x + n._w / 2} y={n._y + 16} textAnchor="middle" fontSize={10} fill="#ffffff" opacity={0.95} fontFamily="ui-sans-serif" fontWeight={800}>
                  {String(n.type).toUpperCase()}
                </text>

                <text x={n._x + n._w / 2} y={n._y + 40} textAnchor="middle" fontSize={13} fill="#FFFFFF" fontFamily="ui-sans-serif" fontWeight={800}>
                  {title.length > 20 ? `${title.slice(0, 20)}…` : title}
                </text>

                <text x={n._x + n._w / 2} y={n._y + 58} textAnchor="middle" fontSize={11} fill="#A8B3C7" fontFamily="ui-sans-serif" fontWeight={600}>
                  {n._emoji} 
                  {desc.length > 26 ? `${desc.slice(0, 26)}…` : desc}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-text2">Integration summary</div>
        <div className="mt-2 text-sm text-text3">
          {activeNode?.integrations?.length ? (
            <div className="flex flex-wrap gap-2">
              {activeNode.integrations!.map((i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-surface2 border border-border text-text3 text-xs">
                  {i}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-text3">{activeNodeId ? 'No integration details for this node.' : 'Click a node to see details.'}</div>
          )}
        </div>
      </div>

      {activeNode ? (
        <div className="mt-4 rounded-xl border border-border bg-surface2/30 p-4">
          <div className="text-sm font-semibold text-text2">Node detail</div>
          <div className="mt-1 text-xs text-text3">
            <span className="font-bold text-text2">{String(activeNode.type).toUpperCase()}</span> · {activeNode.name ?? activeNode.content ?? activeNode.id}
          </div>
          <div className="mt-2 text-sm text-text3 leading-relaxed">
            {activeNode.description ?? activeNode.content ?? '—'}
          </div>
        </div>
      ) : null}
    </div>
  );
}

