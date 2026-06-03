import { describe, it, expect } from 'vitest';
import { deriveCriteria, derivePrimitiveTotal, deriveVariantIndex } from '@/lib/takeoff-init';
import { seed } from '@/lib/repo/seed';
import type { Takeoff } from '@/lib/types';

const evo = seed.systems.find((s) => s.id === 'sys-evo-guardrail')!;

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

  it('deriveVariantIndex finds the saved variant row, else 0', () => {
    const want = evo.variants.rows.findIndex((r) => r.kind === 'local' && r.name === 'Freestanding');
    const t = { variant_choice: { source_ref: { kind: 'local', name: 'Freestanding', attributes: {} } } } as unknown as Takeoff;
    expect(deriveVariantIndex(evo, t)).toBe(want);
    expect(deriveVariantIndex(evo, null)).toBe(0);
    const missing = { variant_choice: { source_ref: { kind: 'local', name: 'Nope', attributes: {} } } } as unknown as Takeoff;
    expect(deriveVariantIndex(evo, missing)).toBe(0);
  });
});
