import { describe, it, expect } from 'vitest';
import { resolveTakeoff } from '@/lib/engine';
import { place, placeOptimal } from '@/lib/engine/algorithms/place-supports';
import { cut } from '@/lib/engine/algorithms/cut-from-stock';
import { pack2d } from '@/lib/engine/algorithms/pack-stock-2d';
import { seed } from '@/lib/repo/seed';
import type { Model, System, VariantSnapshot } from '@/lib/types';

const mats = seed.materials;
const saById = new Map(seed.subAssemblies.map((s) => [s.id, s]));
const sysById = new Map(seed.systems.map((s) => [s.id, s]));
const resolveSubAssembly = (id: string) => saById.get(id);
const resolveAttachedSystem = (id: string) => sysById.get(id);
const sys = (id: string): System => seed.systems.find((s) => s.id === id)!;
const model = (s: System): Model => s.models[0];
const qty = (r: ReturnType<typeof resolveTakeoff>, startsWith: string) => r.mto.find((l) => l.description.startsWith(startsWith))?.qty;

describe('golden — ladder (height, cage + walkway attachment + sub-assembly + offcut)', () => {
  const s = sys('sys-ladder');
  const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: { has_cage: true } }, attributes: { has_cage: true } };
  const r = resolveTakeoff({
    system: s, model: model(s), variant: v, materials: mats, resolveSubAssembly, resolveAttachedSystem, inventory: seed.inventory,
    input: {
      criteria_values: { compliance_code: 'NF E85-016', material_finish: 'anodized' }, modifier_values: {}, primitive_input: 9200, property_values: {},
      attachments: [{ attachment_id: 'att-walkway', included: true, primitive_input: { mode: 'single', total: 4000 } }],
    },
  });

  it('rungs run continuously over the climb (35)', () => expect(qty(r, 'Rung')).toBe(35));
  it('cage hoops minus the suppressed one at the walkway joint (23)', () => expect(qty(r, 'Cage hoop')).toBe(23));
  it('inlines the wall-bracket sub-assembly (7 brackets, 14 bolts)', () => {
    expect(qty(r, 'Wall bracket')).toBe(7);
    expect(qty(r, 'Anchor bolt')).toBe(14);
  });
  it('resolves the walkway attachment + connection gate', () => {
    expect(qty(r, 'Walkway grating')).toBe(4);
    expect(qty(r, 'Self-closing safety gate')).toBe(1);
  });
  it('L-bar pool reuses the retained offcut → 1 new stock', () => expect(qty(r, 'L-bar')).toBe(1));
  it('auto-splits into 2 flights', () => expect(r.counters.flights).toBe(2));
});

describe('golden — guardrail (length, pack_stock + algorithm_output couplers)', () => {
  const s = sys('sys-guardrail');
  const v: VariantSnapshot = { source_ref: { kind: 'library', variant_id: 'var-ss316', pinned_version: 1 }, snapshot_version: 1, attributes: {} };
  const base = { criteria_values: {}, modifier_values: {}, property_values: {} };

  it('single run: 17 uprights, 4 rail pieces, 3 couplers, no corners', () => {
    const r = resolveTakeoff({ system: s, model: model(s), variant: v, materials: mats, resolveSubAssembly, resolveAttachedSystem, input: { ...base, primitive_input: { mode: 'single', total: 24000 } } });
    expect(qty(r, 'Guardrail upright')).toBe(17);
    expect(qty(r, 'Top rail')).toBe(4);
    expect(qty(r, 'Rail coupler')).toBe(3);
    expect(qty(r, 'Wall bracket')).toBeUndefined();
  });

  it('segmented run (10000 ⌐ 14000): 19 uprights across 2 segments + 1 corner bracket', () => {
    const r = resolveTakeoff({ system: s, model: model(s), variant: v, materials: mats, resolveSubAssembly, resolveAttachedSystem, input: { ...base, primitive_input: { mode: 'segmented', segments: [{ length: 10000, junction_after: { type: 'corner' } }, { length: 14000 }] } } });
    expect(qty(r, 'Guardrail upright')).toBe(19);
    expect(qty(r, 'Wall bracket')).toBe(1);
    expect(r.geometry.segments?.length).toBe(2);
    expect(r.geometry.junctions?.[0]?.type).toBe('corner');
  });
});

