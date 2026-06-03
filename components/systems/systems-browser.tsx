'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Visual } from '@/components/visual';
import { Stat, PrimitiveBadge } from '@/components/chrome';
import { DeleteButton } from '@/components/delete-button';
import { HelpButton } from '@/components/help/help-button';
import { deleteSystemAction } from '@/app/systems/actions';
import type { PrimitiveKind, System } from '@/lib/types';

const COLS = 'grid grid-cols-[28px_minmax(0,1fr)_110px_56px_56px_56px_40px] items-center gap-2.5';
const BADGEABLE: PrimitiveKind[] = ['length', 'height', 'count'];

export function SystemsBrowser({ systems }: { systems: System[] }) {
  const [prim, setPrim] = useState<string>('all');
  const [q, setQ] = useState('');

  const prims = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of systems) m.set(s.primitive.kind, (m.get(s.primitive.kind) ?? 0) + 1);
    return m;
  }, [systems]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return systems.filter(
      (s) => (prim === 'all' || s.primitive.kind === prim) && (!n || s.name.toLowerCase().includes(n)),
    );
  }, [systems, prim, q]);

  const models = systems.reduce((s, x) => s + x.models.length, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="m-0 text-[22px] font-semibold">Systems</h1>
            <HelpButton topic="system" />
          </div>
          <div className="mt-1 text-[12px] text-ink-3">Reusable definitions of what to measure and which design choices to offer.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border-l border-line">
            <Stat k="systems" v={systems.length} />
            <Stat k="models" v={models} />
          </div>
          <Link href="/systems/new" className="btn primary sm">New system</Link>
        </div>
      </div>

      <div className="py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['all', ...prims.keys()] as string[]).map((k) => {
            const on = prim === k;
            return (
              <button
                key={k}
                onClick={() => setPrim(k)}
                className="rounded px-2.5 py-1 text-[12px]"
                style={{
                  background: on ? 'var(--selected)' : 'var(--bg-2)',
                  color: on ? 'var(--accent)' : 'var(--ink-2)',
                  fontWeight: on ? 500 : 400,
                }}
              >
                {k} {k !== 'all' && <span className="mono text-ink-4">{prims.get(k)}</span>}
              </button>
            );
          })}
          <span className="flex-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search systems…"
            className="input w-[240px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          />
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-panel">
          <div className={`${COLS} border-b border-line bg-panel-2 px-3.5 py-2`}>
            {['', 'system', 'primitive', 'var', 'prop', 'mod', ''].map((h, i) => (
              <div key={i} className="uc">{h}</div>
            ))}
          </div>
          {rows.map((s) => {
            const k = s.primitive.kind;
            return (
              <div
                key={s.id}
                className={`${COLS} border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-panel-hover`}
              >
                <Link href={`/systems/${s.id}`} style={{ display: 'contents', textDecoration: 'none', color: 'inherit' }}>
                  <Visual visual={s.visual} name={s.name} size={26} rounded={4} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{s.name}</div>
                    <div className="mono truncate text-[10px] text-ink-3">{s.models.length} model{s.models.length === 1 ? '' : 's'}</div>
                  </div>
                  <div>
                    {BADGEABLE.includes(k) ? (
                      <PrimitiveBadge kind={k as 'length' | 'height' | 'count'} mini />
                    ) : (
                      <span className="tag">{k}</span>
                    )}
                  </div>
                  <div className="mono text-[12px]">{s.variants.rows.length}</div>
                  <div className="mono text-[12px]">{s.properties.length}</div>
                  <div className="mono text-[12px]">{s.modifiers.length}</div>
                </Link>
                <DeleteButton
                  confirmMessage={`Delete system "${s.name}" and its ${s.models.length} model(s)? This cannot be undone.`}
                  onDelete={() => deleteSystemAction(s.id)}
                />
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No systems match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
