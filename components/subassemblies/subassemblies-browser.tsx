'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import { VersionTimeline } from '@/components/version-history/VersionTimeline';
import { Field, NumberInput, Select, Toggle } from '@/components/system-wizard/parts';
import { TokenInput } from '@/components/inputs';
import { HelpButton } from '@/components/help/help-button';
import { publishSubAssemblyAction, saveSubAssemblyAction } from '@/app/sub-assemblies/actions';
import { blankParam, blankSam, coerceParamDefault } from '@/lib/subassembly-authoring';
import type { AttrValue, InputType, Material, ParameterDef, PerTarget, Rule, SubAssembly, SubAssemblyMaterial } from '@/lib/types';

const PARAM_KINDS: InputType['kind'][] = ['distance', 'number', 'integer', 'bool', 'enum'];
const QTY_KINDS_SA: Rule['qty_kind'][] = ['fixed', 'per', 'per_length', 'cut'];

function perToValue(per?: PerTarget): string {
  if (!per) return '';
  if (per.kind === 'parameter' || per.kind === 'property' || per.kind === 'derived') return `${per.kind}:${per.name}`;
  return per.kind;
}
function valueToPer(value: string): PerTarget | undefined {
  if (value === 'primitive_input') return { kind: 'primitive_input' };
  if (value === 'unit_of_length') return { kind: 'unit_of_length', length_source: 'chain' };
  const [kind, name] = value.split(':');
  if (kind === 'parameter' && name) return { kind: 'parameter', name };
  return undefined;
}

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
          <div className="flex items-center gap-1.5">
            <h1 className="m-0 text-[22px] font-semibold">Sub-assemblies</h1>
            <HelpButton topic="subassembly" />
          </div>
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
              <EditorView key={selected.id} sub={selected} materials={materials} matById={matById} tab={tab} setTab={setTab} />
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
        <VersionTimeline versions={sub.versions} current={sub.current_version} />
      </Panel>
    </>
  );
}

