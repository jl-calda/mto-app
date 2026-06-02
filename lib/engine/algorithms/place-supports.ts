// Support placement — greedy v1 (ILP swap is Brief 10, behind this same interface).
import type { Algorithm } from './types';
import type { PlacementRules } from '@/lib/types';

export function place(length: number, rules: PlacementRules): number[] {
  if (length <= 0) return [];
  const maxSpacing = rules.max_spacing ?? length;
  const footClear = rules.end_clearance_foot?.max ?? maxSpacing;
  const headClear = rules.end_clearance_head?.max ?? maxSpacing;

  const positions: number[] = [];
  let pos = Math.min(footClear, maxSpacing);
  positions.push(pos);
  while (pos + maxSpacing <= length - headClear) {
    pos += maxSpacing;
    positions.push(pos);
  }
  const head = length - headClear;
  if (head > 0 && positions[positions.length - 1] < head - 1) positions.push(head);
  return positions.filter((p) => p >= 0 && p <= length);
}

export const placeSupports: Algorithm = {
  name: 'place_supports',
  outputFields: ['supports'],
  run(input) {
    const length = Number(input.length) || 0;
    const rules = (input.placement_rules as PlacementRules | undefined) ?? {};
    const positions = place(length, rules);
    return { fields: { supports: positions.length }, detail: { positions } };
  },
};
