// Pure, serializable model for the Guide's Inputs/Outputs dependency graph, plus
// builders that derive it from real data. No React — testable in isolation.
// Groups render as columns; each group's subgroups are boxes; each subgroup holds
// its real items as chips/rows. `materials` is the per-material gating breakdown
// that shows *how* each input (variant / modifier / criterion / property) gates,
// counts and SKU-keys the materials a system's models emit.

import type {
  InputType,
  Material,
  ModifierType,
  PerTarget,
  PropertyInstance,
  Rule,
  SkuKeyRef,
  System,
  SystemVariantRef,
} from '@/lib/types';
import { CONCEPT_BY_ID, type ConceptId } from './content';

/** A coloured chip. `kind` colours it by concept; `tone` is for role chips. */
export type TagTone = 'gate' | 'qty' | 'sku' | 'always' | 'muted';
export interface Tag {
  text: string;
  kind?: ConceptId;
  tone?: TagTone;
}
export interface TreeItem {
  label: string;
  detail?: string;
  chips?: string[];
  /** Coloured role/gating chips (which materials this input affects, or how a material is gated). */
  tags?: Tag[];
}
export interface SubGroup {
  id: string;
  label: string;
  kind?: ConceptId; // → deep-links to the glossary card + colours the dot
  items: TreeItem[];
}
export interface TreeGroup {
  id: 'inputs' | 'outputs';
  label: string;
  subgroups: SubGroup[];
}
/** One material line in the gating breakdown: what it is, what gates it, how
 *  many, and which input picks its SKU. Derived from a model material's Rule. */
export interface MaterialNode {
  id: string;
  model: string;
  label: string;
  detail?: string; // "SKU · unit"
  /** `applies_when` gates (variant / criterion=value / modifier=value); [always] when unconditional. */
  when: Tag[];
  /** Human quantity rule (per property, fixed, algorithm, …). */
  qty?: string;
  /** sku_lookup keys, coloured by the input that drives each key. */
  skuFrom?: Tag[];
}
export interface TreeModel {
  title?: string;
  subtitle?: string;
  groups: TreeGroup[];
  /** Per-material gating breakdown (system trees only; the generic tree omits it). */
  materials?: MaterialNode[];
}

// ── formatting helpers (pure) ───────────────────────────────────────────────
const rowName = (r: SystemVariantRef): string => (r.kind === 'local' ? r.name : r.variant_id);
const scopeLabel = (p: PropertyInstance): string =>
  typeof p.scope === 'string' ? p.scope : `per_span:${p.scope.span_name}`;
const val = (v: unknown): string => String(v);

function gatingChips(p: PropertyInstance, variantNames: string[]): string[] {
  const g = p.applies_to_variants;
  if (!g || g.length === 0 || (variantNames.length > 0 && g.length === variantNames.length)) return ['all variants'];
  return g;
}

function modifierTypeLabel(t: ModifierType): string {
  switch (t.kind) {
    case 'enum': return `enum {${t.values.join(', ')}}`;
    case 'enum_with_attributes': return `enum {${t.values.map((v) => v.name).join(', ')}}`;
    case 'banded_distance': return `bands ${t.bands.map((b) => `${b.range[0]}–${b.range[1]}`).join(', ')}`;
    case 'discrete_set': return `set of ${t.element_type.kind}`;
    case 'distance': return 'distance';
    case 'percentage': return 'percentage';
    case 'bool': return 'bool';
    case 'support_grid': return 'support grid';
  }
}

function inputTypeLabel(t: InputType): string {
  switch (t.kind) {
    case 'enum': return `enum{${t.values.join('/')}}`;
    case 'variant': return `variant{${t.options.map((o) => o.value).join('/')}}`;
    default: return t.kind;
  }
}

function perTargetLabel(per?: PerTarget): string {
  if (!per) return '?';
  switch (per.kind) {
    case 'property': return per.name;
    case 'primitive_input': return 'measurement';
    case 'unit_of_length': return `length:${per.length_source}`;
    case 'derived': return per.name;
    case 'algorithm_output': return `${per.algorithm}.${per.field}`;
    case 'parameter': return per.name;
  }
}

function qtyLabel(rule: Rule): string {
  switch (rule.qty_kind) {
    case 'fixed': return `fixed ×${rule.qty ?? 1}`;
    case 'per': {
      const mult = rule.qty && rule.qty !== 1 ? `${rule.qty}× ` : '';
      return `${mult}per ${perTargetLabel(rule.per)}`;
    }
    case 'per_length': return `per length${rule.unit ? ` (${rule.unit})` : ''}`;
    case 'cut': return `cut${rule.cut_length ? ` ${rule.cut_length}` : ''}`;
    case 'algorithm': return `algorithm: ${rule.algorithm_config?.algorithm ?? '?'}`;
  }
}

