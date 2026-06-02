// 1D cut aggregation — first-fit-decreasing bin packing. Offcut reuse is Brief 11.
import type { Algorithm } from './types';

export type CutBin = { stock_length: number; cuts: number[]; offcut: number };

export function cut(demands: number[], stockOptions: number[], allowance = 0) {
  const valid = demands.filter((d) => d > 0).sort((a, b) => b - a);
  const stock = stockOptions.length ? Math.max(...stockOptions) : valid[0] ?? 0;
  const bins: { remaining: number; cuts: number[] }[] = [];
  for (const d of valid) {
    const need = d + allowance;
    let bin = bins.find((b) => b.remaining >= need);
    if (!bin) {
      bin = { remaining: stock, cuts: [] };
      bins.push(bin);
    }
    bin.remaining -= need;
    bin.cuts.push(d);
  }
  const plan: CutBin[] = bins.map((b) => ({ stock_length: stock, cuts: b.cuts, offcut: b.remaining }));
  return { stocks: bins.length, stock_length: stock, total_offcut: bins.reduce((s, b) => s + b.remaining, 0), plan };
}

export const cutFromStock: Algorithm = {
  name: 'cut_from_stock',
  outputFields: ['stocks', 'total_offcut'],
  run(input) {
    const demands = (input.demands as number[] | undefined) ?? [];
    const options = (input.stock_options as number[] | undefined) ?? [];
    const allowance = Number(input.cut_allowance) || 0;
    const r = cut(demands, options, allowance);
    return { fields: { stocks: r.stocks, total_offcut: r.total_offcut }, detail: { stock_length: r.stock_length, plan: r.plan } };
  },
};
