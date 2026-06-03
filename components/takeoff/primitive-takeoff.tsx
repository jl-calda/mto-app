'use client';

import { useMemo, useState } from 'react';
import { resolveTakeoff } from '@/lib/engine';
import { deriveModifierValues, deriveCriteriaOptions } from '@/lib/takeoff-init';
import { mtoToCsv } from '@/lib/export/csv';
import { mtoToPdf } from '@/lib/export/pdf';
import { Visual } from '@/components/visual';
import { Stat, PrimitiveBadge } from '@/components/chrome';
import { SaveStatus, useTakeoffPersistence, type PersistTarget } from '@/components/takeoff/persistence';
import { CuttingDiagram } from '@/components/takeoff/CuttingDiagram';
import { TypedField, resolveInputType, resolveModifierType, resolveCriterion } from '@/components/inputs';
import type { AttachmentInstance, AttrValue, ChainRole, InventoryItem, Material, Model, Modifier, PresetTarget, PropertyInput, SubAssembly, System, SystemVariantRef, Takeoff, VariantSnapshot } from '@/lib/types';

const CHAIN_COLOR: Record<ChainRole, { bg: string; fg: string }> = {
  input: { bg: '#F5F2EA', fg: 'var(--ink-3)' },
  adjusted: { bg: '#EDF1F8', fg: 'var(--accent)' },
  constrained: { bg: '#F8EFE6', fg: 'var(--annotation)' },
  quantized: { bg: '#EAF0EA', fg: 'var(--ok)' },
};

function rowLabel(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}
function snapshotFor(r: SystemVariantRef): VariantSnapshot {
  return r.kind === 'local'
    ? { source_ref: r, attributes: r.attributes }
    : { source_ref: r, snapshot_version: r.pinned_version, attributes: {} };
}
function presetLabel(t: PresetTarget): string {
  switch (t.kind) {
    case 'variant': return 'variant';
    case 'criterion': return `criterion:${t.name}`;
    case 'modifier': return `modifier:${t.name}`;
    case 'property_input': return `${t.property}.${t.input}`;
    case 'primitive_input_field': return `primitive.${t.field}`;
  }
}

