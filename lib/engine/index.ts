// The pure resolution engine — the ONLY import surface for the UI.
// Single-primitive resolution (length / height / count): the dimension chain,
// property archetypes, the quantity patterns, SKU = referenced material,
// consolidation, warnings; algorithms + cutting (Brief 08); and sub-assemblies +
// attachments (Brief 09 — recursive resolution into ONE shared cut pool).
//
// Purity contract: no I/O, no Date.now, no randomness; deterministic.
// resolveTakeoff and evaluateRuleAgainstSample share the same evaluation core.

import type {
  AlgoOutput,
  AlgorithmRegistry,
} from './algorithms/types';
import type {
  CanonicalGeometry,
  ChainRole,
  CuttingPlan,
  DimensionChain,
  Material,
  Model,
  MtoLine,
  Rule,
  SubAssembly,
  System,
  VariantSnapshot,
  Warning,
} from '@/lib/types';
import type { HostEvalContext, ResolveDeps, Suppress, TakeoffInput, TraceNode } from './internal';
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
import { inlineSubAssemblyUses } from './emit';
import {
  buildAttachmentInput,
  isAttachmentIncluded,
  resolveConnectionMaterials,
  suppressionsFor,
} from './attachments';

export type { EvalContext, ScopeInstance, XRef } from './context';
export type { Algorithm, AlgorithmRegistry, AlgoInput, AlgoOutput } from './algorithms/types';
export type { TakeoffInput, TraceNode } from './internal';
export { createRegistry, defaultRegistry, standardRegistry } from './algorithms/registry';
export { WarningSink } from './warnings';

export type ResolveTakeoffArgs = {
  system: System;
  model: Model;
  /** DENORMALIZED snapshot — never a live ref (snapshots are a correctness law). */
  variant: VariantSnapshot;
  input: TakeoffInput;
  /** Material catalogue for SKU/description resolution. */
  materials?: Material[];
  projectDefaults?: Record<string, unknown>;
  /** Resolve an attachment's attached system (with all its models) by id. */
  resolveAttachedSystem?: (id: string) => System | undefined;
  /** Resolve a sub-assembly definition by id (for model + nested uses). */
  resolveSubAssembly?: (id: string) => SubAssembly | undefined;
  algorithms?: AlgorithmRegistry;
};

/** Per-attachment outcome, surfaced for the take-off UI. */
export type AttachmentSummary = {
  id: string;
  role_label: string;
  attached_system_id: string;
  attached_system_name: string;
  included: boolean;
  line_count: number;
  derived: Record<string, number>;
};

