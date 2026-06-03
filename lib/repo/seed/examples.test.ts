import { describe, it, expect } from 'vitest';
import { resolveTakeoff } from '@/lib/engine';
import { seed } from '@/lib/repo/seed';
import type { AttachmentInstance, Model, System, VariantSnapshot } from '@/lib/types';

const sysById = new Map(seed.systems.map((s) => [s.id, s]));
const saById = new Map(seed.subAssemblies.map((s) => [s.id, s]));
const resolveSubAssembly = (id: string) => saById.get(id);
const resolveAttachedSystem = (id: string) => sysById.get(id);
const sys = (id: string) => sysById.get(id)!;
const model = (s: System, id?: string): Model => (id ? s.models.find((m) => m.id === id)! : s.models[0]);
const bySku = (r: ReturnType<typeof resolveTakeoff>) => Object.fromEntries(r.mto.map((l) => [l.sku, l.qty]));

// Worked Examples Guide §1D / §2D / §3D — golden reproductions. Numbers are the
// engine's exact output; they track the guide's "~" estimates (the guide rounds up
// where the engine is faithful to the stated max-spacings / un-forced corners).

describe('worked example 1 — Securope lifeline (length, segmented, fall-arrest)', () => {
  const s = sys('sys-securope');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Fall-arrest', attributes: {} }, attributes: { traveller_type: 'openable', absorber: 'energy' } };
  const r = resolveTakeoff({
    system: s, model: model(s), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
    input: { criteria_values: { compliance_code: 'EN_795_C', environment: 'coastal' }, modifier_values: { substrate: 'metal_deck', support_grid: { kind: 'regular', spacing: 2000, phase: 0 } }, primitive_input: { mode: 'segmented', segments: [{ length: 12000, junction_after: { type: 'corner' } }, { length: 8000, junction_after: { type: 'corner' } }, { length: 10000 }] }, property_values: { users: { count: 2 } } },
  });
  const q = bySku(r);
  it('cable = run length in metres (per_length over the run)', () => expect(q['LDV-CABLE-8']).toBe(30));
  it('end anchors + energy tensioners per free end', () => { expect(q['LDV054']).toBe(2); expect(q['LDV134']).toBe(2); });
  it('crimp rings = 2/end + 1/corner, consolidated', () => expect(q['LDV008']).toBe(6));
  it('corner kits per corner junction', () => expect(q['LDV-CORNER']).toBe(2));
  it('openable travellers per user (variant-gated)', () => expect(q['13627']).toBe(2));
  it('substrate-fixing sub-assembly per intermediate (count ← place_supports)', () => {
    expect(q['LDV-MDB']).toBe(q['LDV043']); // one deck bracket per NEO intermediate
    expect(q['LDV-EPDM']).toBe(q['LDV043']); // EPDM seal (coastal)
  });
  it('no turnbuckle on an open (non-loop) run', () => expect(q['LDV138']).toBeUndefined());
});

describe('worked example 1b — Securope closed loop (turnbuckle, no end anchors)', () => {
  const s = sys('sys-securope');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Fall-arrest', attributes: {} }, attributes: {} };
  const r = resolveTakeoff({
    system: s, model: model(s), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
    input: { criteria_values: { compliance_code: 'EN_795_C', environment: 'inland' }, modifier_values: { substrate: 'concrete' }, primitive_input: { mode: 'single', total: 24000, is_loop: true }, property_values: { users: { count: 1 } } },
  });
  const q = bySku(r);
  it('loop → 1 turnbuckle, 0 end anchors', () => { expect(q['LDV138']).toBe(1); expect(q['LDV054']).toBeUndefined(); });
});

