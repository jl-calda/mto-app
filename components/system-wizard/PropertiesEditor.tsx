'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { ChainRole, PropertyArchetype, PropertyInput, PropertyInstance, PropertyScope, System, SystemVariantRef, Warning } from '@/lib/types';
import { Card, Field, NumberInput, Select, Stub, TextInput } from './parts';
import { SpansEditor } from './SpansEditor';
import { PlacementRulesEditor } from './PlacementRulesEditor';
import { byAffected, affected } from '@/lib/validate';
import { WarningBadge } from '@/components/warnings/warning-list';

function rowName(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}

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

export function PropertiesEditor({ system, setSystem, warnings = [] }: { system: System; setSystem: Dispatch<SetStateAction<System>>; warnings?: Warning[] }) {
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

  // ── variant×property matrix (gate which properties each variant asks for) ──
  const names = system.variants.rows.map(rowName);
  const isOn = (p: PropertyInstance, name: string) => !p.applies_to_variants?.length || p.applies_to_variants.includes(name);
  const toggleCell = (propName: string, name: string) =>
    setSystem((s) => ({
      ...s,
      properties: s.properties.map((p) => {
        if (p.name !== propName) return p;
        const cur = p.applies_to_variants?.length ? p.applies_to_variants : names;
        const next = cur.includes(name) ? cur.filter((v) => v !== name) : [...cur, name];
        const all = names.length > 0 && names.every((v) => next.includes(v));
        return { ...p, applies_to_variants: all ? undefined : next };
      }),
    }));

  return (
    <div className="flex flex-col gap-3">
      <Card title={`Properties — ${props.length}`} action={<button type="button" className="btn primary sm" onClick={add}>Add property</button>}>
        <div className="flex flex-col gap-2.5">
          {props.map((p, i) => (
            <div key={i} className="rounded border border-line p-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.3fr)_1fr_1fr_auto] sm:items-end">
                <Field label="name"><TextInput mono value={p.name} onChange={(v) => update(i, { name: v })} /></Field>
                <Field label="archetype">
                  <Select value={p.archetype} options={ARCHETYPES} onChange={(v) => update(i, { archetype: v, inputs: defaultInputs(v), packing_policy: v === 'stock' ? { mode: 'tight', overlap_per_joint: 0 } : undefined })} />
                </Field>
                <Field label="scope">
                  <Select value={scopeKind(p.scope)} options={SCOPES} onChange={(v) => update(i, { scope: v === 'per_span' ? { kind: 'per_span', span_name: 'span_1' } : (v as PropertyScope) })} />
                </Field>
                <div className="flex items-center justify-end gap-2">
                  <WarningBadge warnings={byAffected(warnings, affected.prop(p.name))} />
                  <button type="button" className="btn sm danger" onClick={() => remove(i)}>Remove</button>
                </div>
              </div>

              {/* archetype-specific inputs */}
              {p.inputs.length > 0 && (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card title="Variant × property matrix">
        {props.length === 0 || names.length === 0 ? (
          <div className="text-[12px] text-ink-3">Add variants (earlier step) and properties above — then gate which properties each variant asks for.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-[1] border-b border-line bg-panel p-1.5 text-left uc">variant ╲ property</th>
                  {props.map((p) => <th key={p.name} className="border-b border-line p-1.5 text-left uc">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {names.map((nm) => (
                  <tr key={nm}>
                    <td className="sticky left-0 z-[1] border-b border-line bg-panel p-1.5 font-medium">{nm}</td>
                    {props.map((p) => {
                      const on = isOn(p, nm);
                      return (
                        <td key={p.name} className="border-b border-line p-1.5">
                          <button type="button" onClick={() => toggleCell(p.name, nm)} className="flex h-5 w-5 items-center justify-center rounded" style={{ background: on ? 'var(--ok-soft)' : 'var(--bg-2)', color: on ? 'var(--ok)' : 'var(--ink-4)', border: '1px solid var(--line)' }}>
                            {on ? '✓' : '·'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-[10px] text-ink-3">A row that is all-on means the property is unrestricted. The engine skips a property for variants where it is off.</div>
          </div>
        )}
      </Card>

      <SpansEditor system={system} setSystem={setSystem} />
      <PlacementRulesEditor system={system} setSystem={setSystem} />
      <Stub title="Attachments" owner="Brief 09">Author on the system detail page — connection points, presets, suppressions, connection materials.</Stub>
    </div>
  );
}
