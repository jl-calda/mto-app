import { describe, it, expect } from 'vitest';
import { blankParam, blankSam, coerceParamDefault } from '@/lib/subassembly-authoring';

describe('sub-assembly authoring helpers', () => {
  it('blankSam references the material with a fixed 1x default rule', () => {
    const sam = blankSam('sam-1', 'mat-x');
    expect(sam).toEqual({ id: 'sam-1', material_id: 'mat-x', rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } });
  });

  it('blankParam is an optional number parameter', () => {
    expect(blankParam('p1')).toEqual({ name: 'p1', type: { kind: 'number' }, required: false });
  });

  it('coerceParamDefault coerces by input kind', () => {
    expect(coerceParamDefault('12', 'number')).toBe(12);
    expect(coerceParamDefault('3.5', 'distance')).toBe(3.5);
    expect(coerceParamDefault('true', 'bool')).toBe(true);
    expect(coerceParamDefault('no', 'bool')).toBe(false);
    expect(coerceParamDefault('captive', 'enum')).toBe('captive');
    expect(coerceParamDefault('', 'number')).toBeUndefined();
    expect(coerceParamDefault('abc', 'integer')).toBeUndefined();
  });
});
