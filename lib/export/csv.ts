import type { MtoLine } from '@/lib/types';

const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** MTO → CSV (pure). Columns: sku, description, qty, unit, notes. */
export function mtoToCsv(mto: MtoLine[]): string {
  const header = ['sku', 'description', 'qty', 'unit', 'notes'];
  const rows = mto.map((l) =>
    [l.sku, l.description, String(l.qty), l.unit, l.notes ?? ''].map(esc).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