export type TakeoffResult = {
  geometry: CanonicalGeometry;
  chain: CanonicalGeometry['dimension_chain'];
  mto: MtoLine[];
  cuttingPlans: CuttingPlan[];
  warnings: Warning[];
  trace: TraceNode[];
  counters: Record<string, number>;
  attachments: AttachmentSummary[];
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

/** The property a rule's quantity is driven by (for suppression matching). */
function targetProperty(rule: Rule): string | undefined {
  return rule.per?.kind === 'property' ? rule.per.name : undefined;
}

// ── recursive model resolution (host + sub-assemblies + attachments) ───────
type ModelResult = {
  lines: MtoLine[];
  chain: DimensionChain;
  derived: Record<string, number>;
  trace: TraceNode[];
  attachmentSummaries: AttachmentSummary[];
};

function resolveModel(
  system: System,
  model: Model,
  variant: VariantSnapshot,
  input: TakeoffInput,
  deps: ResolveDeps,
  registry: AlgorithmRegistry,
  warnings: Warning[],
  /** suppressions inherited from a parent attachment — act on THIS model's materials. */
  suppress: Suppress[],
  /** tag every line this subtree emits as belonging to an attachment. */
  attachmentTag: string | undefined,
  depth: number,
): ModelResult {
  const lines: MtoLine[] = [];
  const trace: TraceNode[] = [];
  const attachmentSummaries: AttachmentSummary[] = [];
  const algorithmOutputs = new Map<string, AlgoOutput>();

  const modifierValues = resolveModifierValues(system, model, input);
  const rawValue = readPrimitive(input.primitive_input);
  const chain = buildChain(system.primitive, rawValue, system.modifiers, modifierValues);
  const propertyVals = evaluateProperties(system.properties, chain, input.property_values ?? {});
  const derived: Record<string, number> = { free_ends_count: 2 };

  // height auto-split into flights when the climb exceeds the compliance flight max
  if (system.primitive.kind === 'height') {
    const fmKey = Object.keys(modifierValues).find((k) => /flight.*max|max.*flight/i.test(k));
    const flightMax = fmKey ? num(modifierValues[fmKey]) : 0;
    const climb = chainValue(chain, 'adjusted');
    const flights = flightMax > 0 && climb > flightMax ? Math.ceil(climb / flightMax) : 1;
    derived.flights = flights;
    derived.rest_platforms = Math.max(0, flights - 1);
    if (flights > 1) {
      warnings.push({
        level: 'info',
        source: 'engine',
        message: `Auto-split engaged: ${climb.toLocaleString()} mm exceeds flight max ${flightMax.toLocaleString()} mm → ${flights} flights, ${flights - 1} rest platform(s)`,
        affected_fields: ['primitive_input'],
      });
    }
  }
  const primitiveCount = system.primitive.kind === 'count' ? rawValue : 0;
  const vname = variantName(variant);

  // raw per-property inputs (for sub-assembly property_ref bindings)
  const propertyInputs: Record<string, Record<string, unknown>> = {};
  for (const p of system.properties) {
    propertyInputs[p.name] = (input.property_values?.[p.name] as Record<string, unknown> | undefined) ?? {};
  }

  // determine which attachments are active, then gather the suppressions that act
  // on THIS model (member 'this') BEFORE resolving its own materials.
  const instances = input.attachments ?? [];
  const instById = new Map(instances.map((i) => [i.attachment_id, i]));
  const activeAttachments = (system.attachments ?? []).filter((att) => isAttachmentIncluded(att, instById.get(att.id)));
  const effectiveSuppress: Suppress[] = [
    ...suppress,
    ...activeAttachments.flatMap((att) => suppressionsFor(att, 'this')),
  ];
  const suppressFor = (rule: Rule): Suppress | undefined => {
    const prop = targetProperty(rule);
    return prop ? effectiveSuppress.find((s) => s.property_name === prop) : undefined;
  };

  // ── model materials ──
  for (const mm of model.materials) {
    const mat = deps.materials.get(mm.material_id);
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
        source_attachment: attachmentTag,
      });
      trace.push({ label: mm.material_id, detail: `${aqty} × ${mat?.sku ?? mm.material_id} · ${algo.name}` });
      continue;
    }

    const sup = suppressFor(mm.rule);
    if (sup?.region === 'whole') {
      trace.push({ label: mm.material_id, detail: `suppressed · ${sup.property_name} (whole, ${attachmentTag ? 'attached' : 'host'})` });
      continue;
    }

    const q = resolveQuantity(mm.rule, propertyVals, derived, primitiveCount, chain);
    if (q.kind === 'skip') {
      trace.push({ label: mm.material_id, detail: `skip · ${q.reason}` });
      continue;
    }
    if (q.kind === 'cut') {
      const occurrences = sup?.region === 'at_connection' ? Math.max(0, q.occurrences - 1) : q.occurrences;
      if (q.cut_length > 0 && occurrences > 0) {
        const arr = deps.cutPool.get(mm.material_id) ?? [];
        for (let i = 0; i < occurrences; i++) arr.push(q.cut_length);
        deps.cutPool.set(mm.material_id, arr);
      }
      trace.push({ label: mm.material_id, detail: `cut · ${q.cut_length}mm × ${occurrences}${sup ? ` (−1 @connection)` : ''}` });
      continue;
    }
    const qty = sup?.region === 'at_connection' ? Math.max(0, q.value - 1) : q.value;
    if (qty <= 0) {
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
      qty,
      unit: mat?.unit ?? 'ea',
      source_material_id: mm.material_id,
      source_rule_id: mm.id,
      source_attachment: attachmentTag,
    });
    trace.push({ label: mm.material_id, detail: `${qty} × ${mat?.sku ?? mm.material_id}${sup ? ` (−1 @connection)` : ''}` });
  }

  const hostCtx: HostEvalContext = {
    variantName: vname,
    variantAttrs: variant.attributes,
    criteria: input.criteria_values ?? {},
    modifiers: modifierValues,
    chain,
    propertyValues: propertyVals,
    propertyInputs,
    derived,
    primitiveCount,
    algorithmOutputs,
  };

  // ── sub-assembly uses (inlined via the same evaluator, into the shared cut pool) ──
  const subUses = model.sub_assembly_uses ?? [];
  if (subUses.length) {
    const r = inlineSubAssemblyUses(subUses, hostCtx, deps, attachmentTag);
    lines.push(...r.lines);
    warnings.push(...r.warnings);
    if (r.trace.length) trace.push({ label: 'sub-assemblies', children: r.trace });
  }

  // ── attachments (recursive resolution into the same shared cut pool) ──
  if (depth < 6) {
    for (const att of activeAttachments) {
      const attachedSystem = deps.resolveAttachedSystem?.(att.attached_system_id);
      if (!attachedSystem) {
        warnings.push({ level: 'warning', source: 'validation', message: `attached system ${att.attached_system_id} not found`, affected_fields: [att.id] });
        trace.push({ label: att.role_label, detail: 'skip · attached system not found' });
        continue;
      }
      const inst = instById.get(att.id);
      const modelId =
        att.model_binding.kind === 'pinned'
          ? att.model_binding.model_id
          : inst?.chosen_model_id ?? att.model_binding.default_model_id;
      const attachedModel = attachedSystem.models.find((m) => m.id === modelId) ?? attachedSystem.models[0];
      if (!attachedModel) {
        warnings.push({ level: 'warning', source: 'validation', message: `attached model for ${att.attached_system_id} not found`, affected_fields: [att.id] });
        continue;
      }
      const built = buildAttachmentInput(att, attachedSystem, hostCtx, inst);
      const sub = resolveModel(
        attachedSystem,
        attachedModel,
        built.variant,
        built.input,
        deps,
        registry,
        warnings,
        suppressionsFor(att, 'attached'),
        att.id,
        depth + 1,
      );
      lines.push(...sub.lines);
      attachmentSummaries.push(...sub.attachmentSummaries);

      // connection materials are HOST model-level rules
      const cm = resolveConnectionMaterials(model, att.id, hostCtx, deps);
      lines.push(...cm.lines);
      warnings.push(...cm.warnings);

      trace.push({
        label: built.trace.label,
        detail: built.trace.detail,
        children: [
          { label: `${attachedSystem.name} · ${attachedModel.name}`, children: sub.trace },
          ...(cm.trace.length ? [{ label: 'connection materials', children: cm.trace }] : []),
        ],
      });
      attachmentSummaries.push({
        id: att.id,
        role_label: att.role_label,
        attached_system_id: att.attached_system_id,
        attached_system_name: attachedSystem.name,
        included: true,
        line_count: sub.lines.length + cm.lines.length,
        derived: built.derived,
      });
    }
  }

  return { lines, chain, derived, trace, attachmentSummaries };
}

