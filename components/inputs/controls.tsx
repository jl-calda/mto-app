'use client';

// Presentational controls + the TypedField wrapper. Each control has a strong,
// distinct affordance so "type a value" / "pick from a set" / "bounded number"
// read differently at a glance. Built on the existing .input / .tag / token CSS.

import { useState } from 'react';
import type { AttrValue } from '@/lib/types';
import { activeBandIndex } from '@/lib/engine/bands';
import type { ControlDescriptor, Option } from './resolve-control';

export type Provenance = 'derived' | 'locked' | undefined;

// ── mode tag: a tiny color-keyed pill that names the input mode ──
const TAG_TONE: Record<string, { color: string; bg: string }> = {
  list: { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  'free list': { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  toggle: { color: 'var(--ok)', bg: 'var(--ok-soft)' },
  'free text': { color: 'var(--ink-3)', bg: 'var(--bg-2)' },
  advanced: { color: 'var(--warn)', bg: 'var(--warn-soft)' },
};
const NUMERIC_TONE = { color: 'var(--annotation)', bg: 'var(--bg-2)' };

function ModeTag({ tag }: { tag: string }) {
  const tone = TAG_TONE[tag] ?? NUMERIC_TONE;
  return (
    <span className="mono rounded px-1 text-[9px] leading-[14px]" style={{ color: tone.color, background: tone.bg }}>{tag}</span>
  );
}

export function TypedField({
  label, sub, descriptor, value, onChange, provenance, hint,
}: {
  label: string;
  sub?: string;
  descriptor: ControlDescriptor;
  value: AttrValue;
  onChange: (v: AttrValue) => void;
  provenance?: Provenance;
  hint?: string;
}) {
  const locked = provenance === 'locked';
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <span className="uc">{label}</span>
        <ModeTag tag={descriptor.tag} />
        {provenance === 'derived' && <span className="tag" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }} title="pre-filled from a default — you can change it">pre-filled</span>}
        {locked && <span className="tag" title="fixed at take-off">🔒 fixed</span>}
      </span>
      {sub && <span className="mono text-[9px] text-ink-4">{sub}</span>}
      <Control descriptor={descriptor} value={value} onChange={onChange} disabled={locked} ariaLabel={label} />
      {hint && <span className="text-[10px] text-ink-3">{hint}</span>}
    </label>
  );
}

export function Control({
  descriptor, value, onChange, disabled, ariaLabel,
}: {
  descriptor: ControlDescriptor;
  value: AttrValue;
  onChange: (v: AttrValue) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  switch (descriptor.control) {
    case 'select': return <SelectControl options={descriptor.options} value={String(value ?? '')} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} />;
    case 'chips': return <ChipsControl options={descriptor.options} value={toStringArray(value)} onChange={onChange} disabled={disabled} />;
    case 'tokens': return <TokenInput value={toStringArray(value)} onChange={onChange} disabled={disabled} />;
    case 'number': return <NumberControl unit={descriptor.unit} min={descriptor.min} max={descriptor.max} step={descriptor.step} value={typeof value === 'number' ? value : 0} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} />;
    case 'band': return <BandControl unit={descriptor.unit} bands={descriptor.bands} value={typeof value === 'number' ? value : 0} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} />;
    case 'toggle': return <ToggleControl on={value === true} onChange={onChange} disabled={disabled} ariaLabel={ariaLabel} />;
    case 'text': return <TextControl value={String(value ?? '')} onChange={onChange} suggestions={descriptor.suggestions} disabled={disabled} ariaLabel={ariaLabel} />;
    case 'advanced': return <AdvancedControl reason={descriptor.reason} />;
  }
}

function toStringArray(v: AttrValue): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

// ── pick from a known set ──
export function SelectControl({ options, value, onChange, disabled, ariaLabel }: { options: Option[]; value: string; onChange: (v: string) => void; disabled?: boolean; ariaLabel?: string }) {
  // keep the current value selectable even if no option enumerates it
  const all = options.some((o) => o.value === value) || value === '' ? options : [{ value, label: value }, ...options];
  return (
    <select className="input" aria-label={ariaLabel} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {all.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── multi-select from a known set (gating) ──
export function ChipsControl({ options, value, onChange, disabled }: { options: Option[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  // surface any selected values that aren't in the known set so nothing is hidden
  const extra = value.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v }));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-1">
      {[...options, ...extra].map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" disabled={disabled} onClick={() => toggle(o.value)} className="tag" style={{ cursor: disabled ? 'default' : 'pointer', color: on ? 'var(--accent)' : 'var(--ink-3)', background: on ? 'var(--accent-soft)' : 'var(--bg-2)' }}>{o.label}</button>
        );
      })}
      {options.length === 0 && extra.length === 0 && <span className="text-[11px] text-ink-4">no options</span>}
    </div>
  );
}

