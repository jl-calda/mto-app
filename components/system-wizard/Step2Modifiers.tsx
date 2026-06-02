'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { Modifier, ModifierType, System } from '@/lib/types';
import { Card, Field, NumberInput, Select, TextInput, Toggle } from './parts';

const GROUPS = ['geometric', 'mounting', 'stock', 'compliance', 'environmental'] as const;
const KINDS = ['distance', 'bool', 'percentage', 'enum', 'banded_distance', 'support_grid'] as const;
type Kind = (typeof KINDS)[number];

function blankType(kind: Kind): ModifierType {
  switch (kind) {
    case 'enum': return { kind: 'enum', values: ['a', 'b'] };
    case 'banded_distance': return { kind: 'banded_distance', bands: [] };
    default: return { kind } as ModifierType;
  }
}

export function Step2Modifiers({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  const mods = system.modifiers;
  const update = (i: number, patch: Partial<Modifier>) =>
    setSystem((s) => ({ ...s, modifiers: s.modifiers.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const remove = (i: number) => setSystem((s) => ({ ...s, modifiers: s.modifiers.filter((_, j) => j !== i) }));
  const add = () =>
    setSystem((s) => ({
      ...s,
      modifiers: [...s.modifiers, { name: `modifier_${s.modifiers.length + 1}`, group: 'geometric', type: { kind: 'distance' }, enabled: true, default_value: 0 }],
    }));

  return (
    <Card title={`Modifiers — ${mods.length}`} action={<button type="button" className="btn primary sm" onClick={add}>Add modifier</button>}>
      {GROUPS.map((g) => {
        const items = mods.map((m, i) => ({ m, i })).filter((x) => x.m.group === g);
        if (items.length === 0) return null;
        return (
          <div key={g} className="mb-3 last:mb-0">
            <div className="uc mb-1.5">{g}</div>
            <div className="flex flex-col gap-2">
              {items.map(({ m, i }) => (
                <ModifierRow key={i} m={m} onChange={(p) => update(i, p)} onRemove={() => remove(i)} />
              ))}
            </div>
          </div>
        );
      })}
      {mods.length === 0 && <div className="py-2 text-[12px] text-ink-3">No modifiers. A system can have none.</div>}
    </Card>
  );
}

function ModifierRow({ m, onChange, onRemove }: { m: Modifier; onChange: (p: Partial<Modifier>) => void; onRemove: () => void }) {
  const kind = m.type.kind as Kind;
  return (
    <div className="rounded border border-line p-2.5">
      <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto] items-end gap-2">
        <Field label="name"><TextInput mono value={m.name} onChange={(v) => onChange({ name: v })} /></Field>
        <Field label="group"><Select value={m.group} options={GROUPS} onChange={(v) => onChange({ group: v })} /></Field>
        <Field label="type"><Select value={kind} options={KINDS} onChange={(v) => onChange({ type: blankType(v), default_value: v === 'bool' ? false : v === 'distance' || v === 'percentage' ? 0 : undefined })} /></Field>
        <button type="button" className="btn sm danger" onClick={onRemove}>Remove</button>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
        {(kind === 'distance' || kind === 'percentage') && (
          <Field label={`default ${kind === 'percentage' ? '%' : 'mm'}`}><NumberInput value={Number(m.default_value) || 0} onChange={(v) => onChange({ default_value: v })} /></Field>
        )}
        {kind === 'bool' && (
          <Field label="default"><div className="h-7 items-center pt-1"><Toggle on={!!m.default_value} onChange={(v) => onChange({ default_value: v })} /></div></Field>
        )}
        {kind === 'enum' && m.type.kind === 'enum' && (
          <Field label="values (comma)"><TextInput value={m.type.values.join(', ')} onChange={(v) => onChange({ type: { kind: 'enum', values: v.split(',').map((x) => x.trim()).filter(Boolean) } })} /></Field>
        )}
        {kind === 'banded_distance' && <div className="text-[11px] text-ink-3 self-center">banded SKU lookup — bands authored in the model</div>}
        {kind === 'support_grid' && <div className="text-[11px] text-ink-3 self-center">support-grid knob (regular / irregular)</div>}
        <Field label="enabled"><div className="pt-1"><Toggle on={m.enabled} onChange={(v) => onChange({ enabled: v })} /></div></Field>
        <Field label="editable @ take-off"><div className="pt-1"><Toggle on={!!m.editable_at_takeoff} onChange={(v) => onChange({ editable_at_takeoff: v })} /></div></Field>
      </div>
    </div>
  );
}
