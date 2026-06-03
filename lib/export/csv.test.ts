import { describe, it, expect } from 'vitest';
import { mtoToCsv } from '@/lib/export/csv';
import type { MtoLine } from '@/lib/types';

const line = (o: Partial<MtoLine>): MtoLine => ({ sku: '', description: '', qty: 0, unit: 'ea', source_material_id: 'm', ...o });

describe('mtoToCsv', () => {
  it('emits a header then one row per line', () => {
    const csv = mtoToCsv([line({ sku: 'A', description: 'Alpha', qty: 3, unit: 'ea' })]);
    const rows = csv.split('\n');
    expect(rows[0]).toBe('sku,description,qty,unit,notes');
    expect(rows[1]).toBe('A,Alpha,3,ea,');
    expect(rows).toHaveLength(2);
  });

  it('quotes and escapes fields containing commas, quotes or newlines', () => {
    const csv = mtoToCsv([line({ sku: 'B', description: 'has, comma "q"', qty: 1, unit: 'm', notes: 'a\nb' })]);
    expect(csv).toContain('"has, comma ""q"""'); // comma + doubled quotes
    expect(csv).toContain('"a\nb"'); // embedded newline quoted
  });

  it('handles an empty MTO (header only)', () => {
    expect(mtoToCsv([])).toBe('sku,description,qty,unit,notes');
  });
});
