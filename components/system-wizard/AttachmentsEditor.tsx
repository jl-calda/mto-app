'use client';

// AttachmentsEditor — authoring UI for a system's attachments (rendered on the
// system detail page). Holds a controlled draft of the attachment list and
// persists it via saveSystemAttachmentsAction. Every part of the attachment
// contract is editable: connection points + constraints, model policy, presets,
// derived bindings, suppressions, and the optional / default-included knobs.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, NumberInput, Select, TextInput, Toggle } from './parts';
import { saveSystemAttachmentsAction } from '@/app/systems/actions';
import { blankConnectionPoint, blankConstraint, blankPresetTarget, makeBlankAttachment } from '@/lib/attachment-authoring';
import type { Attachment, ConnectionConstraint, ConnectionPoint, PresetTarget } from '@/lib/types';

const POINT_KINDS: ConnectionPoint['kind'][] = ['head', 'foot', 'start', 'end', 'segment_end', 'position'];
const CONSTRAINT_KINDS: ConnectionConstraint['kind'][] = ['height_match', 'alignment', 'clearance'];
const PRESET_KINDS: PresetTarget['kind'][] = ['variant', 'criterion', 'modifier', 'property_input', 'primitive_input_field'];

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="uc mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ConnectionPointEditor({ point, onChange }: { point: ConnectionPoint; onChange: (p: ConnectionPoint) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Select value={point.kind} options={POINT_KINDS} onChange={(k) => onChange(blankConnectionPoint(k))} />
      {point.kind === 'segment_end' && <NumberInput value={point.segment_index} onChange={(v) => onChange({ kind: 'segment_end', segment_index: v })} />}
      {point.kind === 'position' && <NumberInput value={point.value} onChange={(v) => onChange({ kind: 'position', value: v })} />}
    </div>
  );
}

function ConstraintEditor({ c, onChange }: { c: ConnectionConstraint; onChange: (c: ConnectionConstraint) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={c.kind} options={CONSTRAINT_KINDS} onChange={(k) => onChange(blankConstraint(k))} />
      {c.kind === 'height_match' && (
        <>
          <input className="input mono" style={{ width: 120 }} value={c.from_field} onChange={(e) => onChange({ ...c, from_field: e.target.value })} />
          <span className="text-ink-4">→</span>
          <input className="input mono" style={{ width: 120 }} value={c.to_field} onChange={(e) => onChange({ ...c, to_field: e.target.value })} />
        </>
      )}
      {c.kind === 'alignment' && <Select value={c.axis} options={['x', 'y', 'z'] as const} onChange={(axis) => onChange({ kind: 'alignment', axis })} />}
      {c.kind === 'clearance' && <NumberInput value={c.min} onChange={(v) => onChange({ kind: 'clearance', min: v })} />}
    </div>
  );
}

function PresetTargetEditor({ target, onChange }: { target: PresetTarget; onChange: (t: PresetTarget) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={target.kind} options={PRESET_KINDS} onChange={(k) => onChange(blankPresetTarget(k))} />
      {(target.kind === 'criterion' || target.kind === 'modifier') && (
        <input className="input mono" style={{ width: 110 }} value={target.name} onChange={(e) => onChange({ ...target, name: e.target.value })} />
      )}
      {target.kind === 'property_input' && (
        <>
          <input className="input mono" style={{ width: 90 }} value={target.property} onChange={(e) => onChange({ ...target, property: e.target.value })} />
          <span className="text-ink-4">.</span>
          <input className="input mono" style={{ width: 90 }} value={target.input} onChange={(e) => onChange({ ...target, input: e.target.value })} />
        </>
      )}
      {target.kind === 'primitive_input_field' && (
        <input className="input mono" style={{ width: 90 }} value={target.field} onChange={(e) => onChange({ ...target, field: e.target.value })} />
      )}
    </div>
  );
}

