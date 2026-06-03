import { describe, it, expect } from 'vitest';
import { place, placeSegmented } from '@/lib/engine/algorithms/place-supports';
import type { PlacementRules } from '@/lib/types';

// guardrail-style uprights: ≤1.5 m apart, small end clearances
const rules: PlacementRules = { max_spacing: 1500, end_clearance_foot: { max: 150 }, end_clearance_head: { max: 150 } };

describe('place_supports geometry', () => {
  it('whole-run placement honours max-spacing + clearances', () => {
    expect(place(16000, rules)).toHaveLength(12);
    expect(place(6000, rules)).toHaveLength(5);
    expect(place(0, rules)).toHaveLength(0);
  });

  it('per-segment forces one shared post at each corner (no double count)', () => {
    const pos = placeSegmented([10000, 6000], rules);
    expect(pos).toHaveLength(12); // 8 + 5 − 1 shared corner post
    expect(pos.filter((p) => p === 10000)).toHaveLength(1); // the corner is de-duplicated
  });

  it('short legs each force their own end posts (a support cannot span a corner)', () => {
    // whole 6 m run would give 5; three 2 m legs need posts at all 4 nodes + 1 mid each
    expect(placeSegmented([2000, 2000, 2000], rules)).toHaveLength(7);
    expect(place(6000, rules)).toHaveLength(5);
  });

  it('a single segment matches whole-run placement', () => {
    expect(placeSegmented([16000], rules)).toHaveLength(place(16000, rules).length);
  });
});
