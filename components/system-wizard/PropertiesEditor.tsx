'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { ChainRole, PropertyArchetype, PropertyInput, PropertyInstance, PropertyScope, System } from '@/lib/types';
import { Card, Field, NumberInput, Select, Stub, TextInput } from './parts';
import { SpansEditor } from './SpansEditor';
import { PlacementRulesEditor } from './PlacementRulesEditor';

const ARCHETYPES: PropertyArchetype[] = ['spacing', 'count', 'rate', 'stock', 'variant', 'threshold', 'junction'];
const SCOPES = ['per_segment', 'per_junction', 'per_mount_surface', 'set_level', 'per_span'] as const;
const CHAIN_ROLES: ChainRole[] = ['input', 'adjusted', 'constrained', 'quantized'];

function defaultInputs(a: PropertyArchetype): PropertyInput[] {
  switch (a) {
    case 'spacing': return [{ name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 1500 }];
    case 'count': return [{ name: 'count', label: 'Count', type: { kind: 'integer' }, required: true, default: 1 }];
    case 'rate': return [{ name: 'rate', label: 'Rate per m', type: { kind: 'number' }, required: true, default: 1 }];
    case 'threshold': return [
      { name: 'threshold', label: 'Threshold', type: { kind: 'distance' }, required: true, default: 3000 },
      { name: 'spacing', label: 'Spacing', type: { kind: 'distance' }, required: true, default: 280 },
    ];
    default: return [];
  }
}

function scopeKind(s: PropertyScope): string {
  return typeof s === 'string' ? s : s.kind;
}

export function PropertiesEditor({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  const props = system.properties;
  const update = (i: number, patch: Partial<PropertyInstance>) =>
    setSystem((s) => ({ ...s, properties: s.properties.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const remove = (i: number) => setSystem((s) => ({ ...s, properties: s.properties.filter((_, j) => j !== i) }));
  const add = () =>
    setSystem((s) => ({
      ...s,
      properties: [...s.properties, { catalog_id: `prop_${s.properties.length + 1}`, name: `property_${s.properties.length + 1}`, archetype: 'spacing', inputs: defaultInputs('spacing'), scope: 'per_segment' }],
    }));
  const setInputDefault = (pi: number, ii: number, value: number) =>
    setSystem((s) => ({ ...s, properties: s.properties.map((p, j) => (j === pi ? { ...p, inputs: p.inputs.map((inp, k) => (k === ii ? { ...inp, default: value } : inp)) } : p)) }));

  return (
    <div className="flex flex-col gap-3">
      <Card title={`Properties — ${props.length}`} action={<button type="button" className="btn primary sm" onClick={add}>Add property</button>}>
        <div className="flex flex-col gap-2.5">
          {props.map((p, i) => (
            <div key={i} className="rounded border border-line p-2.5">
              <div className="grid grid-cols-[minmax(0,1.3fr)_1fr_1fr_auto] items-end gap-2">
                <Field label="name"><TextInput mono value={p.name} onChange={(v) => update(i, { name: v })} /></Field>
                <Field label="archetype">
                  <Select value={p.archetype} options={ARCHETYPES} onChange={(v) => update(i, { archetype: v, inputs: defaultInputs(v), packing_policy: v === 'stock' ? { mode: 'tight', overlap_per_joint: 0 } : undefined })} />
                </Field>
                <Field label="scope">
                  <Select value={scopeKind(p.scope)} options={SCOPES} onChange={(v) => update(i, { scope: v === 'per_span' ? { kind: 'per_span', span_name: 'span_1' } : (v as PropertyScope) })} />
                </Field>
                <button type="button" className="btn sm danger" onClick={() => remove(i)}>Remove</button>
              </div>

              {/* archetype-specific inputs */}
              {p.inputs.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {p.inputs.map((inp, ii) => (
                    <Field key={inp.name} label={`${inp.name} · default`}>
                      <NumberInput value={Number(inp.default) || 0} onChange={(v) => setInputDefault(i, ii, v)} />
                    </Field>
                  ))}
                </div>
              )}

              {/* extras */}
              <div className="mt-2 flex flex-wrap items-end gap-2">
                {typeof p.scope !== 'string' && p.scope.kind === 'per_span' && (
                  <Field label="span name"><TextInput mono value={p.scope.span_name} onChange={(v) => update(i, { scope: { kind: 'per_span', span_name: v } })} /></Field>
                )}
                {(p.archetype === 'rate' || p.archetype === 'stock') && (
                  <Field label="length basis"><Select value={(p.length_basis ?? 'adjusted') as ChainRole} options={CHAIN_ROLES} onChange={(v) => update(i, { length_basis: v })} /></Field>
                )}
                {p.archetype === 'stock' && (
                  <Field label="packing mode">
                    <Select value={p.packing_policy?.mode ?? 'tight'} options={['tight', 'spaced'] as const} onChange={(v) => update(i, { packing_policy: v === 'tight' ? { mode: 'tight', overlap_per_joint: 0 } : { mode: 'spaced', max_gap: 0 } })} />
                  </Field>
                )}
                {(p.archetype === 'variant' || p.archetype === 'junction') && (
                  <span className="text-[11px] text-ink-3 self-center">{p.archetype} sub-inputs author in the model rule (variant options / junction types)</span>
                )}
              </div>
            </div>
          ))}
          {props.length === 0 && <div className="py-2 text-[12px] text-ink-3">No properties yet.</div>}
        </div>
      </Card>

      <SpansEditor system={system} setSystem={setSystem} />
      <PlacementRulesEditor system={system} setSystem={setSystem} />
      <Stub title="Attachments" owner="Brief 09">Author on the system detail page — connection points, presets, suppressions, connection materials.</Stub>
    </div>
  );
}
