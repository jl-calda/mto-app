// Support placement. Greedy v1 + an optimal even-spacing variant (Brief 10) —
// both behind the same Algorithm contract so the model can swap solvers and the
// contract tests cover both. Honours max_spacing, end clearances, forbidden zones,
// and required positions (Brief 10 item 34).
import type { Algorithm } from './types';
import type { PlacementRules, SupportGrid } from '@/lib/types';

function inForbidden(p: number, zones: { start: number; end: number }[]): boolean {
  return zones.some((z) => p >= z.start && p <= z.end);
}

function snapToGrid(positions: number[], grid: SupportGrid | undefined, length: number): number[] {
  if (!grid || grid.kind !== 'regular' || grid.spacing <= 0) return positions;
  const phase = grid.phase ?? 0;
  return positions.map((p) => {
    const snapped = Math.round((p - phase) / grid.spacing) * grid.spacing + phase;
    return Math.max(0, Math.min(length, snapped));
  });
}

function finalize(positions: number[], length: number, rules: PlacementRules, grid?: SupportGrid): number[] {
  const forbidden = rules.forbidden_zones ?? [];
  const required = rules.required_positions ?? [];
  let all = [...positions.filter((p) => !inForbidden(p, forbidden)), ...required];
  all = snapToGrid(all, grid, length);

  // satisfy min_count_in_region by adding evenly-spaced positions where short
  for (const r of rules.min_count_in_region ?? []) {
    const lo = r.from === 'head' ? length - r.distance : 0;
    const hi = r.from === 'head' ? length : r.distance;
    const inRegion = all.filter((p) => p >= lo && p <= hi);
    if (inRegion.length < r.min) {
      const need = r.min - inRegion.length;
      const step = (hi - lo) / (r.min + 1);
      for (let i = 1; i <= need; i++) all.push(lo + step * i);
    }
  }
  return [...new Set(all.map((p) => Math.round(p)))].sort((a, b) => a - b).filter((p) => p >= 0 && p <= length);
}

/** Greedy: foot clearance, then step by max_spacing, then head. */
export function place(length: number, rules: PlacementRules, grid?: SupportGrid): number[] {
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
  return finalize(positions, length, rules, grid);
}

/** Optimal: minimum supports that satisfy max_spacing, spread evenly across the span. */
export function placeOptimal(length: number, rules: PlacementRules, grid?: SupportGrid): number[] {
  if (length <= 0) return [];
  const maxSpacing = rules.max_spacing ?? length;
  const foot = rules.end_clearance_foot?.max ?? 0;
  const head = rules.end_clearance_head?.max ?? 0;
  const span = Math.max(0, length - foot - head);
  const intervals = Math.max(1, Math.ceil(span / Math.max(1, maxSpacing)));
  const step = span / intervals;
  const positions = Array.from({ length: intervals + 1 }, (_, i) => foot + i * step);
  return finalize(positions, length, rules, grid);
}

export const placeSupports: Algorithm = {
  name: 'place_supports',
  outputFields: ['supports'],
  run(input) {
    const length = Number(input.length) || 0;
    const rules = (input.placement_rules as PlacementRules | undefined) ?? {};
    const positions = place(length, rules, input.support_grid as SupportGrid | undefined);
    return { fields: { supports: positions.length }, detail: { positions } };
  },
};

/** ILP-flavoured optimal regular-grid solver — same contract; swapped in per model. */
export const placeSupportsOptimal: Algorithm = {
  name: 'place_supports_optimal',
  outputFields: ['supports'],
  run(input) {
    const length = Number(input.length) || 0;
    const rules = (input.placement_rules as PlacementRules | undefined) ?? {};
    const positions = placeOptimal(length, rules, input.support_grid as SupportGrid | undefined);
    return { fields: { supports: positions.length }, detail: { positions } };
  },
};
