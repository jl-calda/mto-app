'use client';

import { useMemo, useState } from 'react';
import { evaluateRuleAgainstSample } from '@/lib/engine';
import { Visual } from '@/components/visual';
import type { Material, Model, Rule, System, SystemVariantRef } from '@/lib/types';

function rowLabel(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}

export function englishify(rule: Rule, material?: Material): string {
  let qty: string;
  switch (rule.qty_kind) {
    case 'fixed':
      qty = `${rule.qty ?? 1}× (fixed)`;
      break;
    case 'per':
      qty = `${rule.qty ?? 1} per ${rule.per && 'name' in rule.per ? rule.per.name : rule.per?.kind ?? 'unit'}`;
      break;
    case 'per_length':
      qty = `${rule.qty ?? 1} per metre`;
      break;
    case 'cut':
      qty = `${rule.cut_length ?? 0}mm cut per ${rule.per && 'name' in rule.per ? rule.per.name : 'occurrence'}`;
      break;
    case 'algorithm':
      qty = `${rule.algorithm_config?.algorithm ?? 'algorithm'} output`;
      break;
    default:
      qty = '—';
  }
  const vs = rule.applies_when.variants ?? [];
  const cs = Object.entries(rule.applies_when.criteria ?? {}).filter(([, v]) => v?.length);
  const when =
    vs.length || cs.length
      ? ` — when ${[vs.length ? `variant ∈ {${vs.join(', ')}}` : '', ...cs.map(([k, v]) => `${k} ∈ {${v.join(', ')}}`)].filter(Boolean).join(' & ')}`
      : ' — always';
  return `${qty} of ${material?.sku ?? '—'}${when}`;
}

function firstVariant(system: System): string {
  const r = system.variants.rows[0];
  return r ? rowLabel(r) : '';
}
function defaultPrimitive(system: System): number {
  return system.primitive.kind === 'height' ? 9450 : system.primitive.kind === 'count' ? 12 : 24000;
}

