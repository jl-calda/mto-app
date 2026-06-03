'use client';

import { useMemo, useState } from 'react';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import { Cell } from '@/components/chrome/responsive-cell';
import { MaterialEditor } from '@/components/materials/material-editor';
import type { Material } from '@/lib/types';

// Desktop (lg+): 6-track grid. Mobile: each row is a stacked card.
const COLS = 'lg:grid lg:grid-cols-[24px_minmax(0,1fr)_120px_110px_56px_70px] lg:items-center lg:gap-2.5';

function counts(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

function blankMaterial(): Material {
  return { id: `mat-${crypto.randomUUID().slice(0, 8)}`, sku: '', name: '', vendor: '', unit: 'ea', category: '', attributes: {}, is_cuttable: false };
}

export function MaterialsBrowser({ materials }: { materials: Material[] }) {
  const [group, setGroup] = useState<string>('all');
  const [vendor, setVendor] = useState<string>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ material: Material; isNew: boolean } | null>(null);

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
        <div className="flex items-center gap-3">
          <div className="flex border-l border-line">
            <Stat k="SKUs" v={materials.length} />
            <Stat k="vendors" v={vendors.size} />
            <Stat k="groups" v={groups.size} />
          </div>
          <button className="btn primary sm" onClick={() => setEditing({ material: blankMaterial(), isNew: true })}>New material</button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 py-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* sidebar filters — a wrapped chip-rail on mobile, a column on desktop */}
        <aside className="flex flex-row flex-wrap gap-x-6 gap-y-3 lg:flex-col lg:gap-4">
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

          <div className={editing ? 'grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]' : ''}>
            <div className="min-w-0 overflow-hidden rounded-md border border-line bg-panel">
              <div className={`${COLS} hidden border-b border-line bg-panel-2 px-3.5 py-2`}>
                {['', 'sku · name', 'group', 'vendor', 'unit', 'cuttable'].map((h, i) => (
                  <div key={i} className="uc">{h}</div>
                ))}
              </div>
              {rows.map((m) => {
                const on = editing && !editing.isNew && editing.material.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setEditing({ material: m, isNew: false })}
                    className={`${COLS} w-full border-b border-line px-3.5 py-3 text-left last:border-b-0 hover:bg-panel-hover lg:py-2`}
                    style={{ background: on ? 'var(--selected)' : undefined }}
                  >
                    <div className="flex items-center gap-3 lg:contents">
                      <Visual visual={m.visual} name={m.name} size={24} rounded={3} />
                      <div className="min-w-0 flex-1 lg:flex-none">
                        <div className="truncate text-[12px]">{m.name}</div>
                        <div className="mono truncate text-[10px] text-ink-3">{m.sku}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 lg:contents lg:mt-0">
                      <Cell label="group" className="truncate text-[12px] text-ink-2">{m.category ?? '—'}</Cell>
                      <Cell label="vendor" className="truncate text-[12px] text-ink-2">{m.vendor}</Cell>
                      <Cell label="unit" className="mono text-[11px] text-ink-3">{m.unit}</Cell>
                      <Cell label="cuttable">
                        {m.is_cuttable ? (
                          <span className="tag" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>
                            {m.stock_options?.length ? m.stock_options.join('/') : 'yes'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-4">—</span>
                        )}
                      </Cell>
                    </div>
                  </button>
                );
              })}
              {rows.length === 0 && (
                <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No materials match these filters.</div>
              )}
            </div>

            {editing && (
              <MaterialEditor key={editing.material.id} material={editing.material} isNew={editing.isNew} onClose={() => setEditing(null)} />
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
