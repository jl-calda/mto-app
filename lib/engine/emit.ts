// Sub-assembly inlining — a sub-assembly is a mini-model resolved through the SAME
// evaluator with bound parameters. Each use binds its parameters against the host
// take-off context, then every sub-assembly material's rule runs through
// resolveQuantity exactly as a model material would. Cut demands flow into the
// shared cut pool (Brief 09). Nested uses resolve recursively (acyclic).

import type {
  MtoLine,
  ParameterBinding,
  ParameterDef,
  SubAssembly,
  SubAssemblyMaterial,
  SubAssemblyUse,
  Warning,
} from '@/lib/types';
import type { HostEvalContext, ResolveDeps, TraceNode } from './internal';
import { appliesWhen, resolveQuantity } from './evaluate';
import { chainValue } from './geometry/dimension-chain';

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

/** Resolve one parameter binding against the host take-off context → a number. */
export function resolveParameterBinding(b: ParameterBinding, ctx: HostEvalContext): number {
  switch (b.kind) {
    case 'literal':
      return num(b.value);
    case 'modifier_ref':
      return num(ctx.modifiers[b.modifier_name]);
    case 'criterion_ref':
      return num(ctx.criteria[b.criterion_name]);
    case 'variant_attr_ref':
      return num(ctx.variantAttrs[b.attr_name]);
    case 'chain_ref':
      return chainValue(ctx.chain, b.role);
    case 'property_ref':
      return b.input_name != null
        ? num(ctx.propertyInputs[b.property_name]?.[b.input_name])
        : num(ctx.propertyValues[b.property_name]);
    case 'algorithm_output_ref': {
      for (const out of ctx.algorithmOutputs.values()) {
        if (b.field in out.fields) return out.fields[b.field];
      }
      return 0;
    }
    case 'expression':
      // v1: numeric literal expressions only (a full expr evaluator lands later).
      return num(b.expr);
    default:
      return 0;
  }
}

/** Bind all of a use's parameters; unbound params fall back to their declared default. */
export function bindParameters(
  use: SubAssemblyUse,
  params: ParameterDef[],
  ctx: HostEvalContext,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of params) {
    const binding = use.parameter_bindings[p.name];
    out[p.name] = binding != null ? resolveParameterBinding(binding, ctx) : num(p.default);
  }
  // also honour bindings for params not declared (defensive)
  for (const [name, binding] of Object.entries(use.parameter_bindings)) {
    if (!(name in out)) out[name] = resolveParameterBinding(binding, ctx);
  }
  return out;
}

export type InlineResult = { lines: MtoLine[]; trace: TraceNode[]; warnings: Warning[] };

function paramSummary(params: Record<string, number>): string {
  const parts = Object.entries(params).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join(' · ') : 'no params';
}

/** Resolve one sub-assembly's materials (+ nested uses) with bound parameters. */
function inlineOne(
  sa: SubAssembly,
  params: Record<string, number>,
  ctx: HostEvalContext,
  deps: ResolveDeps,
  attachmentTag: string | undefined,
  depth: number,
): InlineResult {
  const lines: MtoLine[] = [];
  const warnings: Warning[] = [];
  const children: TraceNode[] = [];

  const emitMaterial = (sam: SubAssemblyMaterial) => {
    const mat = deps.materials.get(sam.material_id);
    // sub-assembly materials see the HOST variant/criteria (they are inlined into it)
    const applies = appliesWhen(sam.rule, ctx.variantName, ctx.criteria);
    if (!applies.variant || !applies.criteria) {
      children.push({ label: sam.material_id, detail: `skip · ${applies.skipReason}` });
      return;
    }
    if (sam.rule.qty_kind === 'algorithm') {
      children.push({ label: sam.material_id, detail: 'skip · algorithm-in-sub-assembly (later)' });
      return;
    }
    const q = resolveQuantity(sam.rule, ctx.propertyValues, ctx.derived, ctx.primitiveCount, ctx.chain, params);
    if (q.kind === 'skip') {
      children.push({ label: sam.material_id, detail: `skip · ${q.reason}` });
      return;
    }
    if (q.kind === 'cut') {
      if (q.cut_length > 0 && q.occurrences > 0) {
        const arr = deps.cutPool.get(sam.material_id) ?? [];
        for (let i = 0; i < q.occurrences; i++) arr.push(q.cut_length);
        deps.cutPool.set(sam.material_id, arr);
      }
      children.push({ label: sam.material_id, detail: `cut · ${q.cut_length}mm × ${q.occurrences}` });
      return;
    }
    if (q.value <= 0) {
      children.push({ label: sam.material_id, detail: 'skip · qty 0' });
      return;
    }
    if (!mat) {
      warnings.push({ level: 'warning', source: 'validation', type: 'missing_sku', message: `material ${sam.material_id} not found (in ${sa.name})`, affected_fields: [sam.id] });
    }
    lines.push({
      sku: mat?.sku ?? sam.material_id,
      material_visual: mat?.visual,
      description: mat?.name ?? sam.material_id,
      qty: q.value,
      unit: mat?.unit ?? 'ea',
      source_material_id: sam.material_id,
      source_rule_id: sam.id,
      source_sub_assembly: sa.id,
      source_attachment: attachmentTag,
    });
    children.push({ label: sam.material_id, detail: `${q.value} × ${mat?.sku ?? sam.material_id}` });
  };

  for (const sam of sa.materials) emitMaterial(sam);

  // nested sub-assembly uses (acyclic) — bind against the same host context
  if (sa.sub_assembly_uses && depth < 5) {
    for (const nested of sa.sub_assembly_uses) {
      const nestedSa = deps.resolveSubAssembly?.(nested.sub_assembly_id);
      if (!nestedSa) {
        warnings.push({ level: 'warning', source: 'validation', message: `nested sub-assembly ${nested.sub_assembly_id} not found`, affected_fields: [nested.id] });
        continue;
      }
      const nestedParams = bindParameters(nested, nestedSa.parameters, ctx);
      const r = inlineOne(nestedSa, nestedParams, ctx, deps, attachmentTag, depth + 1);
      lines.push(...r.lines);
      warnings.push(...r.warnings);
      children.push({ label: nestedSa.name, detail: `nested · ${paramSummary(nestedParams)}`, children: r.trace });
    }
  }

  return { lines, warnings, trace: [{ label: sa.name, detail: `sub-assembly · ${paramSummary(params)}`, children }] };
}

/** Inline every sub-assembly use of a model (or attachment) into the take-off. */
export function inlineSubAssemblyUses(
  uses: SubAssemblyUse[],
  ctx: HostEvalContext,
  deps: ResolveDeps,
  attachmentTag?: string,
): InlineResult {
  const lines: MtoLine[] = [];
  const warnings: Warning[] = [];
  const trace: TraceNode[] = [];
  for (const use of uses) {
    const sa = deps.resolveSubAssembly?.(use.sub_assembly_id);
    if (!sa) {
      warnings.push({ level: 'warning', source: 'validation', message: `sub-assembly ${use.sub_assembly_id} not found`, affected_fields: [use.id] });
      trace.push({ label: use.sub_assembly_id, detail: 'skip · not found' });
      continue;
    }
    const params = bindParameters(use, sa.parameters, ctx);
    const r = inlineOne(sa, params, ctx, deps, attachmentTag, 0);
    lines.push(...r.lines);
    warnings.push(...r.warnings);
    trace.push(...r.trace);
  }
  return { lines, warnings, trace };
}