export function ModelEditor({
  system,
  model,
  materials,
}: {
  system: System;
  model: Model;
  materials: Material[];
}) {
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const [selId, setSelId] = useState(model.materials[0]?.id ?? '');
  const selected = model.materials.find((mm) => mm.id === selId) ?? model.materials[0];

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
    () =>
      selected
        ? evaluateRuleAgainstSample(selected.rule, system, { variant, criteria, properties: props, primitive: { value: primitive } }, sampleMaterial)
        : null,
    [selected, system, variant, criteria, props, primitive, sampleMaterial],
  );

  const steps = result
    ? [
        { label: 'Check variant scope', ok: result.checks.variant },
        { label: 'Check criteria scope', ok: result.checks.criteria },
        { label: 'Resolve quantity', ok: result.fires, value: result.fires ? (typeof result.qty === 'number' ? String(result.qty) : `${result.qty.cut_length}mm × ${result.qty.occurrences}`) : '—' },
        { label: 'Resolve SKU', ok: result.fires, value: result.sku ?? '—' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div className="flex items-center gap-3">
          <Visual visual={model.visual} name={model.name} size={36} rounded={6} />
          <div>
            <h1 className="m-0 text-[20px] font-semibold">{model.name}</h1>
            <div className="mono mt-1 text-[11px] text-ink-3">{system.name} · {model.status} · {model.materials.length} materials</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-4 py-4">
        {/* material list */}
        <section className="overflow-hidden rounded-md border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
            <h3 className="m-0 text-[13px] font-semibold">Materials</h3>
            <button className="btn primary sm">Add material</button>
          </header>
          {model.materials.map((mm) => {
            const mat = matById.get(mm.material_id);
            const on = mm.id === selected?.id;
            return (
              <button
                key={mm.id}
                onClick={() => setSelId(mm.id)}
                className="flex w-full items-center gap-3 border-b border-line px-3.5 py-2.5 text-left last:border-b-0"
                style={{ background: on ? 'var(--selected)' : undefined }}
              >
                <Visual visual={mat?.visual} name={mat?.name ?? mm.material_id} size={24} rounded={3} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{mat?.name ?? mm.material_id}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{englishify(mm.rule, mat)}</div>
                </div>
                <span className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>{mm.rule.qty_kind}</span>
              </button>
            );
          })}
          {model.materials.length === 0 && <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No materials.</div>}
        </section>

        {/* rule + live eval */}
        <aside className="sticky top-[60px] flex flex-col gap-3">
          {selected && (
            <>
              <div className="overflow-hidden rounded-md border border-line bg-panel">
                <header className="border-b border-line bg-panel-2 px-3.5 py-2.5">
                  <h3 className="m-0 text-[13px] font-semibold">Rule · {sampleMaterial?.name ?? selected.material_id}</h3>
                </header>
                <div className="flex flex-col gap-2.5 p-3.5">
                  <Knob n="01" label="Applies when">
                    <div className="flex flex-wrap gap-1">
                      {(selected.rule.applies_when.variants ?? []).length === 0 && Object.keys(selected.rule.applies_when.criteria ?? {}).length === 0 ? (
                        <span className="mono text-[11px] text-ink-3">always</span>
                      ) : (
                        <>
                          {(selected.rule.applies_when.variants ?? []).map((v) => <span key={v} className="tag">variant: {v}</span>)}
                          {Object.entries(selected.rule.applies_when.criteria ?? {}).map(([k, vals]) => (
                            <span key={k} className="tag">{k}: {vals.join('/')}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </Knob>
                  <Knob n="02" label="Quantity">
                    <span className="mono text-[12px]">{englishify(selected.rule, sampleMaterial)}</span>
                  </Knob>
                  <Knob n="03" label="SKU">
                    <span className="mono text-[12px]">{sampleMaterial?.sku ?? '—'} <span className="text-ink-3">(direct)</span></span>
                  </Knob>
                </div>
              </div>

              {/* live evaluation pane */}
              <div className="overflow-hidden rounded-md border border-accent-line bg-panel">
                <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5" style={{ background: 'var(--selected)' }}>
                  <h3 className="m-0 text-[13px] font-semibold">Live evaluation</h3>
                  <span className="mono text-[10px] text-accent">same engine as take-off</span>
                </header>
                <div className="p-3.5">
                  {/* sample inputs */}
                  <div className="uc mb-2">sample inputs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="variant">
                      <select className="input text w-full" value={variant} onChange={(e) => setVariant(e.target.value)} style={{ fontSize: 12 }}>
                        {system.variants.rows.map((r, i) => <option key={i} value={rowLabel(r)}>{rowLabel(r)}</option>)}
                      </select>
                    </Field>
                    <Field label={`primitive · ${system.primitive.kind}`}>
                      <input className="input w-full" value={primitive} onChange={(e) => setPrimitive(Number(e.target.value) || 0)} />
                    </Field>
                    {system.criteria.map((c) => (
                      <Field key={c.library_id} label={c.library_id}>
                        <input className="input text w-full" value={criteria[c.library_id] ?? ''} onChange={(e) => setCriteria((s) => ({ ...s, [c.library_id]: e.target.value }))} style={{ fontSize: 12 }} />
                      </Field>
                    ))}
                    {system.properties.flatMap((p) => p.inputs.filter((i) => typeof i.default === 'number').map((inp) => (
                      <Field key={`${p.name}.${inp.name}`} label={`${p.name}.${inp.name}`}>
                        <input className="input w-full" value={props[p.name]?.[inp.name] ?? 0} onChange={(e) => setProps((s) => ({ ...s, [p.name]: { ...s[p.name], [inp.name]: Number(e.target.value) || 0 } }))} />
                      </Field>
                    )))}
                  </div>

                  {/* fires + result */}
                  {result && (
                    <div className="mt-3 rounded p-2.5" style={{ background: result.fires ? 'var(--ok-soft)' : 'var(--err-soft)' }}>
                      <div className="text-[12px] font-semibold" style={{ color: result.fires ? 'var(--ok)' : 'var(--err)' }}>
                        {result.fires ? '✓ Rule fires' : '✕ Rule does not fire'}
                      </div>
                      {!result.fires && result.skipReason && <div className="mono mt-1 text-[10px] text-ink-2">{result.skipReason}</div>}
                      {result.fires && (
                        <div className="mono mt-1 text-[12px]">
                          → {typeof result.qty === 'number' ? result.qty : `${result.qty.cut_length}mm × ${result.qty.occurrences}`} × {result.sku}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4-step trace */}
                  <div className="uc mb-1.5 mt-3">evaluation trace</div>
                  <div className="flex flex-col gap-1">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded border border-line px-2.5 py-1.5">
                        <span className="mono text-[10px] text-ink-4">{i + 1}</span>
                        <span style={{ color: s.ok ? 'var(--ok)' : 'var(--err)' }}>{s.ok ? '✓' : '✕'}</span>
                        <span className="flex-1 text-[11px]">{s.label}</span>
                        {'value' in s && s.value != null && <span className="mono text-[11px] text-ink-2">{s.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="mono text-[10px] text-ink-3">{label}</span>
      {children}
    </label>
  );
}
