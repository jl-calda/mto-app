// Shared band-matching for banded_distance modifiers. Extracted so the engine
// (SKU resolution) and the UI (BandControl highlight + out-of-range warning) use
// one definition. Pure, no engine imports.

export type Band = { range: [number, number]; sku_key: string };

/** Index of the band whose inclusive range contains `value`, else -1 (out of range). */
export function activeBandIndex(value: number, bands: Band[]): number {
  return bands.findIndex((b) => value >= b.range[0] && value <= b.range[1]);
}
