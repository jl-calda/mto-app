// The pure resolution engine — the ONLY import surface for the UI.
// v1 implements single-primitive resolution (length / height / count): the
// dimension chain, property archetypes, the quantity patterns, SKU = referenced
// material, consolidation, and basic warnings. Segmentation (Brief 07), algorithms
// + cutting (Brief 08) and sub-assemblies/attachments (Brief 09) layer in next.
//
// Purity contract: no I/O, no Date.now, no randomness; deterministic.
// resolveTakeoff and evaluateRuleAgainstSample share the same evaluation core.

import type {
  CanonicalGeometry,
  ChainRole,
  CuttingPlan,
  Material,
  Model,
  MtoLine,
  Rule,
  System,
  VariantSnapshot,
  Warning,
} from '@/lib/types';
import type { AlgorithmRegistry, AlgoOutput } from './algorithms/types';
import type { XRef } from './context';
import { standardRegistry } from './algorithms/registry';
import { buildChain, chainValue, chainLength } from './geometry/dimension-chain';
import {
  appliesWhen,
  evaluateProperties,
  readPrimitive,
  resolveQuantity,
  variantName,
} from './evaluate';

export type { EvalContext, ScopeInstance, XRef } from './context';
export type { Algorithm, AlgorithmRegistry, AlgoInput, AlgoOutput } from './algorithms/types';
export { createRegistry, defaultRegistry, standardRegistry } from './algorithms/registry';
export { WarningSink } from './warnings';

export type TakeoffInput = {
  criteria_values: Record<string, unknown>;
  modifier_values: Record<string, unknown>;
  primitive_input: unknown;
  property_values: Record<string, unknown>;
  attachments?: unknown[];
};

export type ResolveTakeoffArgs = {
  system: System;
  model: Model;
  /** DENORMALIZED snapshot — never a live ref (snapshots are a correctness law). */
  variant: VariantSnapshot;
  input: TakeoffInput;
  /** Material catalogue for SKU/description resolution. */
  materials?: Material[];
  projectDefaults?: Record<string, unknown>;
  resolveAttachedSystem?: (id: string) => { system: System; model: Model };
  algorithms?: AlgorithmRegistry;
};

export type TraceNode = { label: string; detail?: string; children?: TraceNode[] };

export type TakeoffResult = {
  geometry: CanonicalGeometry;
  chain: CanonicalGeometry['dimension_chain'];
  mto: MtoLine[];
  cuttingPlans: CuttingPlan[];
  warnings: Warning[];
  trace: TraceNode[];
  counters: Record<string, number>;
};

export type SampleInput = {
  variant: string;
  criteria: Record<string, unknown>;
  properties: Record<string, unknown>;
  primitive: Record<string, number>;
};

export type CutDemandResult = { cut_length: number; occurrences: number };

export type RuleEvalResult = {
  fires: boolean;
  qty: number | CutDemandResult;
  sku: string | null;
  checks: { variant: boolean; criteria: boolean };
  skipReason?: string;
  trace: TraceNode;
};

export type RuleContext = {
  variants: string[];
  criteria: Record<string, string[]>;
  properties: { name: string; archetype: string; kind: 'count' | 'length' }[];
  modifiers: string[];
  derived: string[];
  algoOutputs: { algo: string; fields: string[] }[];
  xrefs: XRef[];
};

// ── helpers ─────────────────────────────────────────────
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

function resolveModifierValues(system: System, model: Model, input: TakeoffInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const m of system.modifiers) if (m.default_value != null) out[m.name] = m.default_value;
  Object.assign(out, model.modifier_defaults ?? {});
  Object.assign(out, input.modifier_values ?? {});
  return out;
}