function skuKeyTag(k: SkuKeyRef): Tag {
  switch (k.kind) {
    case 'literal': return { text: `"${k.value}"`, tone: 'muted' };
    case 'modifier': return { text: k.name, kind: 'modifier', tone: 'sku' };
    case 'modifier_band': return { text: `${k.name} band`, kind: 'modifier', tone: 'sku' };
    case 'criterion': return { text: k.name, kind: 'criterion', tone: 'sku' };
    case 'property_input': return { text: `${k.property}.${k.input}`, kind: 'property', tone: 'sku' };
    case 'variant_attr': return { text: k.name, kind: 'variant', tone: 'sku' };
  }
}

/** The `applies_when` gates as coloured chips; [always] when unconditional. */
function whenTags(rule: Rule): Tag[] {
  const aw = rule.applies_when;
  const tags: Tag[] = [];
  for (const v of aw.variants ?? []) tags.push({ text: v, kind: 'variant', tone: 'gate' });
  for (const [c, vals] of Object.entries(aw.criteria ?? {})) tags.push({ text: `${c} = ${vals.join('/')}`, kind: 'criterion', tone: 'gate' });
  for (const [m, vals] of Object.entries(aw.modifiers ?? {})) tags.push({ text: `${m} = ${vals.join('/')}`, kind: 'modifier', tone: 'gate' });
  if (tags.length === 0) tags.push({ text: 'always', tone: 'always' });
  return tags;
}

// ── reverse index: which materials each input gates / drives / keys ──────────
interface ModRole { gate: number; sku: boolean; qty: boolean }
interface CritRole { gate: number; values: Set<string>; sku: boolean }
interface PropRole { qty: number; sku: boolean }
interface Reverse {
  variant: Map<string, number>;
  modifier: Map<string, ModRole>;
  criterion: Map<string, CritRole>;
  property: Map<string, PropRole>;
}

function buildReverse(system: System): Reverse {
  const rev: Reverse = { variant: new Map(), modifier: new Map(), criterion: new Map(), property: new Map() };
  const mod = (n: string): ModRole => { const c = rev.modifier.get(n) ?? { gate: 0, sku: false, qty: false }; rev.modifier.set(n, c); return c; };
  const crit = (n: string): CritRole => { const c = rev.criterion.get(n) ?? { gate: 0, values: new Set(), sku: false }; rev.criterion.set(n, c); return c; };
  const prop = (n: string): PropRole => { const c = rev.property.get(n) ?? { qty: 0, sku: false }; rev.property.set(n, c); return c; };

  for (const model of system.models) {
    for (const mm of model.materials) {
      const r = mm.rule;
      for (const v of r.applies_when.variants ?? []) rev.variant.set(v, (rev.variant.get(v) ?? 0) + 1);
      for (const [c, vals] of Object.entries(r.applies_when.criteria ?? {})) { const e = crit(c); e.gate += 1; vals.forEach((x) => e.values.add(x)); }
      for (const m of Object.keys(r.applies_when.modifiers ?? {})) mod(m).gate += 1;
      if (r.qty_kind === 'per' && r.per?.kind === 'property') prop(r.per.name).qty += 1;
      for (const k of r.sku_lookup?.keys ?? []) {
        if (k.kind === 'modifier' || k.kind === 'modifier_band') mod(k.name).sku = true;
        else if (k.kind === 'criterion') crit(k.name).sku = true;
        else if (k.kind === 'property_input') prop(k.property).sku = true;
      }
    }
  }
  return rev;
}

const gateTag = (n: number, kind: ConceptId): Tag[] => (n > 0 ? [{ text: `gates ${n}`, kind, tone: 'gate' }] : []);

/** Derive the Inputs/Outputs graph + per-material gating from a System.
 *  Pass the global material catalogue to resolve SKUs/names (else ids show). */
