'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deriveRuleContext, evaluateRuleAgainstSample } from '@/lib/engine';
import { saveModelAction } from '@/app/models/actions';
import { Visual } from '@/components/visual';
import { VisualEditor } from '@/components/visual-editor';
import { Field, NumberInput, Select, TextInput } from '@/components/system-wizard/parts';
import type { AlgorithmName, Material, Model, ModelMaterial, PerTarget, Rule, System, SystemVariantRef } from '@/lib/types';

function rowLabel(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}

const QTY_KINDS: Rule['qty_kind'][] = ['fixed', 'per', 'per_length', 'cut', 'algorithm'];
const ALGOS: AlgorithmName[] = ['pack_stock', 'place_supports', 'cut_from_stock', 'pack_stock_2d'];

export function englishify(rule: Rule, material?: Material): string {
  let qty: string;
  switch (rule.qty_kind) {
    case 'fixed': qty = `${rule.qty ?? 1}× (fixed)`; break;
    case 'per': qty = `${rule.qty ?? 1} per ${rule.per && 'name' in rule.per ? rule.per.name : rule.per?.kind ?? 'unit'}`; break;
    case 'per_length': qty = `${rule.qty ?? 1} per metre`; break;
    case 'cut': qty = `${rule.cut_length ?? 0}mm cut per ${rule.per && 'name' in rule.per ? rule.per.name : 'occurrence'}`; break;
    case 'algorithm': qty = `${rule.algorithm_config?.algorithm ?? 'algorithm'} output`; break;
    default: qty = '—';
  }
  const vs = rule.applies_when.variants ?? [];
  const cs = Object.entries(rule.applies_when.criteria ?? {}).filter(([, v]) => v?.length);
  const when =
    vs.length || cs.length
      ? ` — when ${[vs.length ? `variant ∈ {${vs.join(', ')}}` : '', ...cs.map(([k, v]) => `${k} ∈ {${v.join(', ')}}`)].filter(Boolean).join(' & ')}`
      : ' — always';
  return `${qty} of ${material?.sku ?? '—'}${when}`;
}

// X-picker options — the per-target X constrained to the system context.
type XOpt = { value: string; label: string; per: PerTarget };
function perToValue(per?: PerTarget): string {
  if (!per) return '';
  switch (per.kind) {
    case 'property': return `property:${per.name}`;
    case 'derived': return `derived:${per.name}`;
    case 'primitive_input': return 'primitive_input';
    case 'unit_of_length': return 'unit_of_length';
    case 'algorithm_output': return `algorithm_output:${per.algorithm}.${per.field}`;
    case 'parameter': return `parameter:${per.name}`;
  }
}

function firstVariant(system: System): string {
  const r = system.variants.rows[0];
  return r ? rowLabel(r) : '';
}
function defaultPrimitive(system: System): number {
  return system.primitive.kind === 'height' ? 9450 : system.primitive.kind === 'count' ? 12 : 24000;
}