describe('worked example 2 — Vectaladder cage ladder, 14 m (height, auto-flights)', () => {
  const s = sys('sys-vectaladder');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: {} }, attributes: { has_cage: true, exit_type: 'exit_landing' } };
  const r = resolveTakeoff({
    system: s, model: model(s), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
    input: { criteria_values: { compliance_code: 'NF_E85-016', material_grade: 'aluminium' }, modifier_values: { wall_offset: 210, substrate: 'concrete' }, primitive_input: 14000, property_values: { landing_width: { width: 800 } } },
  });
  const q = bySku(r);
  it('auto-splits into 2 flights + 1 rest platform', () => { expect(r.counters.flights).toBe(2); expect(q['REST-PLATFORM']).toBe(1); });
  it('rungs run continuously over the climb', () => expect(q['RUNG-30x30-AL']).toBe(51));
  it('splice kits = pack joints × 2 stiles', () => expect(q['SPLICE-AL']).toBe(4));
  it('bracket SKU resolves by wall_offset band + substrate (BRK-205-CON)', () => expect(q['BRK-205-CON']).toBe(8));
  it('exit-landing SKU resolves by width (800 → 02662)', () => expect(q['02662']).toBe(1));
  it('cage fires (threshold over the cage_zone span)', () => expect(q['CAGE-HOOP-AL']).toBeGreaterThan(0));
  it('no metal-deck fixing on a concrete substrate', () => expect(q['03177']).toBeUndefined());
});

describe('worked example 3 — EVO freestanding guardrail, L-shaped 16 m (length, segmented)', () => {
  const s = sys('sys-evo-guardrail');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Freestanding', attributes: {} }, attributes: { base: 'freestanding' } };
  const r = resolveTakeoff({
    system: s, model: model(s, 'mdl-evo-fs'), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
    input: { criteria_values: { compliance_code: 'NF_E85-015', wind_zone: '1' }, modifier_values: { upright_angle: 'straight', base_type: 'freestanding' }, primitive_input: { mode: 'segmented', segments: [{ length: 10000, junction_after: { type: 'corner' } }, { length: 6000 }] }, property_values: { include_toeboard: { on: true }, gates: { count: 1 } } },
  });
  const q = bySku(r);
  it('base SKU resolves by base_type (freestanding → BASE-FS), one per upright', () => { expect(q['BASE-FS']).toBe(12); expect(q['UPR-STR-AL']).toBe(12); });
  it('counterweights = 2/upright + 1/free-end (freestanding)', () => expect(q['03468']).toBe(2 * 12 + 2));
  it('handrail + knee rail pack into 3 m lengths', () => { expect(q['RAIL-45-AL']).toBe(6); expect(q['RAIL-35-AL']).toBe(6); });
  it('end caps per free end (×2 rails); corner kit per corner', () => { expect(q['CAP-AL']).toBe(4); expect(q['EVO-CORNER']).toBe(1); });
  it('optional toeboard + gate fire when set', () => { expect(q['TOE-150-AL']).toBe(6); expect(q['0733603']).toBe(1); });
  it('per-segment placement forces a shared upright at every corner (3×2 m L → 7, not the 5 a spanned run would give)', () => {
    const r3 = resolveTakeoff({
      system: s, model: model(s, 'mdl-evo-fs'), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
      input: { criteria_values: { compliance_code: 'NF_E85-015', wind_zone: '1' }, modifier_values: { upright_angle: 'straight', base_type: 'freestanding' }, primitive_input: { mode: 'segmented', segments: [{ length: 2000, junction_after: { type: 'corner' } }, { length: 2000, junction_after: { type: 'corner' } }, { length: 2000 }] }, property_values: {} },
    });
    expect(bySku(r3)['UPR-STR-AL']).toBe(7);
  });
});

describe('worked example — Vectaladder → EVO walkway attachment (joint kit 03008, one cut pool)', () => {
  const s = sys('sys-vectaladder');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: {} }, attributes: { has_cage: true, exit_type: 'exit_landing' } };
  const att: AttachmentInstance = { attachment_id: 'att-vl-walkway', included: true, primitive_input: { mode: 'single', total: 8000 } };
  const r = resolveTakeoff({
    system: s, model: model(s), variant: v, materials: seed.materials, resolveSubAssembly, resolveAttachedSystem,
    input: { criteria_values: { compliance_code: 'NF_E85-016', material_grade: 'aluminium' }, modifier_values: { wall_offset: 210, substrate: 'concrete' }, primitive_input: 14000, property_values: { landing_width: { width: 800 } }, attachments: [att] },
  });
  const q = bySku(r);
  it('connection material is the ladder/guardrail joint kit', () => expect(q['03008']).toBe(1));
  it('the attached EVO walkway resolves into the same MTO (base + uprights)', () => {
    expect(q['UPR-STR-AL']).toBeGreaterThan(0);
    expect(r.attachments.find((a) => a.id === 'att-vl-walkway')?.included).toBe(true);
  });
});