export function buildSystemTree(system: System, materials: Material[] = []): TreeModel {
  const variantNames = system.variants.rows.map(rowName);
  const rev = buildReverse(system);
  const byId = new Map(materials.map((m) => [m.id, m]));

  const measurement: SubGroup = {
    id: 'measurement', label: 'Measurement', kind: 'system',
    items: [{ label: system.primitive.kind, detail: system.primitive.kind === 'length' && system.primitive.segmentable ? 'segmentable' : undefined }],
  };
  const variants: SubGroup = {
    id: 'variants', label: 'Variants', kind: 'variant',
    items: system.variants.rows.map((r) => {
      const name = rowName(r);
      return {
        label: name,
        chips: r.kind === 'local' ? Object.entries(r.attributes).map(([k, v]) => `${k}: ${val(v)}`) : undefined,
        tags: gateTag(rev.variant.get(name) ?? 0, 'variant'),
      };
    }),
  };
  const modifiers: SubGroup = {
    id: 'modifiers', label: 'Modifiers', kind: 'modifier',
    items: system.modifiers.map((m) => {
      const u = rev.modifier.get(m.name);
      const tags = gateTag(u?.gate ?? 0, 'modifier');
      if (u?.sku) tags.push({ text: 'picks SKU', tone: 'sku' });
      if (u?.qty) tags.push({ text: 'drives qty', tone: 'qty' });
      return {
        label: m.name,
        detail: `${m.group} · ${modifierTypeLabel(m.type)}${m.default_value != null ? ` · default ${val(m.default_value)}` : ''}`,
        tags,
      };
    }),
  };
  const criteria: SubGroup = {
    id: 'criteria', label: 'Criteria', kind: 'criterion',
    items: system.criteria.map((c) => {
      const u = rev.criterion.get(c.library_id);
      const tags = gateTag(u?.gate ?? 0, 'criterion');
      if (u?.sku) tags.push({ text: 'keys SKU', tone: 'sku' });
      return {
        label: c.library_id,
        detail: c.default_value != null ? `default ${val(c.default_value)}` : undefined,
        chips: u && u.values.size ? [...u.values].sort() : undefined, // observed gating values, e.g. wind_zone → 1/2/3
        tags,
      };
    }),
  };
  const properties: SubGroup = {
    id: 'properties', label: 'Properties', kind: 'property',
    items: system.properties.map((p) => {
      const u = rev.property.get(p.name);
      const tags: Tag[] = [];
      if (u?.qty) tags.push({ text: `drives qty ${u.qty}`, kind: 'property', tone: 'qty' });
      if (u?.sku) tags.push({ text: 'keys SKU', tone: 'sku' });
      const inputs = p.inputs.map((i) => `${i.name}:${inputTypeLabel(i.type)}${i.default != null ? `=${val(i.default)}` : ''}`).join(' · ');
      return {
        label: p.name,
        detail: `${p.archetype} · ${scopeLabel(p)}${inputs ? ` · ${inputs}` : ''}`,
        chips: gatingChips(p, variantNames),
        tags,
      };
    }),
  };

  const models: SubGroup = {
    id: 'models', label: 'Models', kind: 'model',
    items: system.models.map((m) => ({
      label: m.name,
      detail: `${m.materials.length} material${m.materials.length === 1 ? '' : 's'} · ${m.status}`,
      chips: m.sku_lookups.map((t) => `SKU table: ${t.table_name}`),
    })),
  };
  const mto: SubGroup = {
    id: 'mto', label: 'MTO', kind: 'mto',
    items: [{ label: 'bill of materials', detail: 'SKUs · quantities · cut plans' }],
  };

  const materialNodes: MaterialNode[] = system.models.flatMap((model) =>
    model.materials.map((mm) => {
      const cat = byId.get(mm.material_id);
      return {
        id: mm.id,
        model: model.name,
        label: cat?.name ?? mm.material_id,
        detail: cat ? `${cat.sku} · ${cat.unit}` : undefined,
        when: whenTags(mm.rule),
        qty: qtyLabel(mm.rule),
        skuFrom: mm.rule.sku_lookup ? mm.rule.sku_lookup.keys.map(skuKeyTag) : undefined,
      };
    }),
  );

  return {
    title: system.name,
    subtitle: `${system.primitive.kind} system`,
    groups: [
      { id: 'inputs', label: 'Inputs', subgroups: [measurement, variants, modifiers, criteria, properties] },
      { id: 'outputs', label: 'Outputs', subgroups: [models, mto] },
    ],
    materials: materialNodes,
  };
}

/** Concept-level fallback when no specific entity is in focus. */
const blurb = (id: ConceptId): TreeItem[] => [{ label: CONCEPT_BY_ID[id].oneLiner }];
export const GENERIC_TREE: TreeModel = {
  subtitle: 'how a system produces an MTO',
  groups: [
    {
      id: 'inputs',
      label: 'Inputs',
      subgroups: [
        { id: 'measurement', label: 'Measurement', kind: 'system', items: [{ label: 'what you measure (the primitive)' }] },
        { id: 'variants', label: 'Variants', kind: 'variant', items: blurb('variant') },
        { id: 'modifiers', label: 'Modifiers', kind: 'modifier', items: blurb('modifier') },
        { id: 'criteria', label: 'Criteria', kind: 'criterion', items: blurb('criterion') },
        { id: 'properties', label: 'Properties', kind: 'property', items: blurb('property') },
      ],
    },
    {
      id: 'outputs',
      label: 'Outputs',
      subgroups: [
        { id: 'models', label: 'Models', kind: 'model', items: blurb('model') },
        { id: 'mto', label: 'MTO', kind: 'mto', items: blurb('mto') },
      ],
    },
  ],
};