export function PrimitiveTakeoff({
  system,
  model,
  materials,
  criteria,
  title,
  primitive = 'length',
  initial = 24000,
  initialVariant = 0,
  iconName = 'post',
  subAssemblies = [],
  attachableSystems = [],
  inventory = [],
  persist,
  initialProps,
  initialModifiers,
}: {
  system: System;
  model: Model;
  materials: Material[];
  criteria: Record<string, string>;
  title: string;
  primitive?: 'length' | 'height';
  initial?: number;
  initialVariant?: number;
  iconName?: string;
  subAssemblies?: SubAssembly[];
  attachableSystems?: System[];
  inventory?: InventoryItem[];
  persist?: PersistTarget;
  initialProps?: Record<string, unknown>;
  initialModifiers?: Record<string, unknown>;
}) {
  const rows = system.variants.rows;
  const [variantIdx, setVariantIdx] = useState(initialVariant);
  const [value, setValue] = useState(initial);

  // editable Section-02 criteria, seeded from the resolved defaults the page passed.
  const [criteriaValues, setCriteriaValues] = useState<Record<string, string>>(() => ({ ...criteria }));
  const setCriterion = (k: string, v: string) => setCriteriaValues((o) => ({ ...o, [k]: v }));
  // known allowed values per criterion (from the rules that gate on it) → select; else free text.
  const criteriaOptions = useMemo(() => deriveCriteriaOptions(system, model, subAssemblies), [system, model, subAssemblies]);

  // editable system modifiers, seeded system-default → model-default → saved take-off values
  // (the same order the engine resolves them). Typed per the modifier's ModifierType.
  const [modValues, setModValues] = useState<Record<string, number | boolean | string>>(() => {
    const resolved = deriveModifierValues(system, model, initialModifiers);
    const o: Record<string, number | boolean | string> = {};
    for (const m of system.modifiers) {
      if (m.type.kind === 'support_grid' || m.type.kind === 'discrete_set') continue; // skip for now
      const v = resolved[m.name];
      switch (m.type.kind) {
        case 'bool': o[m.name] = v === true; break;
        case 'enum': o[m.name] = typeof v === 'string' ? v : (m.type.values[0] ?? ''); break;
        case 'enum_with_attributes': o[m.name] = typeof v === 'string' ? v : (m.type.values[0]?.name ?? ''); break;
        default: o[m.name] = typeof v === 'number' ? v : 0; // distance | number | percentage | banded_distance
      }
    }
    return o;
  });
  const setModifier = (name: string, v: number | boolean | string) => setModValues((o) => ({ ...o, [name]: v }));

  // editable property inputs (rung spacing, cage threshold, gates, toeboard, landing width, …),
  // seeded from each input's default (overridden by any saved values), fed into property_values.
  const [propValues, setPropValues] = useState<Record<string, Record<string, number | boolean | string>>>(() => {
    const o: Record<string, Record<string, number | boolean | string>> = {};
    for (const p of system.properties) {
      for (const inp of p.inputs) {
        let v: number | boolean | string | undefined;
        switch (inp.type.kind) {
          case 'distance': case 'number': case 'integer': v = typeof inp.default === 'number' ? inp.default : 0; break;
          case 'bool': v = typeof inp.default === 'boolean' ? inp.default : false; break;
          case 'enum': v = typeof inp.default === 'string' ? inp.default : (inp.type.values[0] ?? ''); break;
          default: v = undefined; // 'variant' inputs are authored elsewhere
        }
        if (v === undefined) continue;
        const saved = (initialProps?.[p.name] as Record<string, unknown> | undefined)?.[inp.name];
        if (typeof saved === typeof v) v = saved as typeof v;
        (o[p.name] ??= {})[inp.name] = v;
      }
    }
    return o;
  });
  const setPropInput = (prop: string, input: string, v: number | boolean | string) =>
    setPropValues((o) => ({ ...o, [prop]: { ...(o[prop] ?? {}), [input]: v } }));

  // segmented-length support (only for segmentable length systems)
  const canSegment = primitive === 'length' && system.primitive.kind === 'length' && system.primitive.segmentable === true;
  const [segmented, setSegmented] = useState(false);
  const [segs, setSegs] = useState<{ length: number; junction: string }[]>([
    { length: 10000, junction: 'corner' },
    { length: 14000, junction: 'corner' },
  ]);
  const primitiveInput = useMemo(() => {
    if (primitive === 'height') return value;
    if (canSegment && segmented) {
      return { mode: 'segmented' as const, segments: segs.map((s, i) => (i < segs.length - 1 ? { length: s.length, junction_after: { type: s.junction } } : { length: s.length })) };
    }
    return { mode: 'single' as const, total: value };
  }, [primitive, value, canSegment, segmented, segs]);

  // manual dimension-chain overrides (Brief 10)
  const [chainOverrides, setChainOverrides] = useState<Partial<Record<ChainRole, number>>>({});
  const [overrideMode, setOverrideMode] = useState(false);
  const setOverride = (role: ChainRole, v: number | null) =>
    setChainOverrides((o) => { const n = { ...o }; if (v == null) delete n[role]; else n[role] = v; return n; });

  // attachment instances (include + open inputs), keyed by attachment id
  const [attState, setAttState] = useState<Record<string, AttachmentInstance>>(() => {
    const o: Record<string, AttachmentInstance> = {};
    for (const att of system.attachments ?? []) {
      o[att.id] = { attachment_id: att.id, included: att.default_included, primitive_input: { mode: 'single', total: 4000 } };
    }
    return o;
  });

  const saById = useMemo(() => new Map(subAssemblies.map((s) => [s.id, s])), [subAssemblies]);
  const sysById = useMemo(() => new Map(attachableSystems.map((s) => [s.id, s])), [attachableSystems]);
  const resolveSubAssembly = useMemo(() => (id: string) => saById.get(id), [saById]);
  const resolveAttachedSystem = useMemo(() => (id: string) => sysById.get(id), [sysById]);

  const variant = useMemo(() => snapshotFor(rows[variantIdx] ?? rows[0]), [rows, variantIdx]);
  const attachmentInstances = useMemo(() => Object.values(attState), [attState]);
  const result = useMemo(
    () =>
      resolveTakeoff({
        system,
        model,
        variant,
        materials,
        resolveSubAssembly,
        resolveAttachedSystem,
        inventory,
        input: {
          criteria_values: criteriaValues,
          modifier_values: modValues,
          primitive_input: primitiveInput,
          property_values: propValues,
          attachments: attachmentInstances,
          chain_overrides: Object.keys(chainOverrides).length ? chainOverrides : undefined,
        },
      }),
    [system, model, materials, variant, criteriaValues, modValues, primitiveInput, propValues, resolveSubAssembly, resolveAttachedSystem, attachmentInstances, chainOverrides, inventory],
  );
  const items = result.mto.reduce((s, l) => s + l.qty, 0);
  const flights = result.counters.flights;

  // provenance labels for MTO lines (which sub-assembly / attachment produced them)
  const attLabel = useMemo(() => new Map((system.attachments ?? []).map((a) => [a.id, a.role_label])), [system.attachments]);
  const saLabel = useMemo(() => new Map(subAssemblies.map((s) => [s.id, s.name])), [subAssemblies]);
  const provenance = (l: { source_attachment?: string; source_sub_assembly?: string }) => {
    if (l.source_attachment) return { text: `↳ ${attLabel.get(l.source_attachment) ?? 'attachment'}`, color: 'var(--annotation)', bg: 'var(--annotation-soft)' };
    if (l.source_sub_assembly) return { text: `⊂ ${saLabel.get(l.source_sub_assembly) ?? 'sub-assembly'}`, color: 'var(--accent)', bg: 'var(--accent-soft)' };
    return null;
  };

  // persistence — save the current inputs + denormalized snapshot + computed MTO
  const buildTakeoff = (): Takeoff => ({
    id: persist?.takeoffId ?? 'tko-draft',
    name: title,
    system_id: system.id,
    model_id: model.id,
    variant_choice: variant,
    criteria_values: criteriaValues,
    modifier_values: modValues,
    primitive_input: primitiveInput,
    property_values: propValues,
    attachments: attachmentInstances,
    computed_geometry: result.geometry,
    mto: result.mto,
    warnings: result.warnings,
  });
  const sig = JSON.stringify({ variantIdx, criteriaValues, modValues, primitiveInput, propValues, attState, mto: result.mto.length, items });
  const save = useTakeoffPersistence(persist, buildTakeoff, sig);

  function download(blob: Blob, ext: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\w-]+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const downloadCsv = () => download(new Blob([mtoToCsv(result.mto)], { type: 'text/csv;charset=utf-8' }), 'csv');
  const downloadPdf = () => download(new Blob([mtoToPdf(result.mto, title) as BlobPart], { type: 'application/pdf' }), 'pdf');

  // Every editable value is rendered through the type-driven TypedField so the
  // control + affordance (pick-list / bounded number / toggle / free text) is
  // derived from the field's type rather than hand-rolled per call site.
  const propField = (prop: string, inp: PropertyInput) => (
    <TypedField
      key={inp.name}
      label={inp.label}
      sub={inp.label !== inp.name ? inp.name : undefined}
      descriptor={resolveInputType(inp.type)}
      value={(propValues[prop]?.[inp.name] ?? '') as AttrValue}
      onChange={(v) => setPropInput(prop, inp.name, v as number | boolean | string)}
    />
  );

  const modDefaults = useMemo(() => deriveModifierValues(system, model, initialModifiers), [system, model, initialModifiers]);
  const modifierField = (m: Modifier) => {
    const value = (modValues[m.name] ?? '') as AttrValue;
    const locked = m.editable_at_takeoff === false;
    const provenance = locked ? 'locked' : value === modDefaults[m.name] ? 'derived' : undefined;
    return (
      <TypedField
        key={m.name}
        label={m.name}
        sub={`${m.group} · ${m.type.kind}`}
        descriptor={resolveModifierType(m.type)}
        value={value}
        onChange={(v) => setModifier(m.name, v as number | boolean | string)}
        provenance={provenance}
      />
    );
  };
  // all enabled modifiers — support_grid / discrete_set now resolve to a visible
  // "advanced" affordance instead of being silently dropped.
  const allModifiers = system.modifiers.filter((m) => m.enabled);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex flex-col gap-3 border-b border-line pb-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">{title}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <PrimitiveBadge kind={primitive} />
            <span className="tag">sys · {system.name}</span>
            <span className="tag">mod · {model.name}</span>
          </div>
        </div>
        <div className="flex flex-wrap border-line lg:border-l">
          <Stat k="lines" v={result.mto.length} />
          <Stat k="items" v={items} />
          {primitive === 'height' && flights != null && <Stat k="flights" v={flights} />}
          {result.warnings.length > 0 && <Stat k="warnings" v={result.warnings.length} highlight="warn" />}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4 py-4">
        <div className="flex flex-col gap-3">
          {rows.length > 0 && (
            <Section index="01" title="System variant">
              <div className="grid grid-cols-3 gap-2">
                {rows.map((r, i) => {
                  const on = i === variantIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => setVariantIdx(i)}
                      className="rounded border p-3 text-left"
                      style={{
                        borderColor: on ? 'var(--accent)' : 'var(--line-2)',
                        boxShadow: on ? '0 0 0 1px var(--accent)' : undefined,
                        background: on ? 'var(--selected)' : 'var(--panel)',
                      }}
                    >
                      <div className="text-[13px] font-medium">{rowLabel(r)}</div>
                      <div className="mono mt-1 text-[10px] text-ink-3">
                        {r.kind === 'local'
                          ? Object.entries(r.attributes).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') || 'local'
                          : r.kind}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <Section index="02" title="Criteria">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
              {Object.entries(criteriaValues).map(([k, v]) => (
                <TypedField
                  key={k}
                  label={k}
                  descriptor={resolveCriterion({ options: criteriaOptions[k] })}
                  value={v}
                  onChange={(nv) => setCriterion(k, String(nv ?? ''))}
                  provenance={v === criteria[k] ? 'derived' : undefined}
                />
              ))}
            </div>
          </Section>

          {allModifiers.length > 0 && (
            <Section index="03" title="Modifiers">
              <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
                {allModifiers.map((m) => modifierField(m))}
              </div>
            </Section>
          )}

          <Section index="04" title={`Primitive · ${primitive}${segmented ? ' · segmented' : ''}`}>
            {canSegment && (
              <div className="mb-2.5 flex items-center gap-2">
                <button type="button" role="switch" aria-checked={segmented} aria-label="Segmented run" onClick={() => setSegmented((s) => !s)} className="flex items-center gap-1.5">
                  <span className="flex h-4 w-7 items-center rounded-full px-0.5 transition-colors" style={{ background: segmented ? 'var(--accent)' : 'var(--ink-5)' }}>
                    <span className="h-3 w-3 rounded-full bg-white transition-transform" style={{ transform: segmented ? 'translateX(12px)' : 'none' }} />
                  </span>
                  <span className="text-[11px] text-ink-2">Segmented run (corners / splices)</span>
                </button>
              </div>
            )}

            {!segmented ? (
              <div className="flex items-center gap-2">
                <button className="btn" onClick={() => setValue((l) => Math.max(0, l - 1000))} aria-label="decrease">−</button>
                <input
                  className="input w-[120px] text-center"
                  value={value}
                  onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
                />
                <span className="mono text-[12px] text-ink-3">mm</span>
                <button className="btn" onClick={() => setValue((l) => l + 1000)} aria-label="increase">+</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {segs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="mono w-4 text-[10px] text-ink-4">{i + 1}</span>
                    <input className="input w-[110px]" value={s.length} onChange={(e) => setSegs((arr) => arr.map((x, j) => (j === i ? { ...x, length: Math.max(0, Number(e.target.value) || 0) } : x)))} />
                    <span className="mono text-[11px] text-ink-3">mm</span>
                    {i < segs.length - 1 && (
                      <select className="input text" style={{ fontSize: 11 }} value={s.junction} onChange={(e) => setSegs((arr) => arr.map((x, j) => (j === i ? { ...x, junction: e.target.value } : x)))}>
                        <option value="corner">⌐ corner</option>
                        <option value="splice">— splice</option>
                      </select>
                    )}
                    <span className="flex-1" />
                    {segs.length > 1 && <button className="btn sm danger" aria-label={`Remove segment ${i + 1}`} onClick={() => setSegs((arr) => arr.filter((_, j) => j !== i))}>×</button>}
                  </div>
                ))}
                <button className="btn sm self-start" onClick={() => setSegs((arr) => [...arr, { length: 6000, junction: 'corner' }])}>+ Add segment</button>
                <div className="mono text-[11px] text-ink-3">total {segs.reduce((t, s) => t + s.length, 0).toLocaleString()} mm · {segs.length} segments · {segs.length - 1} junction(s)</div>
              </div>
            )}

            <div className="mt-3.5 rounded border border-line bg-panel-2 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="uc">dimension chain</div>
                <div className="flex items-center gap-2">
                  {Object.keys(chainOverrides).length > 0 && <button className="btn sm" onClick={() => setChainOverrides({})}>revert all</button>}
                  <button onClick={() => setOverrideMode((m) => !m)} className="text-[10px]" style={{ color: overrideMode ? 'var(--accent)' : 'var(--ink-3)' }}>⊷ override</button>
                </div>
              </div>
              <div className="flex items-stretch gap-1.5">
                {result.chain.steps.map((s, i) => {
                  const c = CHAIN_COLOR[s.role];
                  const overridden = !!s.override_history;
                  return (
                    <div key={i} className="flex items-stretch gap-1.5" style={{ flex: 1 }}>
                      <div className="min-w-0 flex-1 rounded border p-2" style={{ background: c.bg, borderColor: overridden ? 'var(--annotation)' : 'var(--line)' }}>
                        <div className="flex items-center justify-between">
                          <span className="uc" style={{ fontSize: 9, color: c.fg, fontWeight: 600 }}>{s.role}</span>
                          {overridden && <button onClick={() => setOverride(s.role, null)} title="revert" className="text-[9px] text-annotation">revert ×</button>}
                        </div>
                        {overrideMode ? (
                          <input className="input mt-1 w-full" style={{ height: 22, fontSize: 13 }} value={chainOverrides[s.role] ?? s.value} onChange={(e) => setOverride(s.role, Math.max(0, Number(e.target.value) || 0))} />
                        ) : (
                          <div className="mono mt-1 text-[16px]">{s.value.toLocaleString()}</div>
                        )}
                        {overridden ? (
                          <div className="mono mt-0.5 text-[9px] text-annotation">was {s.override_history!.original_engine_value.toLocaleString()}</div>
                        ) : (
                          <div className="mono mt-0.5 text-[10px] text-ink-3">{s.name}</div>
                        )}
                      </div>
                      {i < result.chain.steps.length - 1 && <span className="flex items-center text-ink-4">›</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {result.geometry.segments && (result.geometry.segments.length > 1 || (result.geometry.junctions?.length ?? 0) > 0) && (
              <div className="mt-2.5 rounded border border-line bg-panel-2 p-2.5">
                <div className="uc mb-2">segments &amp; junctions</div>
                <div className="flex flex-wrap items-stretch gap-1.5">
                  {result.geometry.segments.map((s, i) => {
                    const len = s.dimension_chain.steps[s.dimension_chain.steps.length - 1].value;
                    return (
                      <div key={s.id} className="rounded border border-line bg-panel p-2" style={{ minWidth: 88 }}>
                        <div className="uc" style={{ fontSize: 9 }}>seg {i + 1}</div>
                        <div className="mono text-[14px]">{len.toLocaleString()}</div>
                        <div className="mono text-[9px] text-ink-3">{s.foot_kind === 'free' ? '○' : '●'}–{s.head_kind === 'free' ? '○' : '●'}</div>
                      </div>
                    );
                  })}
                </div>
                {result.geometry.junctions && result.geometry.junctions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {result.geometry.junctions.map((j) => (
                      <span key={j.id} className="tag" style={{ color: 'var(--annotation)', background: 'var(--annotation-soft)' }}>{j.type} @ {j.position.toLocaleString()}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.warnings.map((w, i) => (
              <div
                key={i}
                className="mt-2.5 flex items-start gap-2 rounded p-2.5 text-[11px]"
                style={{
                  background: w.level === 'warning' ? 'var(--warn-soft)' : 'var(--selected)',
                  border: `1px solid ${w.level === 'warning' ? '#E8C97A' : 'var(--accent-line)'}`,
                }}
              >
                <span className="mono" style={{ color: w.level === 'warning' ? 'var(--warn)' : 'var(--accent)' }}>●</span>
                <span className="text-ink-2">{w.message}</span>
              </div>
            ))}
          </Section>

          {system.properties.length > 0 && (
            <Section index="05" title="Properties">
              <div className="flex flex-col gap-2">
                {system.properties.map((p) => {
                  const editable = p.inputs.filter((i) => i.type.kind !== 'variant');
                  return (
                    <div key={p.name} className="overflow-hidden rounded border border-line">
                      <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-3 py-2">
                        <span className="mono text-[12px] font-semibold">{p.name}</span>
                        <span className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>{p.archetype}</span>
                        <span className="flex-1" />
                        <span className="mono text-[10px] text-ink-3">
                          scope · {typeof p.scope === 'string' ? p.scope : `per_span:${p.scope.span_name}`}
                        </span>
                      </div>
                      {editable.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
                          {editable.map((inp) => propField(p.name, inp))}
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-[11px] text-ink-3">No take-off inputs — quantity is derived.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {(system.attachments ?? []).length > 0 && (
            <Section index="06" title="Attachments">
              <div className="flex flex-col gap-2.5">
                {(system.attachments ?? []).map((att) => {
                  const inst = attState[att.id];
                  const on = inst?.included ?? att.default_included;
                  const attachedSys = sysById.get(att.attached_system_id);
                  const summary = result.attachments.find((a) => a.id === att.id);
                  const lockedInputs = new Set(
                    att.presets
                      .filter((p) => p.locked && p.target.kind === 'property_input')
                      .map((p) => (p.target.kind === 'property_input' ? `${p.target.property}.${p.target.input}` : '')),
                  );
                  const total = (inst?.primitive_input as { total?: number } | undefined)?.total ?? 0;
                  return (
                    <div key={att.id} className="rounded border" style={{ borderColor: on ? 'var(--accent-line)' : 'var(--line-2)', background: on ? 'var(--panel)' : 'var(--panel-2)' }}>
                      <button
                        type="button" role="switch" aria-checked={on} aria-label={`Include ${att.role_label}`}
                        onClick={() => setAttState((s) => ({ ...s, [att.id]: { ...s[att.id], attachment_id: att.id, included: !on } }))}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                      >
                        <span
                          className="flex h-4 w-7 items-center rounded-full px-0.5 transition-colors"
                          style={{ background: on ? 'var(--accent)' : 'var(--ink-5)' }}
                        >
                          <span className="h-3 w-3 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium">{att.role_label}</div>
                          <div className="mono text-[10px] text-ink-3">
                            {attachedSys?.name ?? att.attached_system_id} · {att.connection.from_point.kind} → {att.connection.to_point.kind}
                          </div>
                        </div>
                        {att.optional && <span className="tag">optional</span>}
                        {on && summary && <span className="tag" style={{ color: 'var(--annotation)', background: 'var(--annotation-soft)' }}>+{summary.line_count} lines</span>}
                      </button>

                      {on && (
                        <div className="border-t border-line p-3">
                          {/* open inputs */}
                          {attachedSys && (
                            <div className="mb-2.5">
                              <div className="uc mb-1.5">open inputs</div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col gap-1">
                                  <span className="mono text-[10px] text-ink-3">run length · mm</span>
                                  <input
                                    className="input w-full"
                                    value={total}
                                    onChange={(e) =>
                                      setAttState((s) => ({ ...s, [att.id]: { ...s[att.id], attachment_id: att.id, included: true, primitive_input: { mode: 'single', total: Math.max(0, Number(e.target.value) || 0) } } }))
                                    }
                                  />
                                </label>
                                {attachedSys.properties.flatMap((p) =>
                                  p.inputs
                                    .filter((i) => typeof i.default === 'number' && !lockedInputs.has(`${p.name}.${i.name}`))
                                    .map((i) => (
                                      <label key={`${p.name}.${i.name}`} className="flex flex-col gap-1">
                                        <span className="mono text-[10px] text-ink-3">{p.name}.{i.name}</span>
                                        <input
                                          className="input w-full"
                                          value={(inst?.property_values?.[p.name] as Record<string, number> | undefined)?.[i.name] ?? (i.default as number)}
                                          onChange={(e) =>
                                            setAttState((s) => {
                                              const cur = s[att.id] ?? { attachment_id: att.id, included: true };
                                              const pv = { ...(cur.property_values ?? {}) };
                                              pv[p.name] = { ...(pv[p.name] as Record<string, unknown> ?? {}), [i.name]: Math.max(0, Number(e.target.value) || 0) };
                                              return { ...s, [att.id]: { ...cur, attachment_id: att.id, included: true, property_values: pv } };
                                            })
                                          }
                                        />
                                      </label>
                                    )),
                                )}
                              </div>
                            </div>
                          )}

                          {/* derived (from connection constraints) + locked presets */}
                          {(summary && Object.keys(summary.derived).length > 0) || att.presets.length > 0 ? (
                            <div className="mb-2">
                              <div className="uc mb-1.5">derived &amp; locked</div>
                              <div className="flex flex-wrap gap-1.5">
                                {summary &&
                                  Object.entries(summary.derived).map(([k, v]) => (
                                    <span key={k} className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>
                                      {k.replace(/^(mod|crit|prop|prim):/, '')} ← {v.toLocaleString()} · derived
                                    </span>
                                  ))}
                                {att.presets.map((p, i) => (
                                  <span key={i} className="tag" title={p.locked ? 'locked preset' : 'editable preset'}>
                                    {p.locked ? '🔒 ' : ''}
                                    {presetLabel(p.target)} = {String(p.value)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="rounded p-2 text-[11px] text-ink-2" style={{ background: 'var(--bg-2)' }}>
                            Resolved recursively through the same engine; {att.suppressions.length} suppression(s) applied; cuts merged into the shared pool.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        <div className="min-w-0">
          <div className="sticky top-[60px] overflow-hidden rounded-md border border-line bg-panel" style={{ boxShadow: 'var(--shadow-sticky)' }}>
            <div className="flex items-start justify-between border-b border-line px-4 py-3.5">
              <div>
                <h2 className="m-0 text-[14px] font-semibold">Live MTO</h2>
                <div className="mono text-[11px] text-ink-3">{model.name}</div>
              </div>
              <div className="flex items-center gap-2">
                {persist ? (
                  <SaveStatus state={save.state} savedAt={save.savedAt} onSave={() => void save.saveNow()} />
                ) : (
                  <span className="mono text-[10px] text-ok" style={{ animation: 'pulse 2s infinite' }}>● live</span>
                )}
                <button className="btn sm" onClick={downloadCsv}>CSV</button>
                <button className="btn sm" onClick={downloadPdf}>PDF</button>
              </div>
            </div>
            {result.mto.map((l, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-line px-3.5 py-2 last:border-b-0">
                <Visual visual={l.material_visual ?? { kind: 'icon', name: iconName }} name={l.description} size={22} rounded={3} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px]">{l.description}</span>
                    {(() => {
                      const p = provenance(l);
                      return p ? (
                        <span className="shrink-0 rounded px-1 text-[9px] font-medium" style={{ color: p.color, background: p.bg }}>{p.text}</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="mono truncate text-[10px] text-ink-3">{l.sku}</div>
                  {l.cutting_plan && (
                    <>
                      <div className="mono text-[9px] text-annotation">
                        cut: {l.cutting_plan.per_stock.length} stock · {l.cutting_plan.per_stock.reduce((s, p) => s + p.cuts.length, 0)} pieces
                      </div>
                      <CuttingDiagram plan={l.cutting_plan} />
                    </>
                  )}
                </div>
                <div className="mono w-[44px] text-right text-[13px] font-medium">{l.qty}</div>
                <div className="mono w-[28px] text-[11px] text-ink-3">{l.unit}</div>
              </div>
            ))}
            {result.mto.length === 0 && (
              <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No lines fire for these inputs.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-3.5 py-2.5">
        <span className="mono text-[11px] text-ink-4">{index}</span>
        <h3 className="m-0 text-[13px] font-semibold">{title}</h3>
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}