function geometryFrom(chain: CanonicalGeometry['dimension_chain']): CanonicalGeometry {
  const measured = chain.steps[0]?.value ?? 0;
  const v = (r: ChainRole) => chainValue(chain, r);
  return {
    measured_range: [0, measured],
    effective_range: [0, v('adjusted')],
    installed_range: [0, v('constrained')],
    physical_range: [0, v('quantized')],
    free_ends_count: 2,
    end_roles: { start: 'free', end: 'free' },
    orientation: 'horizontal',
    is_loop: false,
    dimension_chain: chain,
  };
}

// ── public API ──────────────────────────────────────────
export function resolveTakeoff(args: ResolveTakeoffArgs): TakeoffResult {
  const { system, model, variant, input } = args;
  const materials = new Map((args.materials ?? []).map((m) => [m.id, m]));
  const warnings: Warning[] = [];
  const trace: TraceNode[] = [];
  const registry = args.algorithms ?? standardRegistry;
  const algorithmOutputs = new Map<string, AlgoOutput>();

  const modifierValues = resolveModifierValues(system, model, input);
  const rawValue = readPrimitive(input.primitive_input);
  const chain = buildChain(system.primitive, rawValue, system.modifiers, modifierValues);
  const propertyVals = evaluateProperties(system.properties, chain, input.property_values ?? {});
  const derived: Record<string, number> = { free_ends_count: 2 };
  const primitiveCount = system.primitive.kind === 'count' ? rawValue : 0;
  const vname = variantName(variant);

  const lines: MtoLine[] = [];
  for (const mm of model.materials) {
    const mat = materials.get(mm.material_id);
    const applies = appliesWhen(mm.rule, vname, input.criteria_values ?? {});
    if (!applies.variant || !applies.criteria) {
      trace.push({ label: mm.material_id, detail: `skip · ${applies.skipReason}` });
      continue;
    }
    if (mm.rule.qty_kind === 'algorithm') {
      const cfg = mm.rule.algorithm_config;
      const algo = cfg ? registry.get(cfg.algorithm) : undefined;
      if (!algo) {
        trace.push({ label: mm.material_id, detail: 'skip · algorithm not registered' });
        continue;
      }
      const out = algo.run({ length: chainLength(chain), stock_options: mat?.stock_options ?? [] });
      algorithmOutputs.set(mm.id, out);
      const aqty = out.fields[algo.outputFields[0]] ?? 0;
      if (aqty <= 0) {
        trace.push({ label: mm.material_id, detail: 'skip · algorithm qty 0' });
        continue;
      }
      if (!mat) {
        warnings.push({ level: 'warning', source: 'validation', type: 'missing_sku', message: `material ${mm.material_id} not found`, affected_fields: [mm.id] });
      }
      lines.push({
        sku: mat?.sku ?? mm.material_id,
        material_visual: mat?.visual,
        description: mat?.name ?? mm.material_id,
        qty: aqty,
        unit: mat?.unit ?? 'ea',
        source_material_id: mm.material_id,
        source_rule_id: mm.id,
      });
      trace.push({ label: mm.material_id, detail: `${aqty} × ${mat?.sku ?? mm.material_id} · ${algo.name}` });
      continue;
    }

    const q = resolveQuantity(mm.rule, propertyVals, derived, primitiveCount, chain);
    if (q.kind === 'skip') {
      trace.push({ label: mm.material_id, detail: `skip · ${q.reason}` });
      continue;
    }
    if (q.kind === 'cut') {
      // cut demands aggregate in Brief 08; record for now.
      trace.push({ label: mm.material_id, detail: `cut · ${q.cut_length}mm × ${q.occurrences}` });
      continue;
    }
    if (q.value <= 0) {
      trace.push({ label: mm.material_id, detail: 'skip · qty 0' });
      continue;
    }
    if (!mat) {
      warnings.push({ level: 'warning', source: 'validation', type: 'missing_sku', message: `material ${mm.material_id} not found`, affected_fields: [mm.id] });
    }
    lines.push({
      sku: mat?.sku ?? mm.material_id,
      material_visual: mat?.visual,
      description: mat?.name ?? mm.material_id,
      qty: q.value,
      unit: mat?.unit ?? 'ea',
      source_material_id: mm.material_id,
      source_rule_id: mm.id,
    });
    trace.push({ label: mm.material_id, detail: `${q.value} × ${mat?.sku ?? mm.material_id}` });
  }

  // consolidate identical SKUs
  const bySku = new Map<string, MtoLine>();
  for (const l of lines) {
    const ex = bySku.get(l.sku);
    if (ex) ex.qty += l.qty;
    else bySku.set(l.sku, { ...l });
  }
  const mto = [...bySku.values()];

  return {
    geometry: geometryFrom(chain),
    chain,
    mto,
    cuttingPlans: [],
    warnings,
    trace,
    counters: { lines: mto.length, items: mto.reduce((s, l) => s + l.qty, 0) },
  };
}

