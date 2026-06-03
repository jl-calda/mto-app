'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import { Cell } from '@/components/chrome/responsive-cell';
import { setInventoryStatusAction } from '@/app/inventory/actions';
import type { InventoryItem, Material } from '@/lib/types';

const STATUSES = ['all', 'available', 'reserved', 'consumed'] as const;
const ORIGINS = ['all', 'purchased', 'offcut', 'manual'] as const;

// Desktop (lg+): 7-track grid. Mobile: each row is a stacked card.
const COLS = 'lg:grid lg:grid-cols-[28px_minmax(0,1fr)_90px_70px_110px_90px_minmax(0,140px)] lg:items-center lg:gap-2.5';

const STATUS_TONE: Record<string, { c: string; b: string }> = {
  available: { c: 'var(--ok)', b: 'var(--ok-soft)' },
  reserved: { c: 'var(--warn)', b: 'var(--warn-soft)' },
  consumed: { c: 'var(--ink-3)', b: 'var(--bg-2)' },
};

export function InventoryBrowser({ inventory, materials }: { inventory: InventoryItem[]; materials: Material[] }) {
  const router = useRouter();
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const [status, setStatus] = useState<string>('all');
  const [origin, setOrigin] = useState<string>('all');
  const [busy, setBusy] = useState<string>();

  const rows = useMemo(
    () => inventory.filter((i) => (status === 'all' || i.status === status) && (origin === 'all' || i.origin.kind === origin)),
    [inventory, status, origin],
  );
  const offcuts = inventory.filter((i) => i.origin.kind === 'offcut' && i.status === 'available');
  const available = inventory.filter((i) => i.status === 'available').length;

  async function transition(item: InventoryItem, to: InventoryItem['status']) {
    setBusy(item.id);
    await setInventoryStatusAction(item, to);
    setBusy(undefined);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">Inventory</h1>
          <div className="mt-1 text-[12px] text-ink-3">Cross-project stock &amp; offcut pool with the reservation lifecycle.</div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="items" v={inventory.length} />
          <Stat k="available" v={available} />
          <Stat k="offcuts" v={offcuts.length} highlight={offcuts.length ? undefined : undefined} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5">
        <span className="uc">status</span>
        {STATUSES.map((s) => <button key={s} onClick={() => setStatus(s)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: status === s ? 'var(--selected)' : 'var(--bg-2)', color: status === s ? 'var(--accent)' : 'var(--ink-2)' }}>{s}</button>)}
        <span className="mx-1 text-ink-4">·</span>
        <span className="uc">origin</span>
        {ORIGINS.map((o) => <button key={o} onClick={() => setOrigin(o)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: origin === o ? 'var(--selected)' : 'var(--bg-2)', color: origin === o ? 'var(--accent)' : 'var(--ink-2)' }}>{o}</button>)}
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <div className={`${COLS} hidden border-b border-line bg-panel-2 px-3.5 py-2`}>
          {['', 'material', 'length', 'qty', 'origin', 'status', ''].map((h, i) => <div key={i} className="uc">{h}</div>)}
        </div>
        {rows.map((it) => {
          const mat = matById.get(it.material_id);
          const tone = STATUS_TONE[it.status];
          return (
            <div key={it.id} className={`${COLS} border-b border-line px-3.5 py-3 last:border-b-0 lg:py-2`}>
              <div className="flex items-center gap-3 lg:contents">
                <Visual visual={mat?.visual} name={mat?.name ?? it.material_id} size={24} rounded={3} />
                <div className="min-w-0 flex-1 lg:flex-none">
                  <div className="truncate text-[12px]">{mat?.name ?? it.material_id}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{mat?.sku ?? it.material_id}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 lg:contents lg:mt-0">
                <Cell label="length" className="mono text-[12px]">{it.length ? `${it.length.toLocaleString()}mm` : '—'}</Cell>
                <Cell label="qty" className="mono text-[12px]">{it.quantity ?? 1}</Cell>
                <Cell label="origin">
                  <span className="tag" style={{ color: it.origin.kind === 'offcut' ? 'var(--annotation)' : 'var(--ink-2)' }}>{it.origin.kind}</span>
                </Cell>
                <Cell label="status"><span className="tag" style={{ color: tone.c, background: tone.b }}>{it.status}</span></Cell>
              </div>
              <div className="mt-2 flex flex-wrap justify-end gap-1 lg:mt-0">
                {it.status === 'available' && <button className="btn sm" disabled={busy === it.id} onClick={() => transition(it, 'reserved')}>Reserve</button>}
                {it.status === 'reserved' && <><button className="btn sm" disabled={busy === it.id} onClick={() => transition(it, 'available')}>Release</button><button className="btn sm" disabled={busy === it.id} onClick={() => transition(it, 'consumed')}>Consume</button></>}
                {it.status === 'consumed' && <span className="mono text-[10px] text-ink-4">consumed</span>}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No inventory matches.</div>}
      </div>

      <div className="mt-3 rounded p-2.5 text-[11px] text-ink-2" style={{ background: 'var(--bg-2)' }}>
        Available offcuts are consulted by <span className="mono">cut_from_stock</span> before new stock is bought (see the ladder L-bar). True no-double-claim reservations need DB row-locking — <span className="mono text-annotation">Brief 12 · RLS</span>.
      </div>
    </div>
  );
}