export function AttachmentsEditor({
  systemId,
  attachments,
  systems,
}: {
  systemId: string;
  attachments: Attachment[];
  systems: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Attachment[]>(attachments);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const update = (id: string, patch: Partial<Attachment>) => setDrafts((ds) => ds.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => setDrafts((ds) => ds.filter((a) => a.id !== id));
  const add = () => setDrafts((ds) => [...ds, makeBlankAttachment(`att-${crypto.randomUUID().slice(0, 8)}`, systems[0]?.id ?? '')]);

  async function save() {
    setStatus('saving'); setError(undefined);
    const res = await saveSystemAttachmentsAction(systemId, drafts);
    if (res.ok) { setStatus('saved'); router.refresh(); }
    else { setStatus('error'); setError(res.error); }
  }

  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="m-0 text-[13px] font-semibold">Attachments</h3>
          <span className="mono text-[10px] text-ink-3">{drafts.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'error' && <span className="mono text-[10px] text-err">{error ?? 'save failed'}</span>}
          {status === 'saved' && <span className="mono text-[10px] text-ok">● saved</span>}
          <button className="btn sm" onClick={add} disabled={systems.length === 0}>+ Add attachment</button>
          <button className="btn primary sm" onClick={save} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save attachments'}</button>
        </div>
      </header>

      {drafts.map((att) => (
        <div key={att.id} className="border-b border-line p-3.5 last:border-b-0">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <input className="input text w-full max-w-[320px] text-[14px] font-semibold" style={{ height: 'auto', padding: '2px 8px' }}
                value={att.role_label} onChange={(e) => update(att.id, { role_label: e.target.value })} placeholder="Role label" />
            </div>
            <Toggle on={att.optional} onChange={(v) => update(att.id, { optional: v })} label="optional" />
            <Toggle on={att.default_included} onChange={(v) => update(att.id, { default_included: v })} label="default-included" />
            <button className="btn sm danger" aria-label="Remove attachment" onClick={() => remove(att.id)}>×</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Block label="Attached system">
              <Select value={att.attached_system_id} options={systems.map((s) => ({ value: s.id, label: s.name }))} onChange={(v) => update(att.id, { attached_system_id: v })} />
            </Block>

            <Block label="Model policy">
              <div className="flex items-center gap-1.5">
                <Select value={att.model_binding.kind} options={[{ value: 'pinned', label: 'pinned' }, { value: 'choose_at_takeoff', label: 'choose at take-off' }] as const}
                  onChange={(kind) => update(att.id, { model_binding: kind === 'pinned' ? { kind: 'pinned', model_id: att.model_binding.kind === 'pinned' ? att.model_binding.model_id : '' } : { kind: 'choose_at_takeoff', default_model_id: att.model_binding.kind === 'choose_at_takeoff' ? att.model_binding.default_model_id : undefined } })} />
                {att.model_binding.kind === 'pinned' ? (
                  <input className="input mono w-full" placeholder="model id" value={att.model_binding.model_id} onChange={(e) => update(att.id, { model_binding: { kind: 'pinned', model_id: e.target.value } })} />
                ) : (
                  <input className="input mono w-full" placeholder="default model id (optional)" value={att.model_binding.default_model_id ?? ''} onChange={(e) => update(att.id, { model_binding: { kind: 'choose_at_takeoff', default_model_id: e.target.value || undefined } })} />
                )}
              </div>
            </Block>

            <Block label="Connection">
              <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                <div className="flex items-center gap-2">
                  <ConnectionPointEditor point={att.connection.from_point} onChange={(from_point) => update(att.id, { connection: { ...att.connection, from_point } })} />
                  <span className="text-ink-4">→</span>
                  <ConnectionPointEditor point={att.connection.to_point} onChange={(to_point) => update(att.id, { connection: { ...att.connection, to_point } })} />
                </div>
                {att.connection.constraints.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <ConstraintEditor c={c} onChange={(nc) => update(att.id, { connection: { ...att.connection, constraints: att.connection.constraints.map((x, j) => (j === i ? nc : x)) } })} />
                    <button className="btn sm danger" aria-label="Remove constraint" onClick={() => update(att.id, { connection: { ...att.connection, constraints: att.connection.constraints.filter((_, j) => j !== i) } })}>×</button>
                  </div>
                ))}
                <button className="btn sm self-start" onClick={() => update(att.id, { connection: { ...att.connection, constraints: [...att.connection.constraints, blankConstraint('height_match')] } })}>+ constraint</button>
              </div>
            </Block>

            <Block label="Presets">
              <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                {att.presets.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <PresetTargetEditor target={p.target} onChange={(target) => update(att.id, { presets: att.presets.map((x, j) => (j === i ? { ...x, target } : x)) })} />
                    <span className="text-ink-4">=</span>
                    <input className="input mono" style={{ width: 90 }} value={String(p.value ?? '')} onChange={(e) => update(att.id, { presets: att.presets.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                    <Toggle on={p.locked} onChange={(v) => update(att.id, { presets: att.presets.map((x, j) => (j === i ? { ...x, locked: v } : x)) })} label="locked" />
                    <button className="btn sm danger" aria-label="Remove preset" onClick={() => update(att.id, { presets: att.presets.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button className="btn sm self-start" onClick={() => update(att.id, { presets: [...att.presets, { target: blankPresetTarget('modifier'), value: '', locked: false }] })}>+ preset</button>
              </div>
            </Block>

            <Block label="Derived bindings">
              <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                {att.derived_bindings.map((d, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <PresetTargetEditor target={d.target} onChange={(target) => update(att.id, { derived_bindings: att.derived_bindings.map((x, j) => (j === i ? { ...x, target } : x)) })} />
                    <span className="text-ink-4">←</span>
                    <ConstraintEditor c={d.source} onChange={(source) => update(att.id, { derived_bindings: att.derived_bindings.map((x, j) => (j === i ? { ...x, source } : x)) })} />
                    <button className="btn sm danger" aria-label="Remove derived binding" onClick={() => update(att.id, { derived_bindings: att.derived_bindings.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button className="btn sm self-start" onClick={() => update(att.id, { derived_bindings: [...att.derived_bindings, { target: blankPresetTarget('modifier'), source: blankConstraint('height_match') }] })}>+ binding</button>
              </div>
            </Block>

            <Block label="Suppressions">
              <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                {att.suppressions.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <Select value={s.member} options={['this', 'attached'] as const} onChange={(member) => update(att.id, { suppressions: att.suppressions.map((x, j) => (j === i ? { ...x, member } : x)) })} />
                    <input className="input mono" style={{ width: 110 }} placeholder="property" value={s.property_name} onChange={(e) => update(att.id, { suppressions: att.suppressions.map((x, j) => (j === i ? { ...x, property_name: e.target.value } : x)) })} />
                    <Select value={s.region ?? 'at_connection'} options={['at_connection', 'whole'] as const} onChange={(region) => update(att.id, { suppressions: att.suppressions.map((x, j) => (j === i ? { ...x, region } : x)) })} />
                    <button className="btn sm danger" aria-label="Remove suppression" onClick={() => update(att.id, { suppressions: att.suppressions.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button className="btn sm self-start" onClick={() => update(att.id, { suppressions: [...att.suppressions, { member: 'attached', property_name: '', region: 'at_connection' }] })}>+ suppression</button>
              </div>
            </Block>

            <Block label="Connection materials">
              <div className="rounded border border-line p-2.5 text-[11px] text-ink-2">
                Declared as model-level rules (gate, transition brackets) per model — see the model editor. They join the host&apos;s shared cut pool.
              </div>
            </Block>
          </div>
        </div>
      ))}

      {drafts.length === 0 && (
        <div className="px-3.5 py-6 text-center text-[12px] text-ink-3">No attachments declared. {systems.length === 0 ? 'Create another system to attach.' : 'Use “+ Add attachment”.'}</div>
      )}
    </section>
  );
}
