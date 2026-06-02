'use client';

// Visual cutting layout (Brief 10 item 32): each stock bar with its cut pieces
// (placed by position_in_stock), kerf gaps, and the trailing offcut.

import type { CuttingPlan } from '@/lib/types';

export function CuttingDiagram({ plan }: { plan: CuttingPlan }) {
  const W = 220;
  const H = 14;
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {plan.per_stock.map((stock, si) => {
        const scale = W / (stock.stock_length || 1);
        const offcutX = (stock.stock_length - stock.offcut) * scale;
        return (
          <div key={si} className="flex items-center gap-1.5">
            <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }} role="img" aria-label={`stock ${si + 1}`}>
              <rect x={0} y={0} width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" />
              {stock.offcut > 0 && <rect x={offcutX} y={0} width={Math.max(0, W - offcutX)} height={H} fill="var(--panel-2)" />}
              {stock.cuts.map((cut, ci) => {
                const [a, b] = cut.position_in_stock;
                return <rect key={ci} x={a * scale} y={1} width={Math.max(1, (b - a) * scale - 0.5)} height={H - 2} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={0.75} />;
              })}
            </svg>
            <span className="mono text-[9px] text-ink-3">{stock.cuts.length}× · offcut {stock.offcut.toLocaleString()}mm</span>
          </div>
        );
      })}
    </div>
  );
}
