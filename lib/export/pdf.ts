// Minimal dependency-free PDF writer for the MTO / cutting list. Produces a single
// A4 page of monospaced text (Courier) — enough for a procurement print-out without
// pulling in a PDF library. Pure; runs in the browser (download) or server.

import type { MtoLine } from '@/lib/types';

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, '-');
const esc = (s: string) => ascii(s).replace(/[\\()]/g, (c) => '\\' + c);

export function mtoToPdf(mto: MtoLine[], title: string): Uint8Array {
  const header = [`MTO  -  ${title}`, ''.padEnd(64, '='), `${'QTY'.padStart(5)} ${'UNIT'.padEnd(5)} ${'SKU'.padEnd(22)} DESCRIPTION`, ''.padEnd(64, '-')];
  const body = mto.map((l) => `${String(l.qty).padStart(5)} ${String(l.unit).padEnd(5)} ${l.sku.padEnd(22)} ${l.description}${l.notes ? `  (${l.notes})` : ''}`);
  const totalItems = mto.reduce((s, l) => s + l.qty, 0);
  const footer = ['', ''.padEnd(64, '-'), `${String(totalItems).padStart(5)}       ${mto.length} line(s)`];
  const lines = [...header, ...body, ...footer].slice(0, 56); // single page

  let content = 'BT /F1 9 Tf 12 TL 40 800 Td\n';
  for (const ln of lines) content += `(${esc(ln)}) Tj T*\n`;
  content += 'ET';

  const objs: Record<number, string> = {
    1: '<</Type/Catalog/Pages 2 0 R>>',
    2: '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    3: '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    4: '<</Type/Font/Subtype/Type1/BaseFont/Courier>>',
    5: `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
  };

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i <= 5; i++) { offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xrefStart = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
