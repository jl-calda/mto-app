'use client';

import { useMemo, useState } from 'react';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import { VariantEditor } from '@/components/variants/variant-editor';
import { VersionTimeline } from '@/components/version-history/VersionTimeline';
import type { AttrValue, Variant } from '@/lib/types';

const STATUSES = ['all', 'active', 'deprecated', 'archived'] as const;

function fmt(v: AttrValue): string {
  return Array.isArray(v) ? v.join(', ') : String(v);
}

function blankVariant(): Variant {
  return {
    id: `var-${crypto.randomUUID().slice(0, 8)}`, name: 'New variant', common_attributes: {},
    current_version: 1, status: 'active', used_in_systems: [],
    versions: [{ version: 1, published_at: 0, changelog: 'Initial', common_attributes: {} }],
  };
}

export function VariantsBrowser({ variants }: { variants: Variant[] }) {
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(variants[0]?.id ?? '');
  const [editing, setEditing] = useState<{ variant: Variant; isNew: boolean } | null>(null);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return variants.filter(
      (v) => (status === 'all' || v.status === status) && (!n || v.name.toLowerCase().includes(n)),
    );
  }, [variants, status, q]);

  const selected = variants.find((v) => v.id === selId) ?? rows[0] ?? variants[0];
  const active = variants.filter((v) => v.status === 'active').length;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">Variants</h1>
          <div className="mt-1 text-[12px] text-ink-3">Global design-family alternatives, snapshotted into take-offs at use.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border-l border-line">
            <Stat k="active" v={active} />
            <Stat k="total" v={variants.length} />
          </div>
          <button className="btn primary sm" onClick={() => setEditing({ variant: blankVariant(), isNew: true })}>New variant</button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start gap-4 py-4">
        {/* list */}
        <section className="overflow-hidden rounded-md border border-line bg-panel">
          <div className="flex flex-col gap-2 border-b border-line bg-panel-2 p-2.5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search variants…" className="input w-full" style={{ fontFamily: 'var(--font-sans)' }} />
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => {
                const on = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: on ? 'var(--selected)' : 'var(--bg-2)', color: on ? 'var(--accent)' : 'var(--ink-2)' }}>{s}</button>
                );
              })}
            </div>
          </div>
          {rows.map((v) => {
            const on = v.id === selected?.id;
            return (
              <button key={v.id} onClick={() => setSelId(v.id)} className="flex w-full items-center gap-2.5 border-b border-line px-3.5 py-2.5 text-left last:border-b-0" style={{ background: on ? 'var(--selected)' : undefined }}>
                <Visual visual={v.visual} name={v.name} size={24} rounded={3} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{v.name}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{Object.keys(v.common_attributes).length} attrs · used in {v.used_in_systems.length}</div>
                </div>
                <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>v{v.current_version}</span>
              </button>
            );
          })}
          {rows.length === 0 && <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No variants match.</div>}
        </section>

        {/* detail / editor */}
        {editing ? (
          <VariantEditor key={editing.variant.id} variant={editing.variant} isNew={editing.isNew} onClose={() => setEditing(null)} />
        ) : selected ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-md border border-line bg-panel p-3.5">
              <Visual visual={selected.visual} name={selected.name} size={36} rounded={6} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold">{selected.name}</div>
                {selected.description && <div className="text-[12px] text-ink-3">{selected.description}</div>}
              </div>
              <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>v{selected.current_version}</span>
              <span className="tag">{selected.status}</span>
              <button className="btn sm" onClick={() => setEditing({ variant: selected, isNew: false })}>Edit</button>
            </div>

            <Panel title="Common attributes">
              <div className="flex flex-col">
                {Object.entries(selected.common_attributes).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-line py-1.5 last:border-b-0">
                    <span className="uc">{k}</span>
                    <span className="mono text-[12px]">{fmt(v)}</span>
                  </div>
                ))}
                {Object.keys(selected.common_attributes).length === 0 && <div className="py-2 text-[12px] text-ink-3">No attributes.</div>}
              </div>
              <div className="mt-2.5 rounded p-2.5 text-[11px] text-ink-2" style={{ background: 'var(--bg-2)' }}>
                Snapshot semantics: take-offs freeze a version at use — library edits never rewrite saved take-offs.
              </div>
            </Panel>

            <Panel title="Used in">
              {selected.used_in_systems.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.used_in_systems.map((s) => <span key={s} className="tag">{s}</span>)}
                </div>
              ) : (
                <div className="text-[12px] text-ink-3">Not referenced by any system yet.</div>
              )}
            </Panel>

            <Panel title="Version history">
              <VersionTimeline versions={selected.versions} current={selected.current_version} />
              <div className="mt-2.5 rounded p-2.5 text-[11px] text-ink-2" style={{ background: 'var(--bg-2)' }}>
                Pin policy: publishing a new version never rewrites saved take-offs — they stay on the version they snapshotted (Edit → Publish to cut a new version).
              </div>
            </Panel>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="border-b border-line bg-panel-2 px-3.5 py-2.5">
        <h3 className="m-0 text-[13px] font-semibold">{title}</h3>
      </header>
      <div className="p-3.5">{children}</div>
    </div>
  );
}
