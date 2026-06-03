import { describe, it, expect } from 'vitest';
import { resolveInputType, resolveModifierType, resolveCriterion } from '@/components/inputs/resolve-control';
import type { InputType, ModifierType } from '@/lib/types';

describe('resolveInputType', () => {
  it('distance → number with mm + step', () => {
    expect(resolveInputType({ kind: 'distance' })).toMatchObject({ control: 'number', unit: 'mm', step: 1, tag: 'mm' });
  });
  it('integer → number step 1', () => {
    expect(resolveInputType({ kind: 'integer' })).toMatchObject({ control: 'number', step: 1, tag: 'integer' });
  });
  it('bool → toggle', () => {
    expect(resolveInputType({ kind: 'bool' })).toMatchObject({ control: 'toggle' });
  });
  it('enum with values → select; multi → chips; empty → text', () => {
    expect(resolveInputType({ kind: 'enum', values: ['a', 'b'] })).toMatchObject({ control: 'select' });
    expect(resolveInputType({ kind: 'enum', values: ['a'] }, { multi: true })).toMatchObject({ control: 'chips' });
    expect(resolveInputType({ kind: 'enum', values: [] })).toMatchObject({ control: 'text' });
  });
  it('variant → select over its options', () => {
    const t: InputType = { kind: 'variant', options: [{ value: 'x', label: 'X', sub_inputs: [] }] };
    expect(resolveInputType(t)).toMatchObject({ control: 'select', options: [{ value: 'x', label: 'X' }] });
  });
});

describe('resolveModifierType', () => {
  it('percentage → number bounded 0–100 %', () => {
    expect(resolveModifierType({ kind: 'percentage' })).toMatchObject({ control: 'number', unit: '%', min: 0, max: 100, tag: '0–100%' });
  });
  it('banded_distance → band control carrying the bands', () => {
    const t: ModifierType = { kind: 'banded_distance', bands: [{ range: [0, 9], sku_key: 's' }] };
    expect(resolveModifierType(t)).toMatchObject({ control: 'band', unit: 'mm', tag: 'bands' });
  });
  it('enum_with_attributes → select on names', () => {
    const t: ModifierType = { kind: 'enum_with_attributes', values: [{ name: 'm', attrs: {} }] };
    expect(resolveModifierType(t)).toMatchObject({ control: 'select', options: [{ value: 'm', label: 'm' }] });
  });
  it('support_grid / discrete_set → advanced (visible, not dropped)', () => {
    expect(resolveModifierType({ kind: 'support_grid' })).toMatchObject({ control: 'advanced' });
    expect(resolveModifierType({ kind: 'discrete_set', element_type: { kind: 'distance' } })).toMatchObject({ control: 'advanced' });
  });
});

describe('resolveCriterion', () => {
  it('derived options → select; multi → chips; none → free text', () => {
    expect(resolveCriterion({ options: ['NF', 'EN'] })).toMatchObject({ control: 'select' });
    expect(resolveCriterion({ options: ['NF', 'EN'], multi: true })).toMatchObject({ control: 'chips' });
    expect(resolveCriterion({})).toMatchObject({ control: 'text', tag: 'free text' });
  });
});
