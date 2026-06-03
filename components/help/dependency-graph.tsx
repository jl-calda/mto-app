'use client';

// The Guide's dependency graph rendered as a node-link DAG (React Flow + dagre):
// the measurement / variants / modifiers / criteria / properties flow into each
// material, then material → model → MTO. Edges are coloured by role (gate / qty /
// sku / measure / feeds). Selecting a material highlights just the inputs it
// depends on; clicking an input deep-links to its glossary card.
//
// Orientation adapts to the graph's shape: it lays out top-down, but TRANSPOSES to
// left-to-right when the graph is wider than it is deep (more nodes per rank than
// ranks) — otherwise a shallow, wide DAG fits a side panel only at an unreadable
// zoom. So a system's wide inputs→materials graph reads left-to-right (the long
// dimension scrolls), while the deep/narrow generic concept map stays top-down.

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, Panel,
  Handle, Position, MarkerType, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useHelp } from './help-context';
import { Visual } from '@/components/visual';
import { CONCEPT_BY_ID } from '@/lib/help/content';
import { buildGenericGraph, type GraphEdge, type GraphEdgeRole, type GraphModel, type GraphNode } from '@/lib/help/graph';
import type { TreeModel } from '@/lib/help/tree';

const NODE_W = 184;
const NODE_H = 54;

const ROLE_COLOR: Record<GraphEdgeRole, string> = {
  gate: 'var(--ink-3)',
  qty: 'var(--ok)',
  sku: 'var(--accent)',
  feeds: 'var(--line-strong)',
  measure: 'var(--ink-4)',
};
const ROLE_LABEL: Record<GraphEdgeRole, string> = {
  gate: 'gates', qty: 'drives qty', sku: 'picks SKU', feeds: 'feeds', measure: 'measured',
};

type FlowData = GraphNode & { lr: boolean };

const LABEL_STYLE: CSSProperties = { fontSize: 12, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const SUB_STYLE: CSSProperties = { fontSize: 9, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const KIND_LABEL: Record<string, string> = {
  measurement: 'Measurement', variant: 'Variant', modifier: 'Modifier', criterion: 'Criterion', property: 'Property',
};
const INPUT_KINDS = new Set(['measurement', 'variant', 'modifier', 'criterion', 'property']);

// ── custom node (one component, styled by kind/concept) ──
// Inputs lead with a coloured dot + UPPERCASE kind so their type is unmistakable;
// materials lead with their catalogue icon.
function FlowNode({ data }: NodeProps) {
  const d = data as unknown as FlowData;
  const color = d.concept ? CONCEPT_BY_ID[d.concept].color : 'var(--ink-3)';
  const material = d.kind === 'material';
  const mto = d.kind === 'mto';
  const isInput = INPUT_KINDS.has(d.kind);
  const clickable = material || !!d.concept;
  return (
    <div
      title={d.label}
      style={{
        width: NODE_W, minHeight: NODE_H,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
        padding: '6px 9px', borderRadius: 6,
        border: `1px solid ${material ? 'var(--line-strong)' : 'var(--line)'}`,
        borderLeft: `3px solid ${color}`,
        background: material ? 'var(--panel-2)' : 'var(--panel)',
        boxShadow: 'var(--shadow-card)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <Handle type="target" position={d.lr ? Position.Left : Position.Top} style={{ opacity: 0 }} />
      {material ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <Visual visual={d.visual} name={d.label} size={22} rounded={4} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...LABEL_STYLE, fontWeight: 500 }}>{d.label}</div>
            {d.sub && <div className="mono" style={SUB_STYLE}>{d.sub}</div>}
          </div>
        </div>
      ) : (
        <>
          {isInput && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color }}>
                {KIND_LABEL[d.kind]}
              </span>
            </div>
          )}
          <div style={{ ...LABEL_STYLE, fontWeight: mto ? 700 : 500 }}>{d.label}</div>
          {d.sub && <div className="mono" style={SUB_STYLE}>{d.sub}</div>}
        </>
      )}
      <Handle type="source" position={d.lr ? Position.Right : Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// Defined once at module scope (React Flow warns if the object identity changes).
const NODE_TYPES = { node: FlowNode };

function toEdge(e: GraphEdge): Edge {
  const color = ROLE_COLOR[e.role];
  return {
    id: e.id, source: e.source, target: e.target,
    type: 'smoothstep',
    label: e.label,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
    style: { stroke: color, strokeWidth: 1.5, strokeDasharray: e.role === 'measure' ? '4 3' : undefined },
    labelStyle: { fontSize: 9, fill: 'var(--ink-2)' },
    labelBgStyle: { fill: 'var(--panel)', fillOpacity: 0.9 },
    labelBgPadding: [3, 1] as [number, number],
    labelBgBorderRadius: 2,
    data: { role: e.role },
  };
}

/** Longest-path layering → graph depth (rank count) and breadth (max nodes/rank). */
function shape(model: GraphModel): { depth: number; breadth: number } {
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of model.nodes) { indeg.set(n.id, 0); adj.set(n.id, []); }
  for (const e of model.edges) {
    if (!adj.has(e.source) || !indeg.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, indeg.get(e.target)! + 1);
  }
  const layer = new Map<string, number>();
  const q: string[] = [];
  for (const [id, d] of indeg) if (d === 0) { layer.set(id, 0); q.push(id); }
  while (q.length) {
    const u = q.shift()!;
    const lu = layer.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      layer.set(v, Math.max(layer.get(v) ?? 0, lu + 1));
      indeg.set(v, indeg.get(v)! - 1);
      if (indeg.get(v) === 0) q.push(v);
    }
  }
  const perLayer = new Map<number, number>();
  let depth = 1;
  for (const n of model.nodes) {
    const l = layer.get(n.id) ?? 0;
    perLayer.set(l, (perLayer.get(l) ?? 0) + 1);
    depth = Math.max(depth, l + 1);
  }
  return { depth, breadth: Math.max(1, ...perLayer.values()) };
}