describe('golden — anchors (count, input-only chain)', () => {
  it('emits one anchor per counted point', () => {
    const s = sys('sys-anchors');
    const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Standard', attributes: {} }, attributes: {} };
    const r = resolveTakeoff({ system: s, model: model(s), variant: v, materials: mats, input: { criteria_values: { substrate: 'concrete' }, modifier_values: {}, primitive_input: 12, property_values: {} } });
    expect(qty(r, 'Anchor point')).toBe(12);
    expect(r.chain.steps.length).toBe(1);
  });
});

describe('chain override (Brief 10)', () => {
  it('overriding quantized recomputes downstream + warns', () => {
    const s = sys('sys-guardrail');
    const v: VariantSnapshot = { source_ref: { kind: 'library', variant_id: 'var-ss316', pinned_version: 1 }, snapshot_version: 1, attributes: {} };
    const r = resolveTakeoff({ system: s, model: model(s), variant: v, materials: mats, resolveSubAssembly, resolveAttachedSystem, input: { criteria_values: {}, modifier_values: {}, primitive_input: { mode: 'single', total: 24000 }, property_values: {}, chain_overrides: { quantized: 30000 } } });
    expect(qty(r, 'Guardrail upright')).toBe(21);
    expect(r.warnings.some((w) => w.type === 'geometry_mismatch')).toBe(true);
  });
});

describe('algorithm contract — place_supports greedy ≡ optimal (valid spacing)', () => {
  const rules = { max_spacing: 2000, end_clearance_foot: { max: 500 }, end_clearance_head: { max: 500 } };
  const maxGap = (xs: number[]) => xs.slice(1).reduce((m, x, i) => Math.max(m, x - xs[i]), 0);
  for (const L of [4000, 9000, 12345, 30000]) {
    it(`L=${L}: both solvers respect max_spacing and are deterministic`, () => {
      const g = place(L, rules);
      const o = placeOptimal(L, rules);
      expect(g.length).toBeGreaterThanOrEqual(2);
      expect(o.length).toBeGreaterThanOrEqual(2);
      expect(maxGap(g)).toBeLessThanOrEqual(rules.max_spacing + 1);
      expect(maxGap(o)).toBeLessThanOrEqual(rules.max_spacing + 1);
      expect(place(L, rules)).toEqual(g); // deterministic
    });
  }
  it('forbidden zones remove interior positions', () => {
    const withZone = placeOptimal(10000, { ...rules, forbidden_zones: [{ start: 3900, end: 5100 }] });
    expect(withZone.some((p) => p >= 3900 && p <= 5100)).toBe(false);
  });
});

describe('algorithm contract — cut_from_stock (FFD + offcut reuse)', () => {
  it('packs 7×800 into one 6000 stock', () => {
    const r = cut([800, 800, 800, 800, 800, 800, 800], [6000], 3);
    expect(r.stocks).toBe(1);
  });
  it('reuses a retained offcut before buying new stock', () => {
    const r = cut([800, 800], [6000], 3, [2000]);
    expect(r.stocks).toBe(0);
    expect(r.offcuts_used).toBe(1);
  });
  it('is order-independent (sorts descending)', () => {
    expect(cut([300, 1000, 500], [6000], 0)).toEqual(cut([1000, 500, 300], [6000], 0));
  });
});

describe('algorithm contract — pack_stock_2d', () => {
  it('nests rectangles onto sheets', () => {
    const r = pack2d([{ w: 1200, h: 900 }, { w: 1200, h: 900 }, { w: 1200, h: 900 }], 2400, 1200);
    expect(r.sheets).toBeGreaterThanOrEqual(1);
    expect(r.placements.length).toBe(3);
    expect(r.usedArea).toBe(3 * 1200 * 900);
  });
  it('drops rectangles larger than the sheet', () => {
    const r = pack2d([{ w: 5000, h: 5000 }], 2400, 1200);
    expect(r.placements.length).toBe(0);
  });
});

describe('performance — recompute budget', () => {
  it('the full ladder take-off resolves well under 100ms', () => {
    const s = sys('sys-ladder');
    const v: VariantSnapshot = { source_ref: { kind: 'local', name: 'Cage ladder', attributes: { has_cage: true } }, attributes: { has_cage: true } };
    const input = { criteria_values: { compliance_code: 'NF E85-016', material_finish: 'anodized' }, modifier_values: {}, primitive_input: 9200, property_values: {} };
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) {
      resolveTakeoff({ system: s, model: model(s), variant: v, materials: mats, resolveSubAssembly, resolveAttachedSystem, inventory: seed.inventory, input });
    }
    const perRun = (performance.now() - t0) / 20;
    expect(perRun).toBeLessThan(100);
  });
});
