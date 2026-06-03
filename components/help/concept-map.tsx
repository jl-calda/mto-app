'use client';

// Compact, clickable concept map: the four per-system choices (left column) feed
// the System, which flows down the spine System → Model → Take-off → MTO. Nodes
// are buttons that deep-link the panel to that concept. Built from plain divs + a
// small inline SVG overlay for the connectors (no diagram dependency).

import { useHelp } from './help-context';
import { CONCEPT_BY_ID, MAP_EDGES, MAP_NODES, type ConceptId } from '@/lib/help/content';

// Grid geometry (must match the CSS grid below). Coordinates are cell centres in
// the SVG's own viewBox units; one cell = COL_W × ROW_H.
const COL_W = 150;
const ROW_H = 46;
const NODE_W = 116;
const NODE_H = 30;
const cx = (col: number) => col * COL_W + NODE_W / 2;
const cy = (row: number) => row * ROW_H + NODE_H / 2;

export function ConceptMap() {
  const { openTopic, topic } = useHelp();
  const cols = Math.max(...MAP_NODES.map((n) => n.col)) + 1;
  const rows = Math.max(...MAP_NODES.map((n) => n.row)) + 1;
  const w = (cols - 1) * COL_W + NODE_W;
  const h = (rows - 1) * ROW_H + NODE_H;

  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="uc mb-2">How it fits together</div>
      <div className="relative" style={{ width: w, height: h, maxWidth: '100%' }}>
        {/* connectors */}
        <svg className="pointer-events-none absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
          {MAP_EDGES.map((e, i) => {
            const a = MAP_NODES.find((n) => n.id === e.from)!;
            const b = MAP_NODES.find((n) => n.id === e.to)!;
            return (
              <line
                key={i}
                x1={cx(a.col)} y1={cy(a.row)} x2={cx(b.col)} y2={cy(b.row)}
                stroke="var(--line-strong)" strokeWidth={1.25}
              />
            );
          })}
        </svg>
        {/* nodes */}
        {MAP_NODES.map((n) => {
          const c = CONCEPT_BY_ID[n.id];
          const active = topic === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => openTopic(n.id as ConceptId)}
              title={c?.oneLiner}
              className="absolute flex items-center gap-1.5 rounded border px-2 text-[11px] font-medium"
              style={{
                left: n.col * COL_W,
                top: n.row * ROW_H,
                width: NODE_W,
                height: NODE_H,
                borderColor: active ? 'var(--accent)' : 'var(--line)',
                background: active ? 'var(--selected)' : 'var(--panel-2)',
                color: active ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c?.color ?? 'var(--ink-4)' }} />
              <span className="truncate">{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
