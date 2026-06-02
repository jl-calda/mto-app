// 2D shelf packing — places same-or-mixed rectangles onto stock sheets using a
// deterministic first-fit shelf (next-fit decreasing height) heuristic. Used by
// the area primitive (Brief 11). Greedy v1 behind the stable Algorithm contract.
import type { Algorithm } from './types';

export type Rect = { w: number; h: number; id?: string };
export type Placement = { sheet: number; x: number; y: number; w: number; h: number; id?: string };

export function pack2d(rects: Rect[], sheetW: number, sheetH: number): { sheets: number; placements: Placement[]; usedArea: number; sheetArea: number } {
  const valid = rects.filter((r) => r.w > 0 && r.h > 0 && r.w <= sheetW && r.h <= sheetH)
    .map((r, i) => ({ ...r, id: r.id ?? `r${i}` }))
    .sort((a, b) => b.h - a.h || b.w - a.w); // tallest-first, then widest (deterministic)

  const placements: Placement[] = [];
  let sheet = 0;
  let shelfY = 0;
  let shelfH = 0;
  let cursorX = 0;
  let usedArea = 0;

  const newShelf = (h: number) => { shelfY += shelfH; shelfH = h; cursorX = 0; };
  const newSheet = () => { sheet += 1; shelfY = 0; shelfH = 0; cursorX = 0; };

  for (const r of valid) {
    if (cursorX + r.w > sheetW) {
      // doesn't fit on the current shelf → open a new shelf (or sheet)
      if (shelfY + shelfH + r.h > sheetH) newSheet();
      newShelf(r.h);
    }
    if (shelfH === 0) shelfH = r.h; // first item on a fresh sheet
    if (shelfY + r.h > sheetH) { newSheet(); shelfH = r.h; }
    placements.push({ sheet, x: cursorX, y: shelfY, w: r.w, h: r.h, id: r.id });
    cursorX += r.w;
    usedArea += r.w * r.h;
  }

  const sheets = placements.length ? sheet + 1 : 0;
  return { sheets, placements, usedArea, sheetArea: sheets * sheetW * sheetH };
}

export const packStock2d: Algorithm = {
  name: 'pack_stock_2d',
  outputFields: ['sheets', 'used_area', 'wastage'],
  run(input) {
    const rects = (input.rects as Rect[] | undefined) ?? [];
    const sheetW = Number(input.sheet_w) || 0;
    const sheetH = Number(input.sheet_h) || 0;
    const r = pack2d(rects, sheetW, sheetH);
    return {
      fields: { sheets: r.sheets, used_area: r.usedArea, wastage: Math.max(0, r.sheetArea - r.usedArea) },
      detail: { placements: r.placements, sheet_w: sheetW, sheet_h: sheetH },
    };
  },
};
