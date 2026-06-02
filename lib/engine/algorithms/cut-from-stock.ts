// 1D cut aggregation — first-fit-decreasing bin packing. Offcut reuse (Brief 11):
// available offcuts (from inventory) are consulted as zero-cost stock and cut from
// before any new full-length stock is purchased.
import type { Algorithm } from './types';

export type CutBin = { stock_length: number; cuts: number[]; offcut: number; from_offcut?: boolean };

export function cut(demands: number[], stockOptions: number[], allowance = 0, offcuts: number[] = []) {
  const valid = demands.filter((d) => d > 0).sort((a, b) => b - a);
  const stock = stockOptions.length ? Math.max(...stockOptions) : valid[0] ?? 0;
  // pre-seed bins with available offcuts (largest first) — these are free.
  const bins: { remaining: number; cuts: number[]; capacity: number; fromOffcut: boolean }[] =
    [...offcuts].filter((o) => o > 0).sort((a, b) => b - a).map((o) => ({ remaining: o, cuts: [], capacity: o, fromOffcut: true }));
  for (const d of valid) {
    const need = d + allowance;
    let bin = bins.find((b) => b.remaining >= need);
    if (!bin) {
      bin = { remaining: stock, cuts: [], capacity: stock, fromOffcut: false };
      bins.push(bin);
    }
    bin.remaining -= need;
    bin.cuts.push(d);
  }
  const used = bins.filter((b) => b.cuts.length > 0);
  const plan: CutBin[] = used.map((b) => ({ stock_length: b.capacity, cuts: b.cuts, offcut: b.remaining, from_offcut: b.fromOffcut }));
  const newStocks = used.filter((b) => !b.fromOffcut);
  return {
    stocks: newStocks.length,
    offcuts_used: used.filter((b) => b.fromOffcut).length,
    stock_length: stock,
    total_offcut: newStocks.reduce((s, b) => s + b.remaining, 0),
    plan,
  };
}

export const cutFromStock: Algorithm = {
  name: 'cut_from_stock',
  outputFields: ['stocks', 'total_offcut', 'offcuts_used'],
  run(input) {
    const demands = (input.demands as number[] | undefined) ?? [];
    const options = (input.stock_options as number[] | undefined) ?? [];
    const allowance = Number(input.cut_allowance) || 0;
    const offcuts = (input.offcuts as number[] | undefined) ?? [];
    const r = cut(demands, options, allowance, offcuts);
    return { fields: { stocks: r.stocks, total_offcut: r.total_offcut, offcuts_used: r.offcuts_used }, detail: { stock_length: r.stock_length, plan: r.plan } };
  },
};
