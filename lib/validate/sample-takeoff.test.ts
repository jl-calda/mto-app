import { describe, it, expect } from 'vitest';
import { resolveTakeoff } from '@/lib/engine';
import { seed } from '@/lib/repo/seed';
import { synthSample, ENGINE_NOISE, type EditorSample } from '@/lib/validate/sample-takeoff';

const evo = seed.systems.find((s) => s.id === 'sys-evo-guardrail')!;
const evoModel = evo.models.find((m) => m.id === 'mdl-evo-fs')!;

const base: EditorSample = { variant: 'Freestanding', criteria: { compliance_code: 'NF_E85-015', wind_zone: '1' }, props: {}, primitive: 24000 };
const cwQty = (wind_zone: string) => {
  const r = resolveTakeoff(synthSample(evo, evoModel, { ...base, criteria: { ...base.criteria, wind_zone } }, seed.materials));
  return Object.fromEntries(r.mto.map((l) => [l.sku, l.qty]))['03468'] ?? 0;
};

describe('synthSample → resolveTakeoff (live engine-warnings source)', () => {
  it('produces a real MTO from the editor sample state', () => {
    const r = resolveTakeoff(synthSample(evo, evoModel, base, seed.materials));
    expect(r.mto.length).toBeGreaterThan(0);
    expect(r.mto.some((l) => l.sku === 'UPR-STR-AL')).toBe(true);
    expect(r.mto.some((l) => l.sku === 'BASE-FS')).toBe(true); // sku_lookup resolved from base_type default
  });

  it('per-upright counterweights vanish at an uncovered wind zone (the coverage gap, proven live)', () => {
    expect(cwQty('1')).toBeGreaterThan(cwQty('4')); // {1,2,3} covered; zone 4 is not
    expect(cwQty('4')).toBe(2); // only the per-free-end rule (open on wind_zone) remains
  });

  it('ENGINE_NOISE matches resolver-absent artifacts but not real warnings', () => {
    expect(ENGINE_NOISE.test('sub-assembly sa-evo-zfix not found')).toBe(true);
    expect(ENGINE_NOISE.test('attached system sys-evo-guardrail not found')).toBe(true);
    expect(ENGINE_NOISE.test('STILE-AL: 2 cut(s) exceed the 6,000 mm stock length')).toBe(false);
  });
});
