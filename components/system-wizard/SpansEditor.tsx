'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { SpanDeclaration, SpanEndpoint, System } from '@/lib/types';
import { Card, Field, NumberInput, Select, TextInput, Toggle } from './parts';

const EP_KINDS = ['segment_foot', 'segment_head', 'junction_deck', 'compliance_constant'] as const;
type EpKind = (typeof EP_KINDS)[number];

function blankEndpoint(kind: EpKind): SpanEndpoint {
  switch (kind) {
    case 'segment_foot': return { kind, segment_index: 0, offset: 0 };
    case 'segment_head': return { kind, segment_index: 0, offset: 0 };
    case 'junction_deck': return { kind, junction_index: 0, offset: 0 };
    case 'compliance_constant': return { kind, name: 'constant' };
  }
}

function EndpointEditor({ value, onChange }: { value: SpanEndpoint; onChange: (e: SpanEndpoint) => void }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)_80px] items-end gap-2">
      <Field label="anchor"><Select value={value.kind as EpKind} options={EP_KINDS} onChange={(k) => onChange(blankEndpoint(k))} /></Field>
      {value.kind === 'compliance_constant' ? (
        <Field label="constant name"><TextInput mono value={value.name} onChange={(v) => onChange({ kind: 'compliance_constant', name: v })} /></Field>
      ) : value.kind === 'junction_deck' ? (
        <>
          <Field label="junction #"><NumberInput value={value.junction_index} onChange={(v) => onChange({ ...value, junction_index: v })} /></Field>
          <Field label="offset"><NumberInput value={value.offset ?? 0} onChange={(v) => onChange({ ...value, offset: v })} /></Field>
        </>
      ) : (
        <>
          <Field label="segment #"><NumberInput value={value.segment_index} onChange={(v) => onChange({ ...value, segment_index: v })} /></Field>
          <Field label="offset"><NumberInput value={value.offset ?? 0} onChange={(v) => onChange({ ...value, offset: v })} /></Field>
        </>
      )}
    </div>
  );
}

export function SpansEditor({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  const spans = system.spans ?? [];
  const update = (i: number, patch: Partial<SpanDeclaration>) =>
    setSystem((s) => ({ ...s, spans: (s.spans ?? []).map((sp, j) => (j === i ? { ...sp, ...patch } : sp)) }));
  const add = () => setSystem((s) => ({ ...s, spans: [...(s.spans ?? []), { name: `span_${(s.spans ?? []).length + 1}`, start: blankEndpoint('segment_foot'), end: blankEndpoint('segment_head'), enabled: true }] }));
  const remove = (i: number) => setSystem((s) => ({ ...s, spans: (s.spans ?? []).filter((_, j) => j !== i) }));

  return (
    <Card title={`Spans — ${spans.length}`} action={<button type="button" className="btn sm" onClick={add}>Add span</button>}>
      <div className="mb-2 text-[11px] text-ink-3">Named ranges over the run. A <span className="mono">per_span</span> property evaluates over its span&apos;s length.</div>
      <div className="flex flex-col gap-2.5">
        {spans.map((sp, i) => (
          <div key={i} className="rounded border border-line p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <Field label="name"><TextInput mono value={sp.name} onChange={(v) => update(i, { name: v })} /></Field>
              <div className="flex-1" />
              <Toggle on={sp.enabled} label="enabled" onChange={(v) => update(i, { enabled: v })} />
              <button type="button" className="btn sm danger" onClick={() => remove(i)}>×</button>
            </div>
            <div className="uc mb-1">start</div>
            <EndpointEditor value={sp.start} onChange={(e) => update(i, { start: e })} />
            <div className="uc mb-1 mt-2">end</div>
            <EndpointEditor value={sp.end} onChange={(e) => update(i, { end: e })} />
          </div>
        ))}
        {spans.length === 0 && <div className="text-[12px] text-ink-3">No spans declared.</div>}
      </div>
    </Card>
  );
}
