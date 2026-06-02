// Attachments — an optional other system that physically connects to the host
// (the ladder + top-walkway case). The host's geometry feeds three buckets of
// inputs for the attached system:
//   • derived  — computed from the connection constraints (e.g. deck height = climb)
//   • preset   — model/attachment defaults, locked or editable
//   • open     — what the estimator fills at take-off
// The attached system is then resolved through the SAME engine core (recursively),
// its cut demands join the host's ONE shared cut pool, suppressions remove members
// duplicated at the joint, and connection materials (model-level rules) are added.

import type {
  Attachment,
  AttachmentInstance,
  ConnectionConstraint,
  Model,
  MtoLine,
  PresetTarget,
  Suppression,
  System,
  SystemVariantRef,
  VariantSnapshot,
  Warning,
} from '@/lib/types';
import type { HostEvalContext, ResolveDeps, Suppress, TakeoffInput, TraceNode } from './internal';
import { appliesWhen, resolveQuantity } from './evaluate';
import { chainValue } from './geometry/dimension-chain';

/** Is this attachment included for the current take-off? */
export function isAttachmentIncluded(att: Attachment, instance?: AttachmentInstance): boolean {
  if (instance) return instance.included;
  return att.default_included;
}

/** Split an attachment's suppressions by the member they act on. */
export function suppressionsFor(att: Attachment, member: 'this' | 'attached'): Suppress[] {
  return att.suppressions
    .filter((s: Suppression) => s.member === member)
    .map((s) => ({ property_name: s.property_name, region: s.region ?? 'at_connection' }));
}

function snapshotFor(r: SystemVariantRef): VariantSnapshot {
  return r.kind === 'local'
    ? { source_ref: r, attributes: r.attributes }
    : { source_ref: r, snapshot_version: r.pinned_version, attributes: {} };
}
function rowName(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}

/** Read a host field referenced by a connection constraint. */
function readHostField(field: string, host: HostEvalContext): number {
  if (field.startsWith('chain.')) return chainValue(host.chain, field.slice(6) as never);
  if (field.startsWith('derived.')) return host.derived[field.slice(8)] ?? 0;
  if (field.startsWith('property.')) return host.propertyValues[field.slice(9)] ?? 0;
  if (['input', 'adjusted', 'constrained', 'quantized'].includes(field)) return chainValue(host.chain, field as never);
  if (field in host.derived) return host.derived[field];
  if (field in host.propertyValues) return host.propertyValues[field];
  return chainValue(host.chain, 'adjusted');
}

/** The numeric value a connection constraint contributes to the derived bucket. */
function constraintValue(c: ConnectionConstraint, host: HostEvalContext): number | null {
  switch (c.kind) {
    case 'height_match':
      return readHostField(c.from_field, host);
    case 'clearance':
      return c.min;
    case 'alignment':
      return null; // geometric only — no scalar to derive
    default:
      return null;
  }
}

function targetKey(t: PresetTarget): string {
  switch (t.kind) {
    case 'variant': return 'variant';
    case 'criterion': return `crit:${t.name}`;
    case 'modifier': return `mod:${t.name}`;
    case 'property_input': return `prop:${t.property}.${t.input}`;
    case 'primitive_input_field': return `prim:${t.field}`;
  }
}

export type AttachmentResolveInput = {
  variant: VariantSnapshot;
  input: TakeoffInput;
  /** the derived-bucket values, for surfacing in the UI/trace. */
  derived: Record<string, number>;
  trace: TraceNode;
};