function layout(model: GraphModel, force?: 'TB' | 'LR'): { nodes: Node[]; edges: Edge[]; lr: boolean } {
  const { depth, breadth } = shape(model);
  // auto (no override): transpose wide-and-shallow graphs so they stay legible
  const lr = force ? force === 'LR' : breadth > depth;
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: lr ? 'LR' : 'TB', ranksep: lr ? 80 : 60, nodesep: lr ? 16 : 26, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of model.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of model.edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  const nodes: Node[] = model.nodes.map((n) => {
    const p = g.node(n.id);
    return {
      id: n.id, type: 'node',
      data: { ...n, lr } as unknown as Record<string, unknown>,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      sourcePosition: lr ? Position.Right : Position.Bottom,
      targetPosition: lr ? Position.Left : Position.Top,
    };
  });
  return { nodes, edges: model.edges.map(toEdge), lr };
}

function Flow({ graph }: { graph: GraphModel }) {
  const { openTopic } = useHelp();
  const rf = useReactFlow();
  const [orient, setOrient] = useState<'auto' | 'TB' | 'LR'>('auto');
  const base = useMemo(() => layout(graph, orient === 'auto' ? undefined : orient), [graph, orient]);
  const [nodes, setNodes, onNodesChange] = useNodesState(base.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);
  const [selected, setSelected] = useState<string | null>(null);

  // Re-layout + refit when the graph changes (different system, or live wizard edits).
  useEffect(() => {
    setNodes(base.nodes);
    setEdges(base.edges);
    setSelected(null);
    const id = requestAnimationFrame(() => rf.fitView({ padding: 0.12, duration: 200 }));
    return () => cancelAnimationFrame(id);
  }, [base, setNodes, setEdges, rf]);

  // The dependency set of the selected material (its incoming edges + their sources).
  const dep = useMemo(() => {
    if (!selected) return null;
    const incoming = graph.edges.filter((e) => e.target === selected);
    return {
      edges: new Set(incoming.map((e) => e.id)),
      nodes: new Set<string>([selected, ...incoming.map((e) => e.source)]),
    };
  }, [selected, graph]);

  const viewNodes = useMemo(() => (
    !dep ? nodes : nodes.map((n) => ({ ...n, style: { ...n.style, opacity: dep.nodes.has(n.id) ? 1 : 0.2 } }))
  ), [nodes, dep]);
  const viewEdges = useMemo(() => (
    !dep ? edges : edges.map((e) => {
      const on = dep.edges.has(e.id);
      return { ...e, animated: on, style: { ...e.style, opacity: on ? 1 : 0.1, strokeWidth: on ? 2.4 : 1.5 } };
    })
  ), [edges, dep]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    const d = node.data as unknown as GraphNode;
    if (d.kind === 'material') setSelected((prev) => (prev === node.id ? null : node.id));
    else {
      setSelected(null);
      if (d.concept) openTopic(d.concept);
    }
  }, [openTopic]);

  return (
    <ReactFlow
      nodes={viewNodes}
      edges={viewEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={() => setSelected(null)}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.2}
      maxZoom={1.6}
      nodesConnectable={false}
      proOptions={{ hideAttribution: false }}
    >
      <Panel position="top-right">
        <button
          type="button"
          className="btn sm"
          onClick={() => setOrient(base.lr ? 'TB' : 'LR')}
          title="Transpose — swap the graph between top-down and left-right"
        >
          ⇄ {base.lr ? 'top-down' : 'left-right'}
        </button>
      </Panel>
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--line)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

const GENERIC_GRAPH = buildGenericGraph();

const LEGEND: GraphEdgeRole[] = ['gate', 'qty', 'sku', 'measure', 'feeds'];

export function DependencyGraph({ model }: { model: TreeModel }) {
  const graph = model.graph ?? GENERIC_GRAPH;
  return (
    <div className="flex flex-col gap-2">
      {(graph.title || graph.subtitle || graph.modelName) && (
        <div className="flex flex-col gap-0.5">
          {graph.title && <div className="text-[13px] font-semibold">{graph.title}</div>}
          {graph.modelName ? (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CONCEPT_BY_ID.model.color }} />
              <span className="font-medium">{graph.modelName}</span>
              <span className="uc text-ink-4">model</span>
            </div>
          ) : graph.subtitle ? (
            <div className="mono text-[10px] text-ink-3">{graph.subtitle}</div>
          ) : null}
        </div>
      )}
      <div
        className="overflow-hidden rounded-md border border-line bg-panel"
        style={{ width: '100%', height: 'calc(100vh - var(--h-topbar) - 168px)', minHeight: 420 }}
      >
        <ReactFlowProvider>
          <Flow graph={graph} />
        </ReactFlowProvider>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {LEGEND.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 text-[9px] text-ink-3">
            <span style={{ display: 'inline-block', width: 12, height: 0, borderTop: `2px ${r === 'measure' ? 'dashed' : 'solid'} ${ROLE_COLOR[r]}` }} />
            {ROLE_LABEL[r]}
          </span>
        ))}
        <span className="text-[9px] text-ink-4">· click a material to trace its dependencies · click an input to read about it</span>
      </div>
    </div>
  );
}
