'use client';

// AttachmentsEditor — the system-edit interface for declaring attachments
// (Brief 09 owns this tab of the Brief 04 wizard). It shows every piece of the
// attachment contract: connection points, model policy, presets (locked/editable),
// derived bindings, suppressions, and the optional / default-included knobs.
// The include/optional knobs are live; full authoring mutations + version history
// land with the wizard (Brief 04) and persistence (Brief 10).

import { useState } from 'react';
import type {
  Attachment,
  ConnectionConstraint,
  ConnectionPoint,
  PresetTarget,
} from '@/lib/types';

function pointLabel(p: ConnectionPoint): string {
  switch (p.kind) {
    case 'head': return 'head';
    case 'foot': return 'foot';
    case 'start': return 'start';
    case 'end': return 'end';
    case 'segment_end': return `segment[${p.segment_index}] end`;
    case 'position': return `position ${p.value}`;
  }
}
function constraintLabel(c: ConnectionConstraint): string {
  switch (c.kind) {
    case 'height_match': return `height match · ${c.from_field} → ${c.to_field}${c.tolerance ? ` ±${c.tolerance}` : ''}`;
    case 'alignment': return `alignment · ${c.axis}`;
    case 'clearance': return `clearance · min ${c.min}`;
  }
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

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5">
      <span className="flex h-4 w-7 items-center rounded-full px-0.5 transition-colors" style={{ background: on ? 'var(--accent)' : 'var(--ink-5)' }}>
        <span className="h-3 w-3 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
      </span>
      <span className="text-[11px] text-ink-2">{label}</span>
    </button>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="uc mb-1.5">{label}</div>
      {children}
    </div>
  );
}

export function AttachmentsEditor({
  attachments,
  attachedNames,
}: {
  attachments: Attachment[];
  attachedNames: Record<string, string>;
}) {
  const [knobs, setKnobs] = useState<Record<string, { optional: boolean; default_included: boolean }>>(() => {
    const o: Record<string, { optional: boolean; default_included: boolean }> = {};
    for (const a of attachments) o[a.id] = { optional: a.optional, default_included: a.default_included };
    return o;
  });

  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="m-0 text-[13px] font-semibold">Attachments</h3>
          <span className="mono text-[10px] text-ink-3">{attachments.length}</span>
        </div>
        <button className="btn primary sm">Add attachment</button>
      </header>

      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2" style={{ background: 'var(--selected)' }}>
        <span className="mono text-[11px] text-accent">draft</span>
        <span className="text-[11px] text-ink-2">Include / optional knobs are live; full authoring &amp; persistence land with the wizard (Brief 04) and version history (Brief 10).</span>
      </div>

      {attachments.map((att) => {
        const k = knobs[att.id];
        const policy = att.model_binding;
        return (
          <div key={att.id} className="border-b border-line p-3.5 last:border-b-0">
            {/* header */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{att.role_label}</div>
                <div className="mono text-[10px] text-ink-3">→ {attachedNames[att.attached_system_id] ?? att.attached_system_id}</div>
              </div>
              <Toggle on={k.optional} onClick={() => setKnobs((s) => ({ ...s, [att.id]: { ...s[att.id], optional: !s[att.id].optional } }))} label="optional" />
              <Toggle on={k.default_included} onClick={() => setKnobs((s) => ({ ...s, [att.id]: { ...s[att.id], default_included: !s[att.id].default_included } }))} label="default-included" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Block label="Connection">
                <div className="flex flex-col gap-1 rounded border border-line p-2.5">
                  <div className="mono text-[12px]">{pointLabel(att.connection.from_point)} <span className="text-ink-4">→</span> {pointLabel(att.connection.to_point)}</div>
                  {att.connection.constraints.map((c, i) => (
                    <div key={i} className="mono text-[10px] text-ink-3">{constraintLabel(c)}</div>
                  ))}
                  {att.connection.constraints.length === 0 && <div className="mono text-[10px] text-ink-4">no constraints</div>}
                </div>
              </Block>

              <Block label="Model policy">
                <div className="rounded border border-line p-2.5">
                  {policy.kind === 'pinned' ? (
                    <div className="text-[12px]">Pinned · <span className="mono text-[11px]">{policy.model_id}</span></div>
                  ) : (
                    <div className="text-[12px]">Choose at take-off{policy.default_model_id ? <> · default <span className="mono text-[11px]">{policy.default_model_id}</span></> : null}</div>
                  )}
                </div>
              </Block>

              <Block label={`Presets · ${att.presets.length}`}>
                <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                  {att.presets.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`tag ${p.locked ? '' : ''}`} style={{ color: p.locked ? 'var(--annotation)' : 'var(--ink-2)' }}>{p.locked ? '🔒 locked' : 'editable'}</span>
                      <span className="mono text-[11px]">{presetLabel(p.target)} = {String(p.value)}</span>
                    </div>
                  ))}
                  {att.presets.length === 0 && <div className="mono text-[10px] text-ink-4">none</div>}
                </div>
              </Block>

              <Block label={`Derived bindings · ${att.derived_bindings.length}`}>
                <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                  {att.derived_bindings.map((d, i) => (
                    <div key={i} className="mono text-[11px]">{presetLabel(d.target)} <span className="text-ink-4">←</span> {constraintLabel(d.source)}</div>
                  ))}
                  {att.derived_bindings.length === 0 && <div className="mono text-[10px] text-ink-4">none</div>}
                </div>
              </Block>

              <Block label={`Suppressions · ${att.suppressions.length}`}>
                <div className="flex flex-col gap-1.5 rounded border border-line p-2.5">
                  {att.suppressions.map((sup, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="tag" style={{ color: sup.member === 'this' ? 'var(--prim-height)' : 'var(--accent)' }}>{sup.member}</span>
                      <span className="mono text-[11px]">{sup.property_name}</span>
                      <span className="tag">{sup.region ?? 'at_connection'}</span>
                    </div>
                  ))}
                  {att.suppressions.length === 0 && <div className="mono text-[10px] text-ink-4">none</div>}
                </div>
              </Block>

              <Block label="Connection materials">
                <div className="rounded border border-line p-2.5 text-[11px] text-ink-2">
                  Declared as model-level rules (gate, transition brackets) per model — see the model editor. They join the host&apos;s shared cut pool.
                </div>
              </Block>
            </div>
          </div>
        );
      })}

      {attachments.length === 0 && (
        <div className="px-3.5 py-6 text-center text-[12px] text-ink-3">No attachments declared.</div>
      )}
    </section>
  );
}
