'use client';

import { useMemo, useState } from 'react';
import { standardRegistry } from '@/lib/engine';
import { Stat, PrimitiveBadge } from '@/components/chrome';
import { NumberControl } from '@/components/inputs';

type Panel = { w: number; h: number; qty: number };
type Placement = { sheet: number; x: number; y: number; w: number; h: number; id?: string };

const PALETTE = ['#DCE6F7', '#DCEAEB', '#F0E6D2', '#E8DEF5', '#E5EFE4', '#F5DDD0'];

export function AreaTakeoff({ title }: { title: string }) {
  const [sheet, setSheet] = useState({ w: 2400, h: 1200 });
  const [panels, setPanels] = useState<Panel[]>([
    { w: 1200, h: 900, qty: 3 },
    { w: 800, h: 600, qty: 4 },
    { w: 2000, h: 500, qty: 2 },
  ]);

  const result = useMemo(() => {
    const rects = panels.flatMap((p, pi) => Array.from({ length: Math.max(0, p.qty) }, (_, k) => ({ w: p.w, h: p.h, id: `${pi}-${k}` })));
    const algo = standardRegistry.get('pack_stock_2d')!;
    const out = algo.run({ rects, sheet_w: sheet.w, sheet_h: sheet.h });
    const detail = out.detail as { placements: Placement[]; sheet_w: number; sheet_h: number };
    return { sheets: out.fields.sheets, usedArea: out.fields.used_area, wastage: out.fields.wastage, placements: detail.placements };
  }, [panels, sheet]);

  const sheetArea = result.sheets * sheet.w * sheet.h;
  const wastagePct = sheetArea > 0 ? Math.round((result.wastage / sheetArea) * 100) : 0;
  const setPanel = (i: number, patch: Partial<Panel>) => setPanels((a) => a.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const bySheet = Array.from({ length: result.sheets }, (_, s) => result.placements.filter((p) => p.sheet === s));
  const SVGW = 280;
  const scale = SVGW / sheet.w;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex flex-col gap-3 border-b border-line pb-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">{title}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="chip seglength dot">area</span>
            <span className="tag">pack_stock_2d · shelf nesting</span>
          </div>
        </div>
        <div className="flex flex-wrap border-line lg:border-l">
          <Stat k="sheets" v={result.sheets} />
          <Stat k="used m²" v={(result.usedArea / 1e6).toFixed(2)} />
          <Stat k="wastage" v={`${wastagePct}%`} highlight={wastagePct > 30 ? 'warn' : undefined} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-3">
          <Section index="01" title="Sheet stock">
            <div className="flex items-center gap-2">
              <Num label="width" v={sheet.w} on={(v) => setSheet((s) => ({ ...s, w: v }))} />
              <span className="text-ink-4">×</span>
              <Num label="height" v={sheet.h} on={(v) => setSheet((s) => ({ ...s, h: v }))} />
              <span className="mono text-[11px] text-ink-3">mm</span>
            </div>
          </Section>
          <Section index="02" title="Panels to nest">
            <div className="flex flex-col gap-1.5">
              {panels.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Num label="w" v={p.w} on={(v) => setPanel(i, { w: v })} />
                  <span className="text-ink-4">×</span>
                  <Num label="h" v={p.h} on={(v) => setPanel(i, { h: v })} />
                  <span className="mono text-[11px] text-ink-3">× qty</span>
                  <Num label="qty" v={p.qty} on={(v) => setPanel(i, { qty: v })} w={56} />
                  <span className="flex-1" />
                  <span className="h-3.5 w-3.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length], border: '1px solid var(--line-2)' }} />
                  {panels.length > 1 && <button className="btn sm danger" onClick={() => setPanels((a) => a.filter((_, j) => j !== i))}>×</button>}
                </div>
              ))}
              <button className="btn sm self-start" onClick={() => setPanels((a) => [...a, { w: 600, h: 600, qty: 1 }])}>+ Add panel</button>
            </div>
            {wastagePct > 30 && (
              <div className="mt-2.5 flex items-start gap-2 rounded p-2.5 text-[11px]" style={{ background: 'var(--warn-soft)', border: '1px solid #E8C97A' }}>
                <span className="mono text-warn">●</span>
                <span className="text-ink-2">High wastage ({wastagePct}%) — consider a different sheet size or nesting order.</span>
              </div>
            )}
          </Section>
        </div>

        <Section index="03" title={`Nesting · ${result.sheets} sheet(s)`}>
          <div className="flex flex-wrap gap-3">
            {bySheet.map((places, s) => (
              <div key={s}>
                <div className="uc mb-1">sheet {s + 1}</div>
                <svg width={SVGW} height={sheet.h * scale} style={{ display: 'block', background: 'var(--bg-2)', border: '1px solid var(--line-2)' }}>
                  {places.map((p, i) => {
                    const pi = Number(p.id?.split('-')[0] ?? 0);
                    return (
                      <g key={i}>
                        <rect x={p.x * scale} y={p.y * scale} width={Math.max(1, p.w * scale - 1)} height={Math.max(1, p.h * scale - 1)} fill={PALETTE[pi % PALETTE.length]} stroke="var(--line-strong)" strokeWidth={0.5} />
                        {p.w * scale > 28 && p.h * scale > 14 && (
                          <text x={p.x * scale + 3} y={p.y * scale + 12} fontSize={8} fontFamily="var(--font-mono)" fill="var(--ink-2)">{p.w}×{p.h}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ))}
            {result.sheets === 0 && <div className="text-[12px] text-ink-3">Add panels that fit within the sheet.</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Num({ label, v, on, w = 84 }: { label: string; v: number; on: (v: number) => void; w?: number }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="mono text-[9px] text-ink-3">{label}</span>
      <div style={{ width: w }}>
        <NumberControl unit="mm" min={0} value={v} onChange={(n) => on(n)} ariaLabel={label} />
      </div>
    </label>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-3.5 py-2.5">
        <span className="mono text-[11px] text-ink-4">{index}</span>
        <h3 className="m-0 text-[13px] font-semibold">{title}</h3>
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}
