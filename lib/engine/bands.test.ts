import { describe, it, expect } from 'vitest';
import { activeBandIndex, type Band } from '@/lib/engine/bands';

const bands: Band[] = [
  { range: [205, 470], sku_key: 'a' },
  { range: [471, 750], sku_key: 'b' },
];

describe('activeBandIndex', () => {
  it('returns -1 below the first range', () => {
    expect(activeBandIndex(100, bands)).toBe(-1);
  });
  it('matches inside a range', () => {
    expect(activeBandIndex(300, bands)).toBe(0);
    expect(activeBandIndex(600, bands)).toBe(1);
  });
  it('is inclusive on both boundaries', () => {
    expect(activeBandIndex(205, bands)).toBe(0);
    expect(activeBandIndex(470, bands)).toBe(0);
    expect(activeBandIndex(471, bands)).toBe(1);
    expect(activeBandIndex(750, bands)).toBe(1);
  });
  it('returns -1 in a gap between non-contiguous bands', () => {
    const gapped: Band[] = [{ range: [0, 10], sku_key: 'x' }, { range: [20, 30], sku_key: 'y' }];
    expect(activeBandIndex(15, gapped)).toBe(-1);
  });
  it('returns -1 above the last range', () => {
    expect(activeBandIndex(9999, bands)).toBe(-1);
  });
});
