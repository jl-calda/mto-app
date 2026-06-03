'use client';

// The Guide's dependency graph rendered as a top-down node-link DAG (React Flow +
// dagre layout): the measurement / variants / modifiers / criteria / properties
// flow down into each material, then material → model → MTO. Edges are coloured by
// role (gate / qty / sku / measure / feeds). Selecting a material highlights just
// the inputs it depends on; clicking an input deep-links to its glossary card.
// Driven by the system graph on `model.graph`, or the generic concept map.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls,
  Handle, Position, MarkerType, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useHelp } from './help-context';
import { CONCEPT_BY_ID } from '@/lib/help/content';
import { buildGenericGraph, type GraphEdge, type GraphEdgeRole, type GraphModel, type GraphNode } from '@/lib/help/graph';
import type { TreeModel } from '@/lib/help/tree';

const NODE_W = 184;
const NODE_H = 48;

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

// ── custom node (one component, styled by kind/concept) ──
function FlowNode({ data }: NodeProps) {
  const d = data as unknown as GraphNode;
  const color = d.concept ? CONCEPT_BY_ID[d.concept].color : 'var(--ink-3)';
  const material = d.kind === 'material';
  const mto = d.kind === 'mto';
  const clickable = material || !!d.concept;
  return (
    <div
      title={d.label}
      style={{
        width: NODE_W, minHeight: NODE_H,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1,
        padding: '6px 9px', borderRadius: 6,
        border: `1px solid ${material ? 'var(--line-strong)' : 'var(--line)'}`,
        borderLeft: `3px solid ${color}`,
        background: material ? 'var(--panel-2)' : 'var(--panel)',
        boxShadow: 'var(--shadow-card)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          fontSize: 12, fontWeight: mto ? 700 : 500, color: 'var(--ink)', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {d.label}
      </div>
      {d.sub && <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.sub}</div>}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
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

function layout(model: GraphModel): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 24, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of model.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of model.edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  const nodes: Node[] = model.nodes.map((n) => {
    const p = g.node(n.id);
    return {
      id: n.id, type: 'node',
      data: n as unknown as Record<string, unknown>,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      sourcePosition: Position.Bottom, targetPosition: Position.Top,
    };
  });
  return { nodes, edges: model.edges.map(toEdge) };
}

function Flow({ graph }: { graph: GraphModel }) {
  const { openTopic } = useHelp();
  const rf = useReactFlow();
  const base = useMemo(() => layout(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(base.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);
  const [selected, setSelected] = useState<string | null>(null);

  // Re-layout + refit when the graph changes (different system, or live wizard edits).
  useEffect(() => {
    setNodes(base.nodes);
    setEdges(base.edges);
    setSelected(null);
    const id = requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 200 }));
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
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      nodesConnectable={false}
      proOptions={{ hideAttribution: false }}
    >
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
      {(graph.title || graph.subtitle) && (
        <div>
          {graph.title && <div className="text-[13px] font-semibold">{graph.title}</div>}
          {graph.subtitle && <div className="mono text-[10px] text-ink-3">{graph.subtitle}</div>}
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
