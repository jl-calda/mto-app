import { describe, it, expect } from 'vitest';
import { deriveCriteria, deriveCriteriaOptions, deriveModifierValues, derivePrimitiveTotal, deriveVariantIndex } from '@/lib/takeoff-init';
import { resolveTakeoff } from '@/lib/engine';
import { seed } from '@/lib/repo/seed';
import type { Model, System, Takeoff, VariantSnapshot } from '@/lib/types';

const evo = seed.systems.find((s) => s.id === 'sys-evo-guardrail')!;
const vl = seed.systems.find((s) => s.id === 'sys-vectaladder')!;
const model = (s: System, id?: string): Model => (id ? s.models.find((m) => m.id === id)! : s.models[0]);
const saById = new Map(seed.subAssemblies.map((s) => [s.id, s]));
const sysById = new Map(seed.systems.map((s) => [s.id, s]));
const resolveSubAssembly = (id: string) => saById.get(id);
const resolveAttachedSystem = (id: string) => sysById.get(id);
const bySku = (r: ReturnType<typeof resolveTakeoff>) => Object.fromEntries(r.mto.map((l) => [l.sku, l.qty]));

describe('takeoff-init derivations', () => {
  it('deriveCriteria falls back to the system criterion defaults', () => {
    const c = deriveCriteria(evo, null);
    expect(c.compliance_code).toBe('NF_E85-015');
    expect(c.wind_zone).toBe('1');
  });

  it('deriveCriteria prefers the saved take-off values (stringified)', () => {
    const t = { criteria_values: { compliance_code: 'EN_X', wind_zone: 2 } } as unknown as Takeoff;
    expect(deriveCriteria(evo, t)).toEqual({ compliance_code: 'EN_X', wind_zone: '2' });
  });

  it('derivePrimitiveTotal reads a number or a single-run .total, and skips segmented', () => {
    expect(derivePrimitiveTotal({ primitive_input: 9200 } as unknown as Takeoff)).toBe(9200);
    expect(derivePrimitiveTotal({ primitive_input: { mode: 'single', total: 24000 } } as unknown as Takeoff)).toBe(24000);
    expect(derivePrimitiveTotal({ primitive_input: { mode: 'segmented', segments: [] } } as unknown as Takeoff)).toBeUndefined();
    expect(derivePrimitiveTotal(null)).toBeUndefined();
  });

  it('deriveModifierValues merges system → model → saved, skipping nulls', () => {
    // EVO freestanding: system defaults + model.modifier_defaults (deck_height 1100)
    const m = deriveModifierValues(evo, model(evo, 'mdl-evo-fs'));
    expect(m.upright_angle).toBe('straight');
    expect(m.base_type).toBe('freestanding');
    expect(m.deck_height).toBe(1100); // model default wins over the system's 0
    expect('support_grid' in m).toBe(false); // null default is skipped
    // a saved take-off value overrides both
    const saved = deriveModifierValues(evo, model(evo, 'mdl-evo-fs'), { base_type: 'z_plate' });
    expect(saved.base_type).toBe('z_plate');
  });

  it('deriveCriteriaOptions surfaces rule-gated values (EVO wind_zone → 1/2/3)', () => {
    const opts = deriveCriteriaOptions(evo, model(evo, 'mdl-evo-fs'), seed.subAssemblies);
    expect(opts.wind_zone.sort()).toEqual(['1', '2', '3']);
    expect(opts.compliance_code).toEqual([]); // no rule enumerates it → free text in the UI
  });

  it('deriveVariantIndex finds the saved variant row, else 0', () => {
    const want = evo.variants.rows.findIndex((r) => r.kind === 'local' && r.name === 'Freestanding');
    const t = { variant_choice: { source_ref: { kind: 'local', name: 'Freestanding', attributes: {} } } } as unknown as Takeoff;
    expect(deriveVariantIndex(evo, t)).toBe(want);
    expect(deriveVariantIndex(evo, null)).toBe(0);
    const missing = { variant_choice: { source_ref: { kind: 'local', name: 'Nope', attributes: {} } } } as unknown as Takeoff;
    expect(deriveVariantIndex(evo, missing)).toBe(0);
  });
});

// The take-off UI seeds criteria/modifiers via these helpers, then feeds the
// (possibly edited) values into resolveTakeoff. These assert the worked-example
// behaviours become reachable from the values the UI actually produces.
describe('UI-seeded criteria/modifiers reach the engine', () => {
  it('editing EVO wind_zone 1 → 2 yields 38 counterweights (3/upright + ends)', () => {
    const m = model(evo, 'mdl-evo-fs');
    const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Freestanding', attributes: {} }, attributes: { base: 'freestanding' } };
    const modifier_values = deriveModifierValues(evo, m); // seeded as the Modifiers section would
    const criteria_values = { ...deriveCriteria(evo, null), wind_zone: '2' }; // user picks zone 2 in Section 02
    const r = resolveTakeoff({
      system: evo, model: m, variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
      input: { criteria_values, modifier_values, primitive_input: { mode: 'segmented', segments: [{ length: 10000, junction_after: { type: 'corner' } }, { length: 6000 }] }, property_values: {} },
    });
    expect(bySku(r)['03468']).toBe(3 * 12 + 2); // 38
  });

  it('editing Vectaladder landing_side left → right yields REST-PLATFORM-R', () => {
    const m = model(vl);
    const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: {} }, attributes: { has_cage: true, exit_type: 'exit_landing' } };
    const modifier_values = { ...deriveModifierValues(vl, m), landing_side: 'right' };
    const r = resolveTakeoff({
      system: vl, model: m, variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
      input: { criteria_values: deriveCriteria(vl, null), modifier_values, primitive_input: 14000, property_values: { landing_width: { width: 800 } } },
    });
    const q = bySku(r);
    expect(q['REST-PLATFORM-R']).toBe(1);
    expect(q['REST-PLATFORM-L']).toBeUndefined();
  });
});