// ── free-entry removable chips (no known set, e.g. sub-assemblies) ──
export function TokenInput({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange(Array.from(new Set([...value, ...parts])));
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.map((t) => (
        <span key={t} className="tag inline-flex items-center gap-1" style={{ background: 'var(--bg-2)' }}>
          {t}
          {!disabled && <button type="button" aria-label={`remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} style={{ color: 'var(--ink-3)' }}>×</button>}
        </span>
      ))}
      {!disabled && (
        <input className="input" style={{ width: 110 }} value={draft} placeholder="+ add"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add} />
      )}
    </div>
  );
}

// ── bounded number with unit ──
export function NumberControl({ unit, min, max, step, value, onChange, disabled, ariaLabel }: { unit?: string; min?: number; max?: number; step?: number; value: number; onChange: (v: number) => void; disabled?: boolean; ariaLabel?: string }) {
  const clamp = (n: number) => {
    let r = Number.isFinite(n) ? n : 0;
    if (min != null) r = Math.max(min, r);
    if (max != null) r = Math.min(max, r);
    return r;
  };
  const bounded = min != null && max != null;
  return (
    <div className="flex items-center gap-1.5">
      <input className="input w-full" inputMode="numeric" aria-label={ariaLabel} value={value} disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="mono text-[11px] text-ink-3">{unit}</span>}
      {bounded && <span className="mono whitespace-nowrap text-[9px] text-ink-4">{min}–{max}</span>}
    </div>
  );
}

// ── banded distance: a number whose value buckets into one of a fixed set of ranges ──
export function BandControl({ unit, bands, value, onChange, disabled, ariaLabel }: { unit: string; bands: { range: [number, number]; sku_key: string }[]; value: number; onChange: (v: number) => void; disabled?: boolean; ariaLabel?: string }) {
  const active = activeBandIndex(value, bands);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input className="input w-full" inputMode="numeric" aria-label={ariaLabel} value={value} disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
        <span className="mono text-[11px] text-ink-3">{unit}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {bands.map((b, i) => {
          const on = i === active;
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onChange(b.range[0])} className="tag" title={`SKU key ${b.sku_key}`}
              style={{ cursor: disabled ? 'default' : 'pointer', color: on ? 'var(--accent)' : 'var(--ink-3)', background: on ? 'var(--accent-soft)' : 'var(--bg-2)' }}>
              {b.range[0]}–{b.range[1]}
            </button>
          );
        })}
      </div>
      {active < 0 && (
        <span className="mono rounded px-1 text-[10px]" style={{ color: 'var(--warn)', background: 'var(--warn-soft)' }}>
          outside all bands — no SKU will match
        </span>
      )}
    </div>
  );
}

// ── boolean ──
export function ToggleControl({ on, onChange, disabled, ariaLabel }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; ariaLabel?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={ariaLabel} disabled={disabled} onClick={() => onChange(!on)} className="flex items-center gap-1.5">
      <span className="flex h-4 w-7 items-center rounded-full px-0.5 transition-colors" style={{ background: on ? 'var(--accent)' : 'var(--ink-5)' }}>
        <span className="h-3 w-3 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
      </span>
      <span className="text-[11px] text-ink-2">{on ? 'on' : 'off'}</span>
    </button>
  );
}

// ── free text (plainest, optional suggestions) ──
export function TextControl({ value, onChange, suggestions, disabled, ariaLabel }: { value: string; onChange: (v: string) => void; suggestions?: string[]; disabled?: boolean; ariaLabel?: string }) {
  const listId = suggestions && suggestions.length ? `dl-${ariaLabel ?? 'x'}-${suggestions.length}` : undefined;
  return (
    <>
      <input className="input text w-full" aria-label={ariaLabel} value={value} disabled={disabled} list={listId} onChange={(e) => onChange(e.target.value)} />
      {listId && <datalist id={listId}>{suggestions!.map((s) => <option key={s} value={s} />)}</datalist>}
    </>
  );
}

// ── advanced / not scalar-editable here ──
export function AdvancedControl({ reason }: { reason: string }) {
  return (
    <div className="rounded border border-dashed px-2 py-1 text-[11px] text-ink-3" style={{ borderColor: 'var(--line-2)' }}>
      advanced — {reason}; applied via defaults / authoring
    </div>
  );
}
