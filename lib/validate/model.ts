// Author-time consistency checks for a Model (the model editor). Pure — derived
// from the System + Model shapes, no engine run. Includes the System checks (the
// UI dedupes by message) plus the cross-reference checks a model adds: rules that
// gate on / count by / look up SKUs against things the system never declared
// resolve silently to 0 or never fire, so we surface them. All source:'validation';
// warn-never-block. Output order is source-order stable (deterministic).

import type { Model, ModelMaterial, Rule, SkuLookupRef, SubAssembly, System, Warning } from '@/lib/types';
import { affected } from './affected';
import { validateSystem } from './system';

// Derived counters the engine actually exposes (lib/engine/index.ts) — plus the
// dynamic `junction_<type>` family (junction_corner, junction_splice, …). A
// `per:{derived}` outside this set reads `derived[name] ?? 0` → silently 0.
const DERIVED_OK = new Set([
  'free_ends_count', 'free_foot_count', 'free_head_count', 'is_loop',
  'segment_count', 'junction_count', 'flights', 'rest_platforms',
]);
const derivedAllowed = (name: string) => DERIVED_OK.has(name) || name.startsWith('junction_');

const w = (level: Warning['level'], message: string, fields: string[]): Warning => ({
  level,
  source: 'validation',
  message,
  affected_fields: fields,
});

/** Stable key grouping rules that share a material + quantity target (for coverage). */
function perKey(r: Rule): string {
  const p = r.per;
  if (!p) return `qty:${r.qty_kind}`;
  switch (p.kind) {
    case 'property': return `property:${p.name}`;
    case 'primitive_input': return 'primitive_input';
    case 'unit_of_length': return `unit_of_length:${p.length_source}`;
    case 'derived': return `derived:${p.name}`;
    case 'algorithm_output': return `algorithm_output:${p.algorithm}.${p.field}`;
    case 'parameter': return `parameter:${p.name}`;
  }
}

