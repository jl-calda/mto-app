'use client';

import { useMemo, useState } from 'react';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import type { AttrValue, InputType, Material, ParameterDef, PerTarget, Rule, SubAssembly, SubAssemblyMaterial } from '@/lib/types';

export type Usage = { model_id: string; model_name: string; system_name: string };

function perName(per?: PerTarget): string {
  if (!per) return 'unit';
  return 'name' in per ? per.name : per.kind;
}

/** Parameter-aware english for a sub-assembly material rule. */
function saEnglishify(rule: Rule, material?: Material): string {
  let qty: string;
  switch (rule.qty_kind) {
    case 'fixed': qty = `${rule.qty ?? 1}× (fixed)`; break;
    case 'per': qty = `${rule.qty ?? 1} per ${perName(rule.per)}`; break;
    case 'per_length': qty = `${rule.qty ?? 1} per metre`; break;
    case 'cut': qty = `${rule.cut_length ?? (rule.cut_length_param ? `{${rule.cut_length_param}}` : 0)}mm cut per ${perName(rule.per)}`; break;
    case 'algorithm': qty = `${rule.algorithm_config?.algorithm ?? 'algorithm'} output`; break;
    default: qty = '—';
  }
  return `${qty} of ${material?.sku ?? '—'}`;
}

function typeLabel(t: InputType): string {
  return t.kind === 'enum' ? `enum(${t.values.join('/')})` : t.kind;
}
function fmt(v: AttrValue | undefined): string {
  if (v == null) return '—';
  return Array.isArray(v) ? v.join(', ') : String(v);
}

const TABS = ['Materials', 'Parameters', 'SKU lookups'] as const;
type Tab = (typeof TABS)[number];