export function evaluateRuleAgainstSample(
  rule: Rule,
  system: System,
  sample: SampleInput,
  material?: Material,
): RuleEvalResult {
  const applies = appliesWhen(rule, sample.variant, sample.criteria ?? {});
  const fires = applies.variant && applies.criteria;
  if (!fires) {
    return {
      fires: false,
      qty: 0,
      sku: null,
      checks: { variant: applies.variant, criteria: applies.criteria },
      skipReason: applies.skipReason,
      trace: { label: 'applies_when', detail: applies.skipReason },
    };
  }
  const rawValue = num(Object.values(sample.primitive ?? {})[0]);
  const chain = buildChain(system.primitive, rawValue, system.modifiers, {});
  const propertyVals = evaluateProperties(system.properties, chain, sample.properties ?? {});
  const q = resolveQuantity(rule, propertyVals, { free_ends_count: 2 }, system.primitive.kind === 'count' ? rawValue : 0, chain);
  const sku = material?.sku ?? null;
  if (q.kind === 'cut') {
    return { fires: true, qty: { cut_length: q.cut_length, occurrences: q.occurrences }, sku, checks: { variant: true, criteria: true }, trace: { label: 'cut', detail: `${q.cut_length}mm × ${q.occurrences}` } };
  }
  if (q.kind === 'skip') {
    return { fires: false, qty: 0, sku, checks: { variant: true, criteria: true }, skipReason: q.reason, trace: { label: 'quantity', detail: q.reason } };
  }
  return { fires: true, qty: q.value, sku, checks: { variant: true, criteria: true }, trace: { label: 'quantity', detail: `${q.value}` } };
}

export function deriveRuleContext(system: System, _model?: Model): RuleContext {
  const variants = system.variants.rows.map((r) => (r.kind === 'local' ? r.name : r.variant_id));
  const criteria: Record<string, string[]> = {};
  for (const c of system.criteria) criteria[c.library_id] = c.default_value != null ? [String(c.default_value)] : [];
  const properties = system.properties.map((p) => ({
    name: p.name,
    archetype: p.archetype as string,
    kind: (p.archetype === 'rate' || p.archetype === 'stock' ? 'length' : 'count') as 'count' | 'length',
  }));
  const modifiers = system.modifiers.map((m) => m.name);
  const derived = ['free_ends_count'];
  const xrefs: XRef[] = [
    ...properties.map((p): XRef => ({ kind: 'property', name: p.name })),
    ...properties.filter((p) => p.kind === 'length').map((p): XRef => ({ kind: 'property_length', name: p.name })),
    ...derived.map((d): XRef => ({ kind: 'derived', name: d })),
    { kind: 'chain', role: 'input' },
    { kind: 'chain', role: 'adjusted' },
    { kind: 'chain', role: 'constrained' },
    { kind: 'chain', role: 'quantized' },
    { kind: 'primitive_input' },
  ];
  return { variants, criteria, properties, modifiers, derived, algoOutputs: [], xrefs };
}