export function validateModel(system: System, model: Model, subAssemblies: SubAssembly[] = []): Warning[] {
  void subAssemblies; // reserved: sub-assembly rules are validated in their own context, not the host's
  const out: Warning[] = [...validateSystem(system)];

  const variants = new Set(system.variants.rows.map((r) => (r.kind === 'local' ? r.name : r.variant_id)));
  const criteria = system.criteria.map((c) => c.library_id);
  const criteriaSet = new Set(criteria);
  const modifiers = new Map(system.modifiers.map((m) => [m.name, m]));
  const properties = new Map(system.properties.map((p) => [p.name, p]));
  const variantAttrs = new Set(system.variants.attribute_columns.map((c) => c.name));
  const tables = new Set(model.sku_lookups.map((t) => t.table_name));

  const checkSkuLookup = (sl: SkuLookupRef, matId: string, mmToken: string) => {
    if (!tables.has(sl.table))
      out.push(w('warning', `Rule for '${matId}' resolves its SKU from table '${sl.table}', which isn't defined on this model.`, [mmToken, affected.skuLookup(sl.table)]));
    for (const key of sl.keys) {
      switch (key.kind) {
        case 'modifier':
          if (!modifiers.has(key.name)) out.push(w('warning', `SKU key for '${matId}' reads modifier '${key.name}', which isn't declared on this system.`, [mmToken, affected.mod(key.name)]));
          break;
        case 'modifier_band': {
          const mod = modifiers.get(key.name);
          if (!mod) out.push(w('warning', `SKU key for '${matId}' reads modifier band '${key.name}', which isn't declared on this system.`, [mmToken, affected.mod(key.name)]));
          else if (mod.type.kind !== 'banded_distance') out.push(w('warning', `SKU key for '${matId}' reads a band of modifier '${key.name}', but it isn't a banded_distance modifier.`, [mmToken, affected.mod(key.name)]));
          break;
        }
        case 'criterion':
          if (!criteriaSet.has(key.name)) out.push(w('warning', `SKU key for '${matId}' reads criterion '${key.name}', which isn't declared on this system.`, [mmToken, affected.crit(key.name)]));
          break;
        case 'property_input': {
          const prop = properties.get(key.property);
          if (!prop) out.push(w('warning', `SKU key for '${matId}' reads an input of property '${key.property}', which isn't declared on this system.`, [mmToken, affected.prop(key.property)]));
          else if (!prop.inputs.some((i) => i.name === key.input)) out.push(w('warning', `SKU key for '${matId}' reads input '${key.input}' of property '${key.property}', which has no such input.`, [mmToken, affected.prop(key.property)]));
          break;
        }
        case 'variant_attr':
          if (!variantAttrs.has(key.name)) out.push(w('warning', `SKU key for '${matId}' reads variant attribute '${key.name}', which isn't a declared variant column.`, [mmToken]));
          break;
        case 'literal':
          break;
      }
    }
  };

  const checkRule = (rule: Rule, matId: string, mmToken: string) => {
    for (const v of rule.applies_when.variants ?? [])
      if (!variants.has(v)) out.push(w('warning', `Rule for '${matId}' gates on variant '${v}', which isn't declared on this system.`, [mmToken, affected.variant(v)]));
    for (const k of Object.keys(rule.applies_when.criteria ?? {}))
      if (!criteriaSet.has(k)) out.push(w('warning', `Rule for '${matId}' gates on criterion '${k}', which isn't declared on this system.`, [mmToken, affected.crit(k)]));
    for (const k of Object.keys(rule.applies_when.modifiers ?? {}))
      if (!modifiers.has(k)) out.push(w('warning', `Rule for '${matId}' gates on modifier '${k}', which isn't declared on this system.`, [mmToken, affected.mod(k)]));

    if (rule.per?.kind === 'property' && !properties.has(rule.per.name))
      out.push(w('warning', `Rule for '${matId}' is counted per property '${rule.per.name}', which isn't declared on this system.`, [mmToken, affected.prop(rule.per.name)]));
    if (rule.per?.kind === 'derived' && !derivedAllowed(rule.per.name))
      out.push(w('info', `Rule for '${matId}' is counted per derived counter '${rule.per.name}', which the engine doesn't expose — it resolves to 0.`, [mmToken]));

    if (rule.sku_lookup) checkSkuLookup(rule.sku_lookup, matId, mmToken);
  };

  for (const mm of model.materials) checkRule(mm.rule, mm.material_id, affected.mm(mm.id));
  for (const cm of model.connection_materials ?? []) checkRule(cm.rule, cm.material_id, affected.mm(cm.material_id));

  // sku_lookup with no fallback — uncovered key combinations resolve to no SKU.
  for (const t of model.sku_lookups)
    if (t.fallback == null)
      out.push(w('info', `SKU table '${t.table_name}' has no fallback — key combinations not in the table resolve to no SKU.`, [affected.skuLookup(t.table_name)]));

  // criteria-coverage gap: a material+quantity-target group whose every rule gates
  // on the SAME criterion (no open catch-all) only fires for the listed values; any
  // other value of that criterion silently produces 0 (e.g. EVO counterweights are
  // gated on wind_zone {1,2,3} → zone 4 yields none). Pairs with the live engine run.
  const groups = new Map<string, ModelMaterial[]>();
  for (const mm of model.materials) {
    const k = `${mm.material_id}|${perKey(mm.rule)}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(mm);
  }
  for (const mats of groups.values()) {
    for (const cid of criteria) {
      const gating = mats.filter((mm) => (mm.rule.applies_when.criteria?.[cid]?.length ?? 0) > 0);
      if (gating.length === 0 || gating.length !== mats.length) continue; // some rule is open on cid → covered
      const vals = [...new Set(gating.flatMap((mm) => mm.rule.applies_when.criteria[cid]))].sort();
      out.push(w('info', `'${cid}' has rules only for {${vals.join(', ')}}; other '${cid}' values produce 0 of '${mats[0].material_id}'.`, [affected.crit(cid), ...mats.map((mm) => affected.mm(mm.id))]));
    }
  }

  return out;
}
