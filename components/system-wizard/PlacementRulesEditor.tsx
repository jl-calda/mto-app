'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PlacementRules, PropertyInstance, System } from '@/lib/types';
import { Card, Field, NumberInput } from './parts';
import { PlacementDiagram } from '@/components/placement-diagram';

// Placement rules drive the place_supports algorithm (end clearances, spacing
// bounds, forbidden zones). Authored per property; the engine passes the first
// property's rules to place_supports.

export function PlacementRulesEditor({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  // illustrative sample run length per property (default by primitive kind).
  const defaultLen = system.primitive.kind === 'height' ? 9450 : 24000;
  const [sampleLen, setSampleLen] = useState<Record<string, number>>({});
  const lenFor = (name: string) => sampleLen[name] ?? defaultLen;

  const setRules = (pi: number, patch: Partial<PlacementRules>) =>
    setSystem((s) => ({ ...s, properties: s.properties.map((p, j) => (j === pi ? { ...p, placement_rules: { ...(p.placement_rules ?? {}), ...patch } } : p)) }));
  const clearance = (pi: number, end: 'end_clearance_foot' | 'end_clearance_head', max: number) =>
    setRules(pi, { [end]: { max } } as Partial<PlacementRules>);
  const addZone = (pi: number, p: PropertyInstance) =>
    setRules(pi, { forbidden_zones: [...(p.placement_rules?.forbidden_zones ?? []), { start: 0, end: 0 }] });
  const setZone = (pi: number, p: PropertyInstance, zi: number, patch: Partial<{ start: number; end: number }>) =>
    setRules(pi, { forbidden_zones: (p.placement_rules?.forbidden_zones ?? []).map((z, k) => (k === zi ? { ...z, ...patch } : z)) });

  return (
    <Card title="Placement rules">
      <div className="mb-2 text-[11px] text-ink-3">For algorithm-driven (<span className="mono">place_supports</span>) properties — end clearances, spacing bounds, forbidden zones.</div>
      <div className="flex flex-col gap-2.5">
        {system.properties.map((p, i) => {
          const r = p.placement_rules ?? {};
          return (
            <div key={i} className="rounded border border-line p-2.5">
              <div className="mb-2 mono text-[12px] font-semibold">{p.name}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                <Field label="max spacing"><NumberInput value={r.max_spacing ?? 0} onChange={(v) => setRules(i, { max_spacing: v })} /></Field>
                <Field label="min spacing"><NumberInput value={r.min_spacing ?? 0} onChange={(v) => setRules(i, { min_spacing: v })} /></Field>
                <Field label="foot clearance"><NumberInput value={r.end_clearance_foot?.max ?? 0} onChange={(v) => clearance(i, 'end_clearance_foot', v)} /></Field>
                <Field label="head clearance"><NumberInput value={r.end_clearance_head?.max ?? 0} onChange={(v) => clearance(i, 'end_clearance_head', v)} /></Field>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="uc">forbidden zones</span>
                <button type="button" className="btn sm" onClick={() => addZone(i, p)}>Add zone</button>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {(r.forbidden_zones ?? []).map((z, zi) => (
                  <div key={zi} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                    <Field label="start"><NumberInput value={z.start} onChange={(v) => setZone(i, p, zi, { start: v })} /></Field>
                    <Field label="end"><NumberInput value={z.end} onChange={(v) => setZone(i, p, zi, { end: v })} /></Field>
                    <button type="button" className="btn sm danger" onClick={() => setRules(i, { forbidden_zones: (p.placement_rules?.forbidden_zones ?? []).filter((_, k) => k !== zi) })}>×</button>
                  </div>
                ))}
              </div>

              {(r.max_spacing ?? 0) > 0 && (
                <div className="mt-2.5 border-t border-line pt-2.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="uc">placement preview</span>
                    <label className="flex items-center gap-1.5 text-[10px] text-ink-3">
                      sample {system.primitive.kind === 'height' ? 'height' : 'length'}
                      <input className="input" style={{ width: 96, height: 24 }} inputMode="numeric" value={lenFor(p.name)} onChange={(e) => setSampleLen((s) => ({ ...s, [p.name]: Number(e.target.value) || 0 }))} />
                    </label>
                  </div>
                  <PlacementDiagram rules={r} length={lenFor(p.name)} label={p.name} />
                  {r.per_segment && <div className="mt-1 text-[10px] text-ink-3">per_segment is on — at take-off each flight/leg places its own supports (one at every corner). This preview shows a single span.</div>}
                </div>
              )}
            </div>
          );
        })}
        {system.properties.length === 0 && <div className="text-[12px] text-ink-3">Add properties first (step 4).</div>}
      </div>
    </Card>
  );
}