export function SubAssembliesBrowser({
  subs,
  materials,
  usedIn,
}: {
  subs: SubAssembly[];
  materials: Material[];
  usedIn: Record<string, Usage[]>;
}) {
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const categories = useMemo(() => ['all', ...new Set(subs.map((s) => s.category ?? 'Uncategorized'))], [subs]);

  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(subs[0]?.id ?? '');
  const [mode, setMode] = useState<'detail' | 'editor'>('detail');
  const [tab, setTab] = useState<Tab>('Materials');

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return subs.filter(
      (s) => (cat === 'all' || (s.category ?? 'Uncategorized') === cat) && (!n || s.name.toLowerCase().includes(n)),
    );
  }, [subs, cat, q]);

  const selected = subs.find((s) => s.id === selId) ?? rows[0] ?? subs[0];
  const active = subs.filter((s) => s.status === 'active').length;
  const usage = selected ? (usedIn[selected.id] ?? []) : [];

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">Sub-assemblies</h1>
          <div className="mt-1 text-[12px] text-ink-3">Parametric, reusable material bundles — inlined into models through the shared evaluator.</div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="active" v={active} />
          <Stat k="total" v={subs.length} />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start gap-4 py-4">
        {/* list */}
        <section className="overflow-hidden rounded-md border border-line bg-panel">
          <div className="flex flex-col gap-2 border-b border-line bg-panel-2 p-2.5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sub-assemblies…" className="input w-full" style={{ fontFamily: 'var(--font-sans)' }} />
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => {
                const on = cat === c;
                return (
                  <button key={c} onClick={() => setCat(c)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: on ? 'var(--selected)' : 'var(--bg-2)', color: on ? 'var(--accent)' : 'var(--ink-2)' }}>{c}</button>
                );
              })}
            </div>
          </div>
          {rows.map((s) => {
            const on = s.id === selected?.id;
            return (
              <button key={s.id} onClick={() => { setSelId(s.id); setMode('detail'); }} className="flex w-full items-center gap-2.5 border-b border-line px-3.5 py-2.5 text-left last:border-b-0" style={{ background: on ? 'var(--selected)' : undefined }}>
                <Visual visual={s.visual} name={s.name} size={26} rounded={4} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{s.name}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{s.parameters.length} params · {s.materials.length} materials · used in {(usedIn[s.id] ?? []).length}</div>
                </div>
                <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>v{s.current_version}</span>
              </button>
            );
          })}
          {rows.length === 0 && <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No sub-assemblies match.</div>}
        </section>

        {/* detail / editor */}
        {selected && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-md border border-line bg-panel p-3.5">
              <Visual visual={selected.visual} name={selected.name} size={36} rounded={6} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold">{selected.name}</div>
                {selected.description && <div className="text-[12px] text-ink-3">{selected.description}</div>}
              </div>
              {selected.category && <span className="tag">{selected.category}</span>}
              <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>v{selected.current_version}</span>
              <span className="tag">{selected.status}</span>
              <button className="btn sm" onClick={() => setMode((m) => (m === 'detail' ? 'editor' : 'detail'))}>
                {mode === 'detail' ? 'Open editor' : 'Close editor'}
              </button>
            </div>

            {mode === 'detail' ? (
              <DetailView sub={selected} matById={matById} usage={usage} />
            ) : (
              <EditorView sub={selected} matById={matById} tab={tab} setTab={setTab} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ── detail ──
function DetailView({ sub, matById, usage }: { sub: SubAssembly; matById: Map<string, Material>; usage: Usage[] }) {
  return (
    <>
      <Panel title={`Parameters · ${sub.parameters.length}`}>
        <ParameterTable params={sub.parameters} />
      </Panel>

      <Panel title={`Materials · ${sub.materials.length}`}>
        <div className="flex flex-col gap-2.5">
          {sub.materials.map((sam) => (
            <MaterialCard key={sam.id} sam={sam} material={matById.get(sam.material_id)} />
          ))}
          {sub.materials.length === 0 && <div className="py-2 text-[12px] text-ink-3">No materials.</div>}
        </div>
      </Panel>

      <Panel title="Used in">
        {usage.length ? (
          <div className="flex flex-col gap-1.5">
            {usage.map((u) => (
              <div key={u.model_id} className="flex items-center justify-between rounded border border-line px-3 py-2">
                <span className="text-[12px]">{u.model_name}</span>
                <span className="mono text-[10px] text-ink-3">{u.system_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12px] text-ink-3">Not referenced by any model yet.</div>
        )}
      </Panel>

      <Panel title="Version history">
        <div className="text-[12px] text-ink-3">Timeline · diff · changelog · pin policy — <span className="mono text-annotation">v2 (Brief 10)</span>.</div>
      </Panel>
    </>
  );
}

// ── editor (authoring; persistence lands in Brief 10) ──
function EditorView({ sub, matById, tab, setTab }: { sub: SubAssembly; matById: Map<string, Material>; tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-accent-line p-2.5" style={{ background: 'var(--selected)' }}>
        <span className="mono text-[11px] text-accent">draft editor</span>
        <span className="flex-1 text-[11px] text-ink-2">Edits are local — authoring mutations &amp; version history land in <span className="mono">Brief 10</span>.</span>
        <button className="btn primary sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Publish v{sub.current_version + 1}</button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <div className="flex border-b border-line bg-panel-2">
          {TABS.map((t) => {
            const on = t === tab;
            return (
              <button key={t} onClick={() => setTab(t)} className="px-3.5 py-2.5 text-[12px] font-medium" style={{ color: on ? 'var(--accent)' : 'var(--ink-2)', borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent' }}>{t}</button>
            );
          })}
        </div>
        <div className="p-3.5">
          {tab === 'Materials' && (
            <div className="flex flex-col gap-2.5">
              {sub.materials.map((sam) => <MaterialCard key={sam.id} sam={sam} material={matById.get(sam.material_id)} editable />)}
              <button className="btn sm self-start">+ Add material</button>
            </div>
          )}
          {tab === 'Parameters' && (
            <div className="flex flex-col gap-2.5">
              <ParameterTable params={sub.parameters} editable />
              <button className="btn sm self-start">+ Add parameter</button>
            </div>
          )}
          {tab === 'SKU lookups' && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] text-ink-2">Each material resolves its SKU directly. Banded / table lookups are authored here in <span className="mono text-annotation">Brief 10</span>.</div>
              <div className="overflow-hidden rounded border border-line">
                <div className="grid grid-cols-[minmax(0,1fr)_140px] border-b border-line bg-panel-2 px-3 py-1.5">
                  <div className="uc">material</div><div className="uc">sku</div>
                </div>
                {sub.materials.map((sam) => {
                  const m = matById.get(sam.material_id);
                  return (
                    <div key={sam.id} className="grid grid-cols-[minmax(0,1fr)_140px] border-b border-line px-3 py-1.5 last:border-b-0">
                      <div className="truncate text-[12px]">{m?.name ?? sam.material_id}</div>
                      <div className="mono text-[11px]">{m?.sku ?? '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── shared bits ──
function ParameterTable({ params, editable }: { params: ParameterDef[]; editable?: boolean }) {
  if (params.length === 0) return <div className="py-2 text-[12px] text-ink-3">No parameters.</div>;
  return (
    <div className="overflow-hidden rounded border border-line">
      <div className="grid grid-cols-[minmax(0,1fr)_110px_70px_80px] border-b border-line bg-panel-2 px-3 py-1.5">
        {['name', 'type', 'required', 'default'].map((h) => <div key={h} className="uc">{h}</div>)}
      </div>
      {params.map((p) => (
        <div key={p.name} className="grid grid-cols-[minmax(0,1fr)_110px_70px_80px] items-center border-b border-line px-3 py-2 last:border-b-0">
          <div className="min-w-0">
            <div className="mono truncate text-[12px] font-medium">{p.name}</div>
            {p.description && <div className="truncate text-[10px] text-ink-3">{p.description}</div>}
          </div>
          <div className="mono text-[11px] text-ink-2">{typeLabel(p.type)}</div>
          <div>{p.required ? <span className="tag" style={{ color: 'var(--annotation)' }}>required</span> : <span className="tag">optional</span>}</div>
          {editable ? (
            <input className="input w-full" defaultValue={fmt(p.default)} />
          ) : (
            <div className="mono text-[11px]">{fmt(p.default)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function MaterialCard({ sam, material, editable }: { sam: SubAssemblyMaterial; material?: Material; editable?: boolean }) {
  const aw = sam.rule.applies_when;
  const always = (aw.variants ?? []).length === 0 && Object.keys(aw.criteria ?? {}).length === 0;
  return (
    <div className="overflow-hidden rounded border border-line">
      <div className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-3 py-2">
        <Visual visual={material?.visual} name={material?.name ?? sam.material_id} size={24} rounded={3} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">{material?.name ?? sam.material_id}</div>
          <div className="mono truncate text-[10px] text-ink-3">{saEnglishify(sam.rule, material)}</div>
        </div>
        <span className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>{sam.rule.qty_kind}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-2.5">
        <Knob n="01" label="Applies when">
          {always ? <span className="mono text-[11px] text-ink-3">always</span> : (
            <div className="flex flex-wrap gap-1">
              {(aw.variants ?? []).map((v) => <span key={v} className="tag">variant: {v}</span>)}
              {Object.entries(aw.criteria ?? {}).map(([k, vals]) => <span key={k} className="tag">{k}: {vals.join('/')}</span>)}
            </div>
          )}
        </Knob>
        <Knob n="02" label="Quantity">
          <span className="mono text-[11px]">{saEnglishify(sam.rule, material)}</span>
        </Knob>
        <Knob n="03" label="SKU">
          <span className="mono text-[11px]">{material?.sku ?? '—'} <span className="text-ink-3">(direct)</span></span>
        </Knob>
      </div>
      {editable && (
        <div className="border-t border-line px-2.5 py-1.5">
          <span className="mono text-[10px] text-ink-4">three knobs editable in Brief 10</span>
        </div>
      )}
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

function Knob({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line p-2">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="mono text-[10px] text-ink-4">{n}</span>
        <span className="uc">{label}</span>
      </div>
      {children}
    </div>
  );
}
