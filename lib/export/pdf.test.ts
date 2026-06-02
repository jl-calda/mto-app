import { describe, it, expect } from 'vitest';
import { mtoToPdf } from '@/lib/export/pdf';

describe('pdf export', () => {
  it('produces a valid single-page PDF with the MTO', () => {
    const bytes = mtoToPdf(
      [
        { sku: 'VEC-LDR-S-3000-AN', description: 'Ladder stile · 3000 mm', qty: 4, unit: 'ea', source_material_id: 'mat-stile', notes: '7 cut(s)' },
        { sku: 'VEC-LDR-RUNG-AN', description: 'Rung · anodized', qty: 35, unit: 'ea', source_material_id: 'mat-rung' },
      ],
      'Plant access ladder',
    );
    const s = new TextDecoder().decode(bytes);
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(s).toContain('/BaseFont/Courier');
    expect(s).toContain('startxref');
    expect(bytes.byteLength).toBeGreaterThan(300);
  });
});
