// Author-time consistency checks for a System (the wizard). Pure — derived only
// from the System shape, no engine run. All warnings use source:'validation';
// posture is warn-never-block (nothing here gates saving). Order is source-order
// stable so the output is deterministic.

import type { Modifier, System, Warning } from '@/lib/types';
import { affected } from './affected';

const w = (level: Warning['level'], message: string, fields: string[]): Warning => ({
  level,
  source: 'validation',
  message,
  affected_fields: fields,
});

export function validateSystem(system: System): Warning[] {
  const out: Warning[] = [];
  const variants = new Set(system.variants.rows.map((r) => (r.kind === 'local' ? r.name : r.variant_id)));
  const spans = new Set((system.spans ?? []).map((s) => s.name));

  for (const p of system.properties) {
    for (const v of p.applies_to_variants ?? []) {
      if (!variants.has(v))
        out.push(w('warning', `Property '${p.name}' is gated to variant '${v}', which isn't declared on this system.`, [affected.prop(p.name), affected.variant(v)]));
    }
    if (typeof p.scope === 'object' && p.scope.kind === 'per_span' && !spans.has(p.scope.span_name)) {
      out.push(w('warning', `Property '${p.name}' is scoped to span '${p.scope.span_name}', which isn't declared on this system.`, [affected.prop(p.name), affected.span(p.scope.span_name)]));
    }
    if ((p.archetype === 'rate' || p.archetype === 'stock') && !p.length_basis) {
      out.push(w('info', `Property '${p.name}' (${p.archetype}) has no length_basis — it has no length to measure against.`, [affected.prop(p.name)]));
    }
    if (p.placement_rules && p.archetype !== 'count') {
      out.push(w('info', `Property '${p.name}' has placement_rules but its archetype is '${p.archetype}', not 'count' — placement only applies to count properties.`, [affected.prop(p.name), affected.placement(p.name)]));
    }
  }

  for (const m of system.modifiers) out.push(...bandedIssues(m));
  return out;
}

/** Overlaps or gaps between a banded_distance modifier's bands (sorted by start). */
function bandedIssues(m: Modifier): Warning[] {
  if (m.type.kind !== 'banded_distance') return [];
  const out: Warning[] = [];
  const bands = [...m.type.bands].sort((a, b) => a.range[0] - b.range[0]);
  for (let i = 0; i + 1 < bands.length; i++) {
    const cur = bands[i].range;
    const next = bands[i + 1].range;
    if (next[0] <= cur[1])
      out.push(w('warning', `Modifier '${m.name}' has overlapping bands [${cur[0]}, ${cur[1]}] and [${next[0]}, ${next[1]}].`, [affected.mod(m.name)]));
    else if (next[0] > cur[1] + 1)
      out.push(w('warning', `Modifier '${m.name}' has a gap between bands [${cur[0]}, ${cur[1]}] and [${next[0]}, ${next[1]}] — values in (${cur[1]}, ${next[0]}) match no band.`, [affected.mod(m.name)]));
  }
  return out;
}
