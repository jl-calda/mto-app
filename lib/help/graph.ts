// Pure, serializable node-link DAG derived from a System — the data behind the
// Guide's dependency graph (rendered top-down with React Flow + dagre). Nodes are
// the measurement, every variant / modifier / criterion / property, every
// material (grouped by model), every model, and the MTO. Edges trace exactly what
// each material depends on — the variants/criteria/modifiers that gate it (gate),
// the property that drives its quantity (qty), the inputs that key its SKU lookup
// (sku), and the measurement when its quantity is geometry-driven (measure) —
// then the structural backbone material → model → MTO (feeds). No React; tested
// in isolation. Standalone (no import from tree.ts) to avoid a cycle.

import type { Material, System, SystemVariantRef, Visual } from '@/lib/types';
import { MAP_EDGES, MAP_NODES, type ConceptId } from './content';

export type GraphNodeKind =
  | 'measurement'
  | 'variant'
  | 'modifier'
  | 'criterion'
  | 'property'
  | 'material'
  | 'model'
  | 'mto'
  | 'system' // generic concept-map only
  | 'takeoff'; // generic concept-map only

export type GraphEdgeRole = 'gate' | 'qty' | 'sku' | 'feeds' | 'measure';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  sub?: string;
  /** Colours the node and (for input nodes) is the glossary deep-link target. */
  concept?: ConceptId;
  /** Material nodes: the owning model's name. */
  model?: string;
  /** Material nodes: the catalogue visual (icon/image/placeholder). */
  visual?: Visual;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  role: GraphEdgeRole;
  label?: string;
}
export interface GraphModel {
  title?: string;
  subtitle?: string;
  /** Single-model systems surface the model's name as the header (no model node). */
  modelName?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const rowName = (r: SystemVariantRef): string => (r.kind === 'local' ? r.name : r.variant_id);
const val = (v: unknown): string => String(v);

/** Build the dependency DAG from a System. Pass the global material catalogue to
 *  resolve material names/SKUs (else material ids show). Pure & deterministic. */
export function buildSystemGraph(system: System, materials: Material[] = []): GraphModel {
  const byId = new Map(materials.map((m) => [m.id, m]));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const ids = new Set<string>();
  const seen = new Set<string>();

  const addNode = (n: GraphNode) => {
    if (ids.has(n.id)) return;
    ids.add(n.id);
    nodes.push(n);
  };
  // Only connects endpoints that exist (guards against rules referencing inputs
  // not declared on the system) and de-dupes by role+source+target.
  const addEdge = (source: string, target: string, role: GraphEdgeRole, label?: string) => {
    if (!ids.has(source) || !ids.has(target)) return;
    const id = `${role}:${source}->${target}`;
    if (seen.has(id)) return;
    seen.add(id);
    edges.push({ id, source, target, role, label });
  };

  // ── input nodes (all declared inputs — unconnected ones are informative) ──
  addNode({
    id: 'meas', kind: 'measurement', concept: 'system',
    label: system.primitive.kind,
    sub: system.primitive.kind === 'length' && system.primitive.segmentable ? 'segmentable' : undefined,
  });
  for (const r of system.variants.rows) {
    const name = rowName(r);
    addNode({ id: `var:${name}`, kind: 'variant', concept: 'variant', label: name });
  }
  for (const m of system.modifiers) {
    addNode({ id: `mod:${m.name}`, kind: 'modifier', concept: 'modifier', label: m.name, sub: m.group });
  }
  for (const c of system.criteria) {
    addNode({
      id: `crit:${c.library_id}`, kind: 'criterion', concept: 'criterion', label: c.library_id,
      sub: c.default_value != null ? `default ${val(c.default_value)}` : undefined,
    });
  }
  for (const p of system.properties) {
    addNode({ id: `prop:${p.name}`, kind: 'property', concept: 'property', label: p.name, sub: p.archetype });
  }

  // ── outputs: each material's dependency edges. There's no separate MTO node.
  //    A single model is surfaced as the graph header (materials are the terminal
  //    outputs); multiple models stay as terminal grouping nodes so their
  //    materials remain distinguishable.
  const singleModel = system.models.length === 1;
  for (const model of system.models) {
    const modelId = `model:${model.name}`;
    if (!singleModel) addNode({ id: modelId, kind: 'model', concept: 'model', label: model.name, sub: model.status });
    for (const mm of model.materials) {
      const M = `mat:${mm.id}`;
      const cat = byId.get(mm.material_id);
      addNode({
        id: M, kind: 'material', label: cat?.name ?? mm.material_id,
        sub: cat ? `${cat.sku} · ${cat.unit}` : undefined, model: model.name, visual: cat?.visual,
      });
      const r = mm.rule;
      // gate — which inputs decide whether this material applies
      for (const v of r.applies_when.variants ?? []) addEdge(`var:${v}`, M, 'gate');
      for (const [c, vals] of Object.entries(r.applies_when.criteria ?? {})) addEdge(`crit:${c}`, M, 'gate', vals.join('/'));
      for (const [mod, vals] of Object.entries(r.applies_when.modifiers ?? {})) addEdge(`mod:${mod}`, M, 'gate', vals.join('/'));
      // qty — the property that drives how many
      if (r.qty_kind === 'per' && r.per?.kind === 'property') addEdge(`prop:${r.per.name}`, M, 'qty', 'per');
      // sku — the inputs that key this material's SKU lookup
      for (const k of r.sku_lookup?.keys ?? []) {
        if (k.kind === 'modifier' || k.kind === 'modifier_band') addEdge(`mod:${k.name}`, M, 'sku', 'SKU');
        else if (k.kind === 'criterion') addEdge(`crit:${k.name}`, M, 'sku', 'SKU');
        else if (k.kind === 'property_input') addEdge(`prop:${k.property}`, M, 'sku', 'SKU');
        else if (k.kind === 'variant_attr') addEdge(`var:${k.name}`, M, 'sku', 'SKU');
      }
      // measure — quantity derives from the measured geometry / primitive
      const measureDriven =
        r.qty_kind === 'per_length' || r.qty_kind === 'cut' || r.qty_kind === 'algorithm' ||
        (r.qty_kind === 'per' && (r.per?.kind === 'primitive_input' || r.per?.kind === 'unit_of_length' || r.per?.kind === 'algorithm_output'));
      if (measureDriven) addEdge('meas', M, 'measure');
      // structural — group materials under their model only when several coexist
      if (!singleModel) addEdge(M, modelId, 'feeds');
    }
  }

  return {
    title: system.name,
    subtitle: singleModel ? `${system.primitive.kind} system` : `${system.primitive.kind} system · ${system.models.length} models`,
    modelName: singleModel ? system.models[0]?.name : undefined,
    nodes, edges,
  };
}

/** The concept-level fallback DAG (no concrete system) — System → Model → Take-off
 *  → MTO with the four choices feeding the system. Built from content's MAP_*. */
export function buildGenericGraph(): GraphModel {
  const nodes: GraphNode[] = MAP_NODES.map((n) => ({
    id: n.id,
    kind: n.id as GraphNodeKind, // every MAP_NODES id is one of our kinds
    label: n.label,
    concept: n.id as ConceptId,
  }));
  const edges: GraphEdge[] = MAP_EDGES.map((e) => ({
    id: `feeds:${e.from}->${e.to}`, source: e.from, target: e.to, role: 'feeds' as const,
  }));
  return { subtitle: 'how a system produces an MTO', nodes, edges };
}
