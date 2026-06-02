'use client';

import { useMemo, useState } from 'react';
import { resolveTakeoff } from '@/lib/engine';
import { mtoToCsv } from '@/lib/export/csv';
import { Visual } from '@/components/visual';
import { Stat, PrimitiveBadge } from '@/components/chrome';
import type { AttachmentInstance, ChainRole, Material, Model, SubAssembly, System, SystemVariantRef, VariantSnapshot } from '@/lib/types';

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
}) {
  const rows = system.variants.rows;
  const [variantIdx, setVariantIdx] = useState(initialVariant);
  const [value, setValue] = useState(initial);

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
        input: {
          criteria_values: criteria,
          modifier_values: {},
          primitive_input: primitive === 'height' ? value : { mode: 'single', total: value },
          property_values: {},
          attachments: attachmentInstances,
        },
      }),
    [system, model, materials, variant, criteria, primitive, value, resolveSubAssembly, resolveAttachedSystem, attachmentInstances],
  );
  const items = result.mto.reduce((s, l) => s + l.qty, 0);
  const flights = result.counters.flights;

  function downloadCsv() {
    const blob = new Blob([mtoToCsv(result.mto)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\w-]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">{title}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <PrimitiveBadge kind={primitive} />
            <span className="tag">sys · {system.name}</span>
            <span className="tag">mod · {model.name}</span>
          </div>
        </div>
        <div className="flex border-l border-line">
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
              {Object.entries(criteria).map(([k, v]) => (
                <div key={k}>
                  <div className="uc">{k}</div>
                  <div className="mono text-[12px]">{v}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section index="03" title={`Primitive · ${primitive}`}>
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

            <div className="mt-3.5 rounded border border-line bg-panel-2 p-2.5">
              <div className="uc mb-2">dimension chain</div>
              <div className="flex items-stretch gap-1.5">
                {result.chain.steps.map((s, i) => {
                  const c = CHAIN_COLOR[s.role];
                  return (
                    <div key={i} className="flex items-stretch gap-1.5" style={{ flex: 1 }}>
                      <div className="min-w-0 flex-1 rounded border border-line p-2" style={{ background: c.bg }}>
                        <div className="uc" style={{ fontSize: 9, color: c.fg, fontWeight: 600 }}>{s.role}</div>
                        <div className="mono mt-1 text-[16px]">{s.value.toLocaleString()}</div>
                        <div className="mono mt-0.5 text-[10px] text-ink-3">{s.name}</div>
                      </div>
                      {i < result.chain.steps.length - 1 && <span className="flex items-center text-ink-4">›</span>}
                    </div>
                  );
                })}
              </div>
            </div>

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
            <Section index="04" title="Properties">
              <div className="flex flex-col gap-1.5">
                {system.properties.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 rounded border border-line px-3 py-2">
                    <span className="mono text-[12px] font-semibold">{p.name}</span>
                    <span className="tag" style={{ color: 'var(--ok)', background: '#E5EFE4' }}>{p.archetype}</span>
                    <span className="flex-1" />
                    <span className="mono text-[10px] text-ink-3">
                      scope · {typeof p.scope === 'string' ? p.scope : `per_span:${p.scope.span_name}`}
                    </span>
                  </div>
                ))}
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
                <button className="btn sm" onClick={downloadCsv}>CSV</button>
                <span className="mono text-[10px] text-ok" style={{ animation: 'pulse 2s infinite' }}>● live</span>
              </div>
            </div>
            {result.mto.map((l, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-line px-3.5 py-2 last:border-b-0">
                <Visual visual={l.material_visual ?? { kind: 'icon', name: iconName }} name={l.description} size={22} rounded={3} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px]">{l.description}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{l.sku}</div>
                  {l.cutting_plan && (
                    <div className="mono text-[9px] text-annotation">
                      cut: {l.cutting_plan.per_stock.length} stock · {l.cutting_plan.per_stock.reduce((s, p) => s + p.cuts.length, 0)} pieces
                    </div>
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
