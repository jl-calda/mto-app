import { describe, it, expect } from 'vitest';
import { buildSystemTree, GENERIC_TREE, type Tag } from '@/lib/help/tree';
import { seed } from '@/lib/repo/seed';
import type { System } from '@/lib/types';

const sub = (tree: ReturnType<typeof buildSystemTree>, group: 'inputs' | 'outputs', id: string) =>
  tree.groups.find((g) => g.id === group)!.subgroups.find((s) => s.id === id)!;
const texts = (tags?: Tag[]) => (tags ?? []).map((t) => t.text);

describe('buildSystemTree', () => {
  const ladder = seed.systems.find((s) => s.id === 'sys-vectaladder') as System;
  const evo = seed.systems.find((s) => s.id === 'sys-evo-guardrail') as System;

  it('produces Inputs (measurement/variants/modifiers/criteria/properties) and Outputs (models/mto)', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    expect(tree.title).toBe(ladder.name);
    const inputs = tree.groups.find((g) => g.id === 'inputs')!;
    expect(inputs.subgroups.map((s) => s.id)).toEqual(['measurement', 'variants', 'modifiers', 'criteria', 'properties']);
    const outputs = tree.groups.find((g) => g.id === 'outputs')!;
    expect(outputs.subgroups.map((s) => s.id)).toEqual(['models', 'mto']);
  });

  it('reflects the real item counts and carries concept kinds for deep-linking', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    expect(sub(tree, 'inputs', 'variants').items.length).toBe(ladder.variants.rows.length);
    expect(sub(tree, 'inputs', 'modifiers').items.length).toBe(ladder.modifiers.length);
    expect(sub(tree, 'inputs', 'variants').kind).toBe('variant');
    expect(sub(tree, 'inputs', 'modifiers').kind).toBe('modifier');
    expect(sub(tree, 'outputs', 'models').kind).toBe('model');
    expect(sub(tree, 'outputs', 'models').items.length).toBe(ladder.models.length);
  });

  it('shows property→variant gating as chips (all vs specific)', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    const props = sub(tree, 'inputs', 'properties').items;
    expect(props.length).toBe(ladder.properties.length);
    for (const it of props) expect(it.chips && it.chips.length).toBeTruthy();
  });

  it('lists every model material in the gating breakdown, named from the catalogue', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    const total = ladder.models.reduce((n, m) => n + m.materials.length, 0);
    expect(tree.materials?.length).toBe(total);
    // names resolved from the catalogue, not raw ids
    const rest = tree.materials!.find((n) => n.id === 'vm-rest')!;
    expect(rest.label).toBe('Change-of-flight platform');
    expect(rest.detail).toContain('REST-PLATFORM');
    // falls back to the material id when the catalogue is absent
    const idOnly = buildSystemTree(ladder).materials!.find((n) => n.id === 'vm-rest')!;
    expect(idOnly.label).toBe('mat-vl-restplatform');
  });

  it('traces applies_when gates onto each material (variant / criterion / modifier)', () => {
    const tree = buildSystemTree(evo, seed.materials);
    // counterweight z2 is gated by variant Freestanding + criterion wind_zone=2
    const cwZ2 = tree.materials!.find((n) => n.id === 'em-cw-z2')!;
    expect(texts(cwZ2.when)).toEqual(expect.arrayContaining(['Freestanding', 'wind_zone = 2']));
    expect(cwZ2.qty).toBe('3× per place_supports.supports');
    // straight upright is gated by the upright_angle modifier
    const upr = tree.materials!.find((n) => n.id === 'em-upr')!;
    expect(texts(upr.when)).toContain('upright_angle = straight');
    // an unconditional rule reads "always"
    const rail = tree.materials!.find((n) => n.id === 'em-rail')!;
    expect(texts(rail.when)).toEqual(['always']);
  });

  it('shows which input picks a material SKU (sku_lookup keys)', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    const bracket = tree.materials!.find((n) => n.id === 'vm-bracket')!;
    expect(texts(bracket.skuFrom)).toEqual(['wall_offset band', 'substrate']);
    expect(bracket.skuFrom!.every((t) => t.tone === 'sku')).toBe(true);
  });

  it('reverse-indexes input role tags (gates / picks SKU / drives qty)', () => {
    const tree = buildSystemTree(ladder, seed.materials);
    // wall_offset modifier only keys a SKU (it gates nothing) → "picks SKU"
    const wallOffset = sub(tree, 'inputs', 'modifiers').items.find((i) => i.label === 'wall_offset')!;
    expect(texts(wallOffset.tags)).toContain('picks SKU');
    // rungs property drives quantity
    const rungs = sub(tree, 'inputs', 'properties').items.find((i) => i.label === 'rungs')!;
    expect(texts(rungs.tags).some((t) => t.startsWith('drives qty'))).toBe(true);
  });

  it('surfaces the criterion gating values observed in the rules (e.g. wind_zone → 1/2/3)', () => {
    const tree = buildSystemTree(evo, seed.materials);
    const windZone = sub(tree, 'inputs', 'criteria').items.find((i) => i.label === 'wind_zone')!;
    expect(windZone.chips).toEqual(['1', '2', '3']);
    expect(texts(windZone.tags).some((t) => t.startsWith('gates'))).toBe(true);
  });
});

describe('GENERIC_TREE', () => {
  it('has the same Inputs/Outputs skeleton for the no-subject fallback', () => {
    expect(GENERIC_TREE.groups.map((g) => g.id)).toEqual(['inputs', 'outputs']);
    const inputs = GENERIC_TREE.groups[0];
    expect(inputs.subgroups.map((s) => s.kind)).toContain('variant');
    expect(inputs.subgroups.every((s) => s.items.length > 0)).toBe(true);
  });

  it('omits the per-material gating breakdown (no concrete system)', () => {
    expect(GENERIC_TREE.materials).toBeUndefined();
  });
});
