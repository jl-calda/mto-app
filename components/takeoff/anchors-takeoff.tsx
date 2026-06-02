'use client';

import { useMemo, useState } from 'react';
import { resolveTakeoff } from '@/lib/engine';
import { Visual } from '@/components/visual';
import { Stat, PrimitiveBadge } from '@/components/chrome';
import { SaveStatus, useTakeoffPersistence, type PersistTarget } from '@/components/takeoff/persistence';
import type { Material, Model, System, Takeoff, VariantSnapshot } from '@/lib/types';

export function AnchorsTakeoff({
  system,
  model,
  materials,
  variant,
  criteria,
  title,
  initial = 12,
  persist,
}: {
  system: System;
  model: Model;
  materials: Material[];
  variant: VariantSnapshot;
  criteria: Record<string, string>;
  title: string;
  initial?: number;
  persist?: PersistTarget;
}) {
  const [count, setCount] = useState(initial);

  const result = useMemo(
    () =>
      resolveTakeoff({
        system,
        model,
        variant,
        materials,
        input: { criteria_values: criteria, modifier_values: {}, primitive_input: count, property_values: {} },
      }),
    [system, model, materials, variant, criteria, count],
  );
  const items = result.mto.reduce((s, l) => s + l.qty, 0);

  const buildTakeoff = (): Takeoff => ({
    id: persist?.takeoffId ?? 'tko-draft',
    name: title,
    system_id: system.id,
    model_id: model.id,
    variant_choice: variant,
    criteria_values: criteria,
    modifier_values: {},
    primitive_input: count,
    property_values: {},
    computed_geometry: result.geometry,
    mto: result.mto,
    warnings: result.warnings,
  });
  const save = useTakeoffPersistence(persist, buildTakeoff, JSON.stringify({ count, items }));

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <h1 className="m-0 text-[22px] font-semibold">{title}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <PrimitiveBadge kind="count" />
            <span className="tag">sys · {system.name}</span>
            <span className="tag">mod · {model.name}</span>
          </div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="lines" v={result.mto.length} />
          <Stat k="items" v={items} />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4 py-4">
        <div className="flex flex-col gap-3">
          <section className="overflow-hidden rounded-md border border-line bg-panel">
            <header className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-3.5 py-2.5">
              <span className="mono text-[11px] text-ink-4">01</span>
              <h3 className="m-0 text-[13px] font-semibold">Criteria</h3>
            </header>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 p-3.5">
              {Object.entries(criteria).map(([k, v]) => (
                <div key={k}>
                  <div className="uc">{k}</div>
                  <div className="mono text-[12px]">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-line bg-panel">
            <header className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-3.5 py-2.5">
              <span className="mono text-[11px] text-ink-4">02</span>
              <h3 className="m-0 text-[13px] font-semibold">Primitive · count</h3>
            </header>
            <div className="flex flex-wrap items-center gap-3 p-5">
              <button className="btn" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="decrease">−</button>
              <div className="mono w-[120px] text-center text-[40px] font-medium tabular-nums">{count}</div>
              <button className="btn" onClick={() => setCount((c) => c + 1)} aria-label="increase">+</button>
              <div className="ml-2 max-w-[280px] text-[12px] text-ink-3">
                anchor points · a <span className="mono">count</span> primitive has only an input step (no
                adjust / constrain / quantize).
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0">
          <div
            className="sticky top-[60px] overflow-hidden rounded-md border border-line bg-panel"
            style={{ boxShadow: 'var(--shadow-sticky)' }}
          >
            <div className="flex items-start justify-between border-b border-line px-4 py-3.5">
              <div>
                <h2 className="m-0 text-[14px] font-semibold">Live MTO</h2>
                <div className="mono text-[11px] text-ink-3">{model.name}</div>
              </div>
              {persist ? (
                <SaveStatus state={save.state} savedAt={save.savedAt} onSave={() => void save.saveNow()} />
              ) : (
                <span className="mono text-[10px] text-ok" style={{ animation: 'pulse 2s infinite' }}>● live</span>
              )}
            </div>
            {result.mto.map((l, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-line px-3.5 py-2 last:border-b-0">
                <Visual visual={l.material_visual ?? { kind: 'icon', name: 'anchor' }} name={l.description} size={22} rounded={3} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px]">{l.description}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{l.sku}</div>
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
