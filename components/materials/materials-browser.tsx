'use client';

import { useMemo, useState } from 'react';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import type { Material } from '@/lib/types';

function counts(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

export function MaterialsBrowser({ materials }: { materials: Material[] }) {
  const [group, setGroup] = useState<string>('all');
  const [vendor, setVendor] = useState<string>('all');
  const [q, setQ] = useState('');

  const groups = useMemo(() => counts(materials.map((m) => m.category ?? 'Uncategorised')), [materials]);
  const vendors = useMemo(() => counts(materials.map((m) => m.vendor)), [materials]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return materials.filter((m) => {
      if (group !== 'all' && (m.category ?? 'Uncategorised') !== group) return false;
      if (vendor !== 'all' && m.vendor !== vendor) return false;
      if (needle && !`${m.sku} ${m.name} ${m.vendor}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [materials, group, vendor, q]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      {/* header */}
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">Materials</h1>
          <div className="mt-1 text-[12px] text-ink-3">Global SKU catalogue — referenced by model rules and SKU lookups.</div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="SKUs" v={materials.length} />
          <Stat k="vendors" v={vendors.size} />
          <Stat k="groups" v={groups.size} />
        </div>
      </div>

      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4 py-4 items-start">
        {/* sidebar filters */}
        <aside className="flex flex-col gap-4">
          <FilterGroup label="Group" active={group} onPick={setGroup} entries={groups} total={materials.length} />
          <FilterGroup label="Vendor" active={vendor} onPick={setVendor} entries={vendors} total={materials.length} />
        </aside>

        {/* main */}
        <section className="min-w-0">
          <div className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKU, name, vendor…"
              className="input w-full"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <div className="overflow-hidden rounded-md border border-line bg-panel">
            <div className="grid grid-cols-[24px_minmax(0,1fr)_120px_110px_56px_70px] items-center gap-2.5 border-b border-line bg-panel-2 px-3.5 py-2">
              {['', 'sku · name', 'group', 'vendor', 'unit', 'cuttable'].map((h, i) => (
                <div key={i} className="uc">{h}</div>
              ))}
            </div>
            {rows.map((m) => (
              <div key={m.id} className="grid grid-cols-[24px_minmax(0,1fr)_120px_110px_56px_70px] items-center gap-2.5 border-b border-line px-3.5 py-2 last:border-b-0 hover:bg-panel-hover">
                <Visual visual={m.visual} name={m.name} size={24} rounded={3} />
                <div className="min-w-0">
                  <div className="truncate text-[12px]">{m.name}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{m.sku}</div>
                </div>
                <div className="truncate text-[12px] text-ink-2">{m.category ?? '—'}</div>
                <div className="truncate text-[12px] text-ink-2">{m.vendor}</div>
                <div className="mono text-[11px] text-ink-3">{m.unit}</div>
                <div>
                  {m.is_cuttable ? (
                    <span className="tag" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>
                      {m.stock_options?.length ? m.stock_options.join('/') : 'yes'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-4">—</span>
                  )}
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No materials match these filters.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  active,
  onPick,
  entries,
  total,
}: {
  label: string;
  active: string;
  onPick: (v: string) => void;
  entries: Map<string, number>;
  total: number;
}) {
  const items: [string, number][] = [['all', total], ...[...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]))];
  return (
    <div>
      <div className="uc mb-1.5 px-1">{label}</div>
      <div className="flex flex-col gap-0.5">
        {items.map(([name, n]) => {
          const on = active === name;
          return (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="flex items-center justify-between rounded px-2 py-1 text-left text-[12px]"
              style={{
                background: on ? 'var(--selected)' : 'transparent',
                color: on ? 'var(--accent)' : 'var(--ink-2)',
                fontWeight: on ? 500 : 400,
              }}
            >
              <span className="truncate capitalize">{name}</span>
              <span className="mono text-[11px] text-ink-4">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