// ── public API ──────────────────────────────────────────
export function resolveTakeoff(args: ResolveTakeoffArgs): TakeoffResult {
  const { system, model, variant, input } = args;
  const materials = new Map((args.materials ?? []).map((m) => [m.id, m]));
  const warnings: Warning[] = [];
  const registry = args.algorithms ?? standardRegistry;
  const cutPool = new Map<string, number[]>();
  const deps: ResolveDeps = {
    materials,
    cutPool,
    resolveSubAssembly: args.resolveSubAssembly,
    resolveAttachedSystem: args.resolveAttachedSystem,
  };

  const root = resolveModel(system, model, variant, input, deps, registry, warnings, [], undefined, 0);
  const lines = root.lines;

  // aggregate cut demands per cuttable material → cut_from_stock → stock lines.
  // ONE shared pool: host + sub-assemblies + attachments + connection materials.
  const cuttingPlans: CuttingPlan[] = [];
  const cutAlgo = registry.get('cut_from_stock');
  for (const [matId, demands] of cutPool) {
    if (demands.length === 0) continue;
    const mat = materials.get(matId);
    const allowance = mat?.cut_allowance ?? 0;
    const out = cutAlgo?.run({ demands, stock_options: mat?.stock_options ?? [], cut_allowance: allowance });
    if (!out) continue;
    const stocks = out.fields.stocks ?? 0;
    const detail = out.detail as { plan: { stock_length: number; cuts: number[]; offcut: number }[] };
    const plan: CuttingPlan = {
      per_stock: detail.plan.map((b) => {
        let pos = 0;
        const cuts = b.cuts.map((len) => {
          const cut = { length: len, source_material_id: matId, position_in_stock: [pos, pos + len] as [number, number] };
          pos += len + allowance;
          return cut;
        });
        return { stock_length: b.stock_length, cuts, offcut: b.offcut, kerf_total: b.cuts.length * allowance };
      }),
    };
    cuttingPlans.push(plan);
    if (stocks > 0) {
      lines.push({
        sku: mat?.sku ?? matId,
        material_visual: mat?.visual,
        description: mat?.name ?? matId,
        qty: stocks,
        unit: mat?.unit ?? 'ea',
        source_material_id: matId,
        cutting_plan: plan,
        notes: `${demands.length} cut(s)`,
      });
    }
    if (out.fields.total_offcut > (mat?.stock_options?.[0] ?? 0)) {
      warnings.push({ level: 'info', source: 'algorithm', type: 'high_wastage', message: `${mat?.name ?? matId}: ${out.fields.total_offcut.toLocaleString()} mm offcut across ${stocks} stock(s)`, affected_fields: [matId] });
    }
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
    geometry: geometryFrom(root.chain),
    chain: root.chain,
    mto,
    cuttingPlans,
    warnings,
    trace: root.trace,
    counters: {
      lines: mto.length,
      items: mto.reduce((s, l) => s + l.qty, 0),
      ...(system.primitive.kind === 'height'
        ? { flights: root.derived.flights ?? 1, rest_platforms: root.derived.rest_platforms ?? 0 }
        : {}),
      ...(root.attachmentSummaries.length ? { attachments: root.attachmentSummaries.length } : {}),
    },
    attachments: root.attachmentSummaries,
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
  const sku = material?.sku ?? null;
  if (rule.qty_kind === 'algorithm') {
    const algo = rule.algorithm_config ? standardRegistry.get(rule.algorithm_config.algorithm) : undefined;
    const out = algo?.run({ length: chainLength(chain), stock_options: material?.stock_options ?? [] });
    const aqty = out && algo ? (out.fields[algo.outputFields[0]] ?? 0) : 0;
    return {
      fires: aqty > 0,
      qty: aqty,
      sku,
      checks: { variant: true, criteria: true },
      skipReason: aqty > 0 ? undefined : 'algorithm produced 0',
      trace: { label: rule.algorithm_config?.algorithm ?? 'algorithm', detail: `${aqty}` },
    };
  }
  const q = resolveQuantity(rule, propertyVals, { free_ends_count: 2 }, system.primitive.kind === 'count' ? rawValue : 0, chain);
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