/** Build the attached system's take-off input from the three buckets. */
export function buildAttachmentInput(
  att: Attachment,
  attachedSystem: System,
  hostCtx: HostEvalContext,
  instance?: AttachmentInstance,
): AttachmentResolveInput {
  const input: TakeoffInput = {
    criteria_values: {},
    modifier_values: {},
    property_values: {},
    primitive_input: undefined,
  };
  const locked = new Set<string>();
  const derivedValues: Record<string, number> = {};
  let chosenVariant: string | undefined;

  const setField = (t: PresetTarget, value: unknown) => {
    switch (t.kind) {
      case 'variant':
        chosenVariant = String(value);
        break;
      case 'criterion':
        input.criteria_values[t.name] = value;
        break;
      case 'modifier':
        input.modifier_values[t.name] = value;
        break;
      case 'property_input': {
        const cur = (input.property_values[t.property] as Record<string, unknown>) ?? {};
        input.property_values[t.property] = { ...cur, [t.input]: value };
        break;
      }
      case 'primitive_input_field': {
        const cur = (input.primitive_input as Record<string, unknown> | undefined) ?? { mode: 'single' };
        input.primitive_input = { ...cur, [t.field]: value };
        break;
      }
    }
  };

  // 1) derived bucket
  const derivedNotes: string[] = [];
  for (const db of att.derived_bindings) {
    const v = constraintValue(db.source, hostCtx);
    if (v == null) continue;
    setField(db.target, v);
    derivedValues[targetKey(db.target)] = v;
    derivedNotes.push(`${targetKey(db.target)}←${v}`);
  }

  // 2) preset bucket (locked presets win over open inputs)
  for (const p of att.presets) {
    setField(p.target, p.value);
    if (p.locked) locked.add(targetKey(p.target));
  }

  // 3) open bucket — user inputs, but never override a locked preset
  if (instance) {
    for (const [k, v] of Object.entries(instance.criteria_values ?? {})) if (!locked.has(`crit:${k}`)) input.criteria_values[k] = v;
    for (const [k, v] of Object.entries(instance.modifier_values ?? {})) if (!locked.has(`mod:${k}`)) input.modifier_values[k] = v;
    for (const [p, inputs] of Object.entries(instance.property_values ?? {})) {
      const obj = inputs as Record<string, unknown>;
      for (const [iname, v] of Object.entries(obj)) {
        if (locked.has(`prop:${p}.${iname}`)) continue;
        const cur = (input.property_values[p] as Record<string, unknown>) ?? {};
        input.property_values[p] = { ...cur, [iname]: v };
      }
    }
    if (instance.primitive_input != null && !locked.has('prim:total')) input.primitive_input = instance.primitive_input;
  }

  // default the primitive if nothing set it
  if (input.primitive_input == null) {
    input.primitive_input =
      attachedSystem.primitive.kind === 'length' ? { mode: 'single', total: 0 } : 0;
  }

  // resolve the attached variant
  const rows = attachedSystem.variants.rows;
  const fromInstance = instance?.variant_choice;
  const byName = chosenVariant ? rows.find((r) => rowName(r) === chosenVariant) : undefined;
  const variant = fromInstance ?? snapshotFor(byName ?? rows[0]);

  return {
    variant,
    input,
    derived: derivedValues,
    trace: {
      label: att.role_label,
      detail: `attachment · ${att.attached_system_id}${derivedNotes.length ? ` · derived ${derivedNotes.join(', ')}` : ''}`,
    },
  };
}

export type ConnectionMaterialsResult = { lines: MtoLine[]; trace: TraceNode[]; warnings: Warning[] };

/** Resolve a host model's connection-material rules for one attachment (model-level rules). */
export function resolveConnectionMaterials(
  model: Model,
  attachmentId: string,
  hostCtx: HostEvalContext,
  deps: ResolveDeps,
): ConnectionMaterialsResult {
  const lines: MtoLine[] = [];
  const warnings: Warning[] = [];
  const trace: TraceNode[] = [];
  const rules = (model.connection_materials ?? []).filter((c) => c.attachment_id === attachmentId);
  for (const c of rules) {
    const mat = deps.materials.get(c.material_id);
    const applies = appliesWhen(c.rule, hostCtx.variantName, hostCtx.criteria, hostCtx.modifiers);
    if (!applies.variant || !applies.criteria) {
      trace.push({ label: c.material_id, detail: `skip · ${applies.skipReason}` });
      continue;
    }
    const q = resolveQuantity(c.rule, hostCtx.propertyValues, hostCtx.derived, hostCtx.primitiveCount, hostCtx.chain);
    if (q.kind === 'skip') {
      trace.push({ label: c.material_id, detail: `skip · ${q.reason}` });
      continue;
    }
    if (q.kind === 'cut') {
      if (q.cut_length > 0 && q.occurrences > 0) {
        const arr = deps.cutPool.get(c.material_id) ?? [];
        for (let i = 0; i < q.occurrences; i++) arr.push(q.cut_length);
        deps.cutPool.set(c.material_id, arr);
      }
      trace.push({ label: c.material_id, detail: `connection cut · ${q.cut_length}mm × ${q.occurrences}` });
      continue;
    }
    if (q.value <= 0) {
      trace.push({ label: c.material_id, detail: 'skip · qty 0' });
      continue;
    }
    if (!mat) {
      warnings.push({ level: 'warning', source: 'validation', type: 'missing_sku', message: `connection material ${c.material_id} not found`, affected_fields: [attachmentId] });
    }
    lines.push({
      sku: mat?.sku ?? c.material_id,
      material_visual: mat?.visual,
      description: mat?.name ?? c.material_id,
      qty: q.value,
      unit: mat?.unit ?? 'ea',
      source_material_id: c.material_id,
      source_attachment: attachmentId,
      notes: 'connection material',
    });
    trace.push({ label: c.material_id, detail: `connection · ${q.value} × ${mat?.sku ?? c.material_id}` });
  }
  return { lines, warnings, trace };
}