export function ModelEditor({ system, model: initialModel, materials, isNew = false }: { system: System; model: Model; materials: Material[]; isNew?: boolean }) {
  const router = useRouter();
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const ctx = useMemo(() => deriveRuleContext(system), [system]);
  const xOptions = useMemo<XOpt[]>(() => [
    ...ctx.properties.map((p): XOpt => ({ value: `property:${p.name}`, label: `property · ${p.name}`, per: { kind: 'property', name: p.name } })),
    ...ctx.derived.map((d): XOpt => ({ value: `derived:${d}`, label: `derived · ${d}`, per: { kind: 'derived', name: d } })),
    { value: 'primitive_input', label: 'primitive input', per: { kind: 'primitive_input' } },
    { value: 'unit_of_length', label: 'per metre (length)', per: { kind: 'unit_of_length', length_source: 'chain' } },
  ], [ctx]);

  const [model, setModel] = useState<Model>(initialModel);
  const [selId, setSelId] = useState(initialModel.materials[0]?.id ?? '');
  const selIdx = model.materials.findIndex((mm) => mm.id === selId);
  const selected = model.materials[selIdx] ?? model.materials[0];

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [addId, setAddId] = useState(materials[0]?.id ?? '');

  // sample inputs for the live-eval pane
  const [variant, setVariant] = useState(firstVariant(system));
  const [criteria, setCriteria] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const c of system.criteria) o[c.library_id] = c.default_value != null ? String(c.default_value) : '';
    return o;
  });
  const [primitive, setPrimitive] = useState(defaultPrimitive(system));
  const [props, setProps] = useState<Record<string, Record<string, number>>>(() => {
    const o: Record<string, Record<string, number>> = {};
    for (const p of system.properties) {
      o[p.name] = {};
      for (const inp of p.inputs) if (typeof inp.default === 'number') o[p.name][inp.name] = inp.default;
    }
    return o;
  });

  const sampleMaterial = selected ? matById.get(selected.material_id) : undefined;
  const result = useMemo(
    () => (selected ? evaluateRuleAgainstSample(selected.rule, system, { variant, criteria, properties: props, primitive: { value: primitive } }, sampleMaterial) : null),
    [selected, system, variant, criteria, props, primitive, sampleMaterial],
  );

  // ── rule mutations ──
  const updateRule = (patch: Partial<Rule>) =>
    setModel((m) => ({ ...m, materials: m.materials.map((mm, i) => (i === selIdx ? { ...mm, rule: { ...mm.rule, ...patch } } : mm)) }));

  const setQtyKind = (kind: Rule['qty_kind']) => {
    const r = selected.rule;
    if (kind === 'per') updateRule({ qty_kind: 'per', qty: r.qty ?? 1, per: r.per ?? xOptions[0]?.per });
    else if (kind === 'cut') updateRule({ qty_kind: 'cut', cut_length: r.cut_length ?? 100, per: r.per ?? xOptions[0]?.per });
    else if (kind === 'algorithm') updateRule({ qty_kind: 'algorithm', algorithm_config: r.algorithm_config ?? { algorithm: 'pack_stock', inputs: {} } });
    else if (kind === 'fixed') updateRule({ qty_kind: 'fixed', qty: r.qty ?? 1 });
    else updateRule({ qty_kind: 'per_length', qty: r.qty ?? 1 });
  };
  const setPer = (value: string) => updateRule({ per: xOptions.find((o) => o.value === value)?.per });
  const toggleVariant = (name: string) => {
    const vs = selected.rule.applies_when.variants ?? [];
    updateRule({ applies_when: { ...selected.rule.applies_when, variants: vs.includes(name) ? vs.filter((v) => v !== name) : [...vs, name] } });
  };
  const setCriterion = (libId: string, csv: string) => {
    const vals = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const crit = { ...selected.rule.applies_when.criteria };
    if (vals.length) crit[libId] = vals; else delete crit[libId];
    updateRule({ applies_when: { ...selected.rule.applies_when, criteria: crit } });
  };

  const addMaterial = () => {
    if (!addId) return;
    const mm: ModelMaterial = { id: `mm-${crypto.randomUUID().slice(0, 8)}`, material_id: addId, rule: { qty_kind: 'fixed', qty: 1, applies_when: { variants: [], criteria: {} } } };
    setModel((m) => ({ ...m, materials: [...m.materials, mm] }));
    setSelId(mm.id);
  };
  const removeMaterial = (id: string) => setModel((m) => ({ ...m, materials: m.materials.filter((mm) => mm.id !== id) }));

  async function save() {
    setStatus('saving');
    setError(undefined);
    const res = await saveModelAction(model);
    if (res.ok) {
      setStatus('saved');
      if (isNew) router.push(`/models/${model.id}`);
      else router.refresh();
    } else { setStatus('error'); setError(res.error); }
  }

  const r = selected?.rule;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between gap-3 border-b border-line pb-3.5">
        <div className="flex items-start gap-3">
          <div className="w-[300px]"><VisualEditor value={model.visual} name={model.name} onChange={(v) => setModel((m) => ({ ...m, visual: v }))} /></div>
          <div>
            <input className="input text text-[18px] font-semibold" style={{ height: 'auto', padding: '2px 8px' }} value={model.name} onChange={(e) => setModel((m) => ({ ...m, name: e.target.value }))} />
            <div className="mono mt-1 text-[11px] text-ink-3">{system.name} · {model.status} · {model.materials.length} materials</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'error' && <span className="mono text-[10px] text-err">{error ?? 'save failed'}</span>}
          {status === 'saved' && <span className="mono text-[10px] text-ok">● saved</span>}
          <Select value={model.status} options={['draft', 'published', 'deprecated'] as const} onChange={(v) => setModel((m) => ({ ...m, status: v }))} />
          <button className="btn primary sm" onClick={save} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_460px] items-start gap-4 py-4">
        {/* material list */}
        <section className="overflow-hidden rounded-md border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
            <h3 className="m-0 text-[13px] font-semibold">Materials</h3>
            <div className="flex items-center gap-1.5">
              <select className="input text" style={{ fontSize: 12, maxWidth: 180 }} value={addId} onChange={(e) => setAddId(e.target.value)}>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button className="btn primary sm" onClick={addMaterial}>Add</button>
            </div>
          </header>
          {model.materials.map((mm) => {
            const mat = matById.get(mm.material_id);
            const on = mm.id === selected?.id;
            return (
              <div key={mm.id} className="flex w-full items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0" style={{ background: on ? 'var(--selected)' : undefined }}>
                <button onClick={() => setSelId(mm.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Visual visual={mat?.visual} name={mat?.name ?? mm.material_id} size={24} rounded={3} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{mat?.name ?? mm.material_id}</div>
                    <div className="mono truncate text-[10px] text-ink-3">{englishify(mm.rule, mat)}</div>
                  </div>
                </button>
                <span className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>{mm.rule.qty_kind}</span>
                <button className="btn sm danger" onClick={() => removeMaterial(mm.id)}>×</button>
              </div>
            );
          })}
          {model.materials.length === 0 && <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No materials. Add one above.</div>}
        </section>

        {/* rule editor + live eval */}
        <aside className="sticky top-[60px] flex flex-col gap-3">
          {selected && r && (
            <>
              <div className="overflow-hidden rounded-md border border-line bg-panel">
                <header className="border-b border-line bg-panel-2 px-3.5 py-2.5">
                  <h3 className="m-0 text-[13px] font-semibold">Rule · {sampleMaterial?.name ?? selected.material_id}</h3>
                </header>
                <div className="flex flex-col gap-2.5 p-3.5">
                  {/* Knob 01 — applies when */}
                  <Knob n="01" label="Applies when">
                    <div className="uc mb-1">variants {(r.applies_when.variants ?? []).length === 0 && <span className="text-ink-4">· all</span>}</div>
                    <div className="flex flex-wrap gap-1">
                      {system.variants.rows.map((row) => {
                        const name = rowLabel(row);
                        const on = (r.applies_when.variants ?? []).includes(name);
                        return (
                          <button key={name} onClick={() => toggleVariant(name)} className="tag" style={{ cursor: 'pointer', color: on ? 'var(--accent)' : 'var(--ink-3)', background: on ? 'var(--accent-soft)' : 'var(--bg-2)' }}>{name}</button>
                        );
                      })}
                    </div>
                    {system.criteria.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {system.criteria.map((c) => (
                          <Field key={c.library_id} label={c.library_id} hint="allowed (comma) · empty = any">
                            <TextInput value={(r.applies_when.criteria[c.library_id] ?? []).join(', ')} onChange={(v) => setCriterion(c.library_id, v)} />
                          </Field>
                        ))}
                      </div>
                    )}
                  </Knob>

                  {/* Knob 02 — quantity */}
                  <Knob n="02" label="Quantity">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {QTY_KINDS.map((k) => (
                        <button key={k} onClick={() => setQtyKind(k)} className="rounded px-2 py-0.5 text-[11px]" style={{ background: r.qty_kind === k ? 'var(--accent)' : 'var(--bg-2)', color: r.qty_kind === k ? '#fff' : 'var(--ink-2)' }}>{k}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(r.qty_kind === 'fixed' || r.qty_kind === 'per' || r.qty_kind === 'per_length') && (
                        <Field label={r.qty_kind === 'per_length' ? 'qty per metre' : 'qty'}><NumberInput value={r.qty ?? 1} onChange={(v) => updateRule({ qty: v })} /></Field>
                      )}
                      {r.qty_kind === 'cut' && <Field label="cut length · mm"><NumberInput value={r.cut_length ?? 0} onChange={(v) => updateRule({ cut_length: v })} /></Field>}
                      {(r.qty_kind === 'per' || r.qty_kind === 'cut') && (
                        <Field label={r.qty_kind === 'cut' ? 'occurrences (X)' : 'per (X)'}>
                          <Select value={perToValue(r.per)} options={xOptions.map((o) => ({ value: o.value, label: o.label }))} onChange={setPer} />
                        </Field>
                      )}
                      {r.qty_kind === 'algorithm' && (
                        <Field label="algorithm"><Select value={r.algorithm_config?.algorithm ?? 'pack_stock'} options={ALGOS} onChange={(v) => updateRule({ algorithm_config: { algorithm: v, inputs: r.algorithm_config?.inputs ?? {} } })} /></Field>
                      )}
                    </div>
                    <div className="mono mt-2 text-[11px] text-ink-2">{englishify(r, sampleMaterial)}</div>
                  </Knob>

                  {/* Knob 03 — SKU */}
                  <Knob n="03" label="SKU">
                    <span className="mono text-[12px]">{sampleMaterial?.sku ?? '—'} <span className="text-ink-3">(direct — referenced material)</span></span>
                  </Knob>
                </div>
              </div>

              {/* live evaluation pane — same engine as the take-off */}
              <div className="overflow-hidden rounded-md border border-accent-line bg-panel">
                <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5" style={{ background: 'var(--selected)' }}>
                  <h3 className="m-0 text-[13px] font-semibold">Live evaluation</h3>
                  <span className="mono text-[10px] text-accent">reacts to the rule above</span>
                </header>
                <div className="p-3.5">
                  <div className="uc mb-2">sample inputs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="variant">
                      <select className="input text w-full" value={variant} onChange={(e) => setVariant(e.target.value)} style={{ fontSize: 12 }}>
                        {system.variants.rows.map((row, i) => <option key={i} value={rowLabel(row)}>{rowLabel(row)}</option>)}
                      </select>
                    </Field>
                    <Field label={`primitive · ${system.primitive.kind}`}><NumberInput value={primitive} onChange={setPrimitive} /></Field>
                    {system.criteria.map((c) => (
                      <Field key={c.library_id} label={c.library_id}><TextInput value={criteria[c.library_id] ?? ''} onChange={(v) => setCriteria((s) => ({ ...s, [c.library_id]: v }))} /></Field>
                    ))}
                    {system.properties.flatMap((p) => p.inputs.filter((i) => typeof i.default === 'number').map((inp) => (
                      <Field key={`${p.name}.${inp.name}`} label={`${p.name}.${inp.name}`}>
                        <NumberInput value={props[p.name]?.[inp.name] ?? 0} onChange={(v) => setProps((s) => ({ ...s, [p.name]: { ...s[p.name], [inp.name]: v } }))} />
                      </Field>
                    )))}
                  </div>

                  {result && (
                    <div className="mt-3 rounded p-2.5" style={{ background: result.fires ? 'var(--ok-soft)' : 'var(--err-soft)' }}>
                      <div className="text-[12px] font-semibold" style={{ color: result.fires ? 'var(--ok)' : 'var(--err)' }}>
                        {result.fires ? '✓ Rule fires' : '✕ Rule does not fire'}
                      </div>
                      {!result.fires && result.skipReason && <div className="mono mt-1 text-[10px] text-ink-2">{result.skipReason}</div>}
                      {result.fires && (
                        <div className="mono mt-1 text-[12px]">→ {typeof result.qty === 'number' ? result.qty : `${result.qty.cut_length}mm × ${result.qty.occurrences}`} × {result.sku}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {!selected && <div className="rounded-md border border-line bg-panel p-6 text-center text-[12px] text-ink-3">Add a material to author its rule.</div>}
        </aside>
      </div>
    </div>
  );
}

function Knob({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line p-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="mono text-[10px] text-ink-4">{n}</span>
        <span className="uc">{label}</span>
      </div>
      {children}
    </div>
  );
}
