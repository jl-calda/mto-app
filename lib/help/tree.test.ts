import { describe, it, expect } from 'vitest';
import { buildSystemTree, GENERIC_TREE } from '@/lib/help/tree';
import { seed } from '@/lib/repo/seed';
import type { System } from '@/lib/types';

const sub = (tree: ReturnType<typeof buildSystemTree>, group: 'inputs' | 'outputs', id: string) =>
  tree.groups.find((g) => g.id === group)!.subgroups.find((s) => s.id === id)!;

describe('buildSystemTree', () => {
  const ladder = seed.systems.find((s) => s.id === 'sys-vectaladder') as System;

  it('produces Inputs (measurement/variants/modifiers/criteria/properties) and Outputs (models/mto)', () => {
    const tree = buildSystemTree(ladder);
    expect(tree.title).toBe(ladder.name);
    const inputs = tree.groups.find((g) => g.id === 'inputs')!;
    expect(inputs.subgroups.map((s) => s.id)).toEqual(['measurement', 'variants', 'modifiers', 'criteria', 'properties']);
    const outputs = tree.groups.find((g) => g.id === 'outputs')!;
    expect(outputs.subgroups.map((s) => s.id)).toEqual(['models', 'mto']);
  });

  it('reflects the real item counts and carries concept kinds for deep-linking', () => {
    const tree = buildSystemTree(ladder);
    expect(sub(tree, 'inputs', 'variants').items.length).toBe(ladder.variants.rows.length);
    expect(sub(tree, 'inputs', 'modifiers').items.length).toBe(ladder.modifiers.length);
    expect(sub(tree, 'inputs', 'variants').kind).toBe('variant');
    expect(sub(tree, 'inputs', 'modifiers').kind).toBe('modifier');
    expect(sub(tree, 'outputs', 'models').kind).toBe('model');
    expect(sub(tree, 'outputs', 'models').items.length).toBe(ladder.models.length);
  });

  it('shows property→variant gating as chips (all vs specific)', () => {
    const tree = buildSystemTree(ladder);
    const props = sub(tree, 'inputs', 'properties').items;
    expect(props.length).toBe(ladder.properties.length);
    // every property lists at least one gating chip ("all variants" or specific names)
    for (const it of props) expect(it.chips && it.chips.length).toBeTruthy();
  });
});

describe('GENERIC_TREE', () => {
  it('has the same Inputs/Outputs skeleton for the no-subject fallback', () => {
    expect(GENERIC_TREE.groups.map((g) => g.id)).toEqual(['inputs', 'outputs']);
    const inputs = GENERIC_TREE.groups[0];
    expect(inputs.subgroups.map((s) => s.kind)).toContain('variant');
    expect(inputs.subgroups.every((s) => s.items.length > 0)).toBe(true);
  });
});