// ── editor (controlled draft; Save persists, Publish snapshots a version) ──
function EditorView({ sub, materials, matById, tab, setTab }: { sub: SubAssembly; materials: Material[]; matById: Map<string, Material>; tab: Tab; setTab: (t: Tab) => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SubAssembly>(sub);
  const [changelog, setChangelog] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [addId, setAddId] = useState(materials[0]?.id ?? '');

  const paramNames = draft.parameters.map((p) => p.name);

  const addMaterial = () => {
    if (!addId) return;
    const sam = blankSam(`sam-${crypto.randomUUID().slice(0, 8)}`, addId);
    setDraft((d) => ({ ...d, materials: [...d.materials, sam] }));
  };
  const removeMaterial = (id: string) => setDraft((d) => ({ ...d, materials: d.materials.filter((m) => m.id !== id) }));
  const updateRule = (id: string, rule: Rule) => setDraft((d) => ({ ...d, materials: d.materials.map((m) => (m.id === id ? { ...m, rule } : m)) }));

  const addParameter = () => setDraft((d) => ({ ...d, parameters: [...d.parameters, blankParam(`param_${d.parameters.length + 1}`)] }));
  const removeParameter = (idx: number) => setDraft((d) => ({ ...d, parameters: d.parameters.filter((_, i) => i !== idx) }));
  const updateParameter = (idx: number, patch: Partial<ParameterDef>) => setDraft((d) => ({ ...d, parameters: d.parameters.map((p, i) => (i === idx ? { ...p, ...patch } : p)) }));

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setStatus('saving'); setError(undefined);
    const res = await fn();
    if (res.ok) { setStatus('saved'); router.refresh(); }
    else { setStatus('error'); setError(res.error); }
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-accent-line p-2.5" style={{ background: 'var(--selected)' }}>
        <span className="mono text-[11px] text-accent">draft editor</span>
        <span className="flex-1 text-[11px] text-ink-2"><span className="mono">Save</span> persists the working draft; <span className="mono">Publish</span> snapshots it as v{draft.current_version + 1}.</span>
        {status === 'error' && <span className="mono text-[10px] text-err">{error ?? 'failed'}</span>}
        {status === 'saved' && <span className="mono text-[10px] text-ok">● saved</span>}
        <input className="input text" style={{ width: 140 }} placeholder="changelog…" value={changelog} onChange={(e) => setChangelog(e.target.value)} />
        <button className="btn sm" onClick={() => run(() => saveSubAssemblyAction(draft))} disabled={status === 'saving'}>Save draft</button>
        <button className="btn primary sm" onClick={() => run(() => publishSubAssemblyAction(draft, changelog))} disabled={status === 'saving'}>{`Publish v${draft.current_version + 1}`}</button>
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
              {draft.materials.map((sam) => (
                <MaterialCard key={sam.id} sam={sam} material={matById.get(sam.material_id)}
                  edit={{ paramNames, onChangeRule: (rule) => updateRule(sam.id, rule), onRemove: () => removeMaterial(sam.id) }} />
              ))}
              {draft.materials.length === 0 && <div className="py-2 text-[12px] text-ink-3">No materials yet.</div>}
              <div className="flex items-center gap-2">
                <select className="input text" style={{ maxWidth: 280 }} value={addId} onChange={(e) => setAddId(e.target.value)}>
                  {materials.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.sku}</option>)}
                </select>
                <button className="btn sm" onClick={addMaterial} disabled={!addId}>+ Add material</button>
              </div>
            </div>
          )}
          {tab === 'Parameters' && (
            <div className="flex flex-col gap-2.5">
              <ParameterTable params={draft.parameters} edit={{ onChange: updateParameter, onRemove: removeParameter }} />
              <button className="btn sm self-start" onClick={addParameter}>+ Add parameter</button>
            </div>
          )}
          {tab === 'SKU lookups' && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] text-ink-2">Each material resolves its SKU directly (shown below). Banded / table SKU lookups are a later enhancement.</div>
              <div className="overflow-hidden rounded border border-line">
                <div className="grid grid-cols-[minmax(0,1fr)_140px] border-b border-line bg-panel-2 px-3 py-1.5">
                  <div className="uc">material</div><div className="uc">sku</div>
                </div>
                {draft.materials.map((sam) => {
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
type ParamEdit = { onChange: (idx: number, patch: Partial<ParameterDef>) => void; onRemove: (idx: number) => void };
function ParameterTable({ params, edit }: { params: ParameterDef[]; edit?: ParamEdit }) {
  if (params.length === 0 && !edit) return <div className="py-2 text-[12px] text-ink-3">No parameters.</div>;
  const cols = edit ? 'grid grid-cols-[minmax(0,1fr)_110px_80px_90px_36px]' : 'grid grid-cols-[minmax(0,1fr)_110px_70px_80px]';
  return (
    <div className="overflow-hidden rounded border border-line">
      <div className={`${cols} border-b border-line bg-panel-2 px-3 py-1.5`}>
        {['name', 'type', 'required', 'default', ...(edit ? [''] : [])].map((h, i) => <div key={i} className="uc">{h}</div>)}
      </div>
      {params.map((p, idx) => (
        <div key={idx} className={`${cols} items-center border-b border-line px-3 py-2 last:border-b-0`}>
          {edit ? (
            <>
              <input className="input mono w-full" value={p.name} onChange={(e) => edit.onChange(idx, { name: e.target.value })} />
              <Select value={p.type.kind} options={PARAM_KINDS} onChange={(k) => edit.onChange(idx, { type: k === 'enum' ? { kind: 'enum', values: [] } : { kind: k } as InputType })} />
              <Toggle on={p.required} onChange={(v) => edit.onChange(idx, { required: v })} label={p.required ? 'req' : 'opt'} />
              <input className="input w-full" value={fmt(p.default)} onChange={(e) => edit.onChange(idx, { default: coerceParamDefault(e.target.value, p.type.kind) })} />
              <button className="btn sm danger" aria-label={`Remove parameter ${p.name}`} onClick={() => edit.onRemove(idx)}>×</button>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <div className="mono truncate text-[12px] font-medium">{p.name}</div>
                {p.description && <div className="truncate text-[10px] text-ink-3">{p.description}</div>}
              </div>
              <div className="mono text-[11px] text-ink-2">{typeLabel(p.type)}</div>
              <div>{p.required ? <span className="tag" style={{ color: 'var(--annotation)' }}>required</span> : <span className="tag">optional</span>}</div>
              <div className="mono text-[11px]">{fmt(p.default)}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

type MatEdit = { paramNames: string[]; onChangeRule: (rule: Rule) => void; onRemove: () => void };
function MaterialCard({ sam, material, edit }: { sam: SubAssemblyMaterial; material?: Material; edit?: MatEdit }) {
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
        {edit && <button className="btn sm danger" aria-label="Remove material" onClick={edit.onRemove}>×</button>}
      </div>
      {edit ? (
        <RuleEditor rule={sam.rule} paramNames={edit.paramNames} onChange={edit.onChangeRule} sku={material?.sku} />
      ) : (
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
      )}
    </div>
  );
}

// The three-knob rule editor for a sub-assembly material (no System context, so
// gating is authored as free-form names; per-targets are the sub-assembly's params).
function RuleEditor({ rule, paramNames, onChange, sku }: { rule: Rule; paramNames: string[]; onChange: (rule: Rule) => void; sku?: string }) {
  const patch = (p: Partial<Rule>) => onChange({ ...rule, ...p });
  const perOpts = [
    ...paramNames.map((n) => ({ value: `parameter:${n}`, label: `parameter · ${n}` })),
    { value: 'primitive_input', label: 'primitive input' },
    { value: 'unit_of_length', label: 'per metre (length)' },
  ];
  const setQtyKind = (kind: Rule['qty_kind']) => {
    const defPer = rule.per ?? valueToPer(perOpts[0]?.value ?? 'primitive_input');
    if (kind === 'per') patch({ qty_kind: 'per', qty: rule.qty ?? 1, per: defPer });
    else if (kind === 'cut') patch({ qty_kind: 'cut', cut_length: rule.cut_length ?? 100, per: defPer });
    else if (kind === 'fixed') patch({ qty_kind: 'fixed', qty: rule.qty ?? 1 });
    else patch({ qty_kind: 'per_length', qty: rule.qty ?? 1 });
  };
  return (
    <div className="grid grid-cols-3 gap-2 p-2.5">
      <Knob n="01" label="Applies when">
        <div className="flex flex-col gap-1.5">
          <Field label="variants" hint="names matched at inline-resolution time">
            <TokenInput value={rule.applies_when.variants ?? []}
              onChange={(vals) => patch({ applies_when: { ...rule.applies_when, variants: vals } })} />
          </Field>
          <RecordCsvEditor label="criteria" value={rule.applies_when.criteria ?? {}}
            onChange={(criteria) => patch({ applies_when: { ...rule.applies_when, criteria } })} />
          <RecordCsvEditor label="modifiers" value={rule.applies_when.modifiers ?? {}}
            onChange={(modifiers) => patch({ applies_when: { ...rule.applies_when, modifiers } })} />
        </div>
      </Knob>
      <Knob n="02" label="Quantity">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1">
            {QTY_KINDS_SA.map((k) => (
              <button key={k} onClick={() => setQtyKind(k)} className="rounded px-2 py-0.5 text-[11px]"
                style={{ background: rule.qty_kind === k ? 'var(--accent)' : 'var(--bg-2)', color: rule.qty_kind === k ? '#fff' : 'var(--ink-2)' }}>{k}</button>
            ))}
          </div>
          {(rule.qty_kind === 'fixed' || rule.qty_kind === 'per' || rule.qty_kind === 'per_length') && (
            <Field label="qty"><NumberInput value={rule.qty ?? 1} onChange={(v) => patch({ qty: v })} /></Field>
          )}
          {rule.qty_kind === 'cut' && (
            <>
              <Field label="cut length · mm"><NumberInput value={rule.cut_length ?? 0} onChange={(v) => patch({ cut_length: v })} /></Field>
              <Field label="…or from parameter">
                <Select value={rule.cut_length_param ?? ''} options={[{ value: '', label: '(fixed length)' }, ...paramNames.map((n) => ({ value: n, label: n }))]}
                  onChange={(v) => patch({ cut_length_param: v || undefined })} />
              </Field>
            </>
          )}
          {(rule.qty_kind === 'per' || rule.qty_kind === 'cut') && (
            <Field label="per"><Select value={perToValue(rule.per)} options={perOpts} onChange={(v) => patch({ per: valueToPer(v) })} /></Field>
          )}
        </div>
      </Knob>
      <Knob n="03" label="SKU">
        <span className="mono text-[11px]">{sku ?? '—'} <span className="text-ink-3">(direct)</span></span>
      </Knob>
    </div>
  );
}

// Editor for a Record<string,string[]> (criteria / modifiers gating): edit each
// key's csv values, remove a key, or add a new key+values row.
function RecordCsvEditor({ label, value, onChange }: { label: string; value: Record<string, string[]>; onChange: (v: Record<string, string[]>) => void }) {
  const [newKey, setNewKey] = useState('');
  const entries = Object.entries(value);
  const setVals = (k: string, vals: string[]) => {
    const next = { ...value };
    if (vals.length) next[k] = vals; else next[k] = [];
    onChange(next);
  };
  const removeKey = (k: string) => { const next = { ...value }; delete next[k]; onChange(next); };
  const addKey = () => { const k = newKey.trim(); if (!k || value[k]) return; onChange({ ...value, [k]: [] }); setNewKey(''); };
  return (
    <div className="flex flex-col gap-1">
      <span className="uc">{label}</span>
      {entries.map(([k, vals]) => (
        <div key={k} className="flex items-center gap-1">
          <span className="mono w-20 shrink-0 truncate text-[10px] text-ink-3">{k}</span>
          <div className="w-full"><TokenInput value={vals} onChange={(nv) => setVals(k, nv)} /></div>
          <button className="btn sm danger" aria-label={`Remove ${label} ${k}`} onClick={() => removeKey(k)}>×</button>
        </div>
      ))}
      <div className="flex items-center gap-1">
        <input className="input mono w-full" placeholder={`+ ${label} key`} value={newKey} onChange={(e) => setNewKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addKey(); }} />
        <button className="btn sm" onClick={addKey} disabled={!newKey.trim()}>add</button>
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
