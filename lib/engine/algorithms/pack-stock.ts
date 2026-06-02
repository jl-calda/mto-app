// 1D stock packing — tight (butt + overlap) or spaced (gaps ≤ max). Greedy v1.
import type { Algorithm } from './types';

export type PackPolicy =
  | { mode: 'tight'; overlap_per_joint?: number }
  | { mode: 'spaced'; max_gap: number };

export type PackResult = {
  pieces: number;
  joints: number;
  cover: number;
  wastage: number;
  list: number[];
};

export function pack(
  length: number,
  options: number[],
  policy: PackPolicy = { mode: 'tight', overlap_per_joint: 0 },
): PackResult {
  const stock = options.length ? Math.max(...options) : length;
  if (length <= 0 || stock <= 0) return { pieces: 0, joints: 0, cover: 0, wastage: 0, list: [] };

  if (policy.mode === 'tight') {
    const o = policy.overlap_per_joint ?? 0;
    const n = Math.max(1, Math.ceil((length - o) / Math.max(1, stock - o)));
    const cover = n * stock - (n - 1) * o;
    return { pieces: n, joints: n - 1, cover, wastage: cover - length, list: Array(n).fill(stock) };
  }
  // spaced: pieces of `stock` with gaps up to max_gap covering `length`
  const g = policy.max_gap;
  const n = Math.max(1, Math.ceil((length + g) / (stock + g)));
  const cover = n * stock;
  return { pieces: n, joints: 0, cover, wastage: Math.max(0, cover - length), list: Array(n).fill(stock) };
}

export const packStock: Algorithm = {
  name: 'pack_stock',
  outputFields: ['pieces', 'joints', 'cover', 'wastage'],
  run(input) {
    const length = Number(input.length) || 0;
    const options = (input.stock_options as number[] | undefined) ?? [];
    const policy = (input.policy as PackPolicy | undefined) ?? { mode: 'tight', overlap_per_joint: 0 };
    const r = pack(length, options, policy);
    return {
      fields: { pieces: r.pieces, joints: r.joints, cover: r.cover, wastage: r.wastage },
      detail: { list: r.list },
    };
  },
};
