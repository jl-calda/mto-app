'use client';

// Shared building blocks for the system authoring wizard.

import type { ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="uc">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-ink-3">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input className={`input w-full${mono ? '' : ' text'}`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input className="input w-full" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />;
}

type Opt<T> = T | { value: T; label: string };
export function Select<T extends string>({ value, options, onChange }: { value: T; options: readonly Opt<T>[]; onChange: (v: T) => void }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o as T, label: o as string } : (o as { value: T; label: string })));
  return (
    <select className="input text w-full" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-1.5">
      <span className="flex h-4 w-7 items-center rounded-full px-0.5 transition-colors" style={{ background: on ? 'var(--accent)' : 'var(--ink-5)' }}>
        <span className="h-3 w-3 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
      </span>
      {label && <span className="text-[11px] text-ink-2">{label}</span>}
    </button>
  );
}

export function Card({ title, action, children }: { title?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      {title && (
        <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
          <h3 className="m-0 text-[13px] font-semibold">{title}</h3>
          {action}
        </header>
      )}
      <div className="p-3.5">{children}</div>
    </section>
  );
}

export function Stub({ title, owner, children }: { title: string; owner: string; children?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-dashed border-line-2 bg-panel-2">
      <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <h3 className="m-0 text-[13px] font-semibold text-ink-2">{title}</h3>
        <span className="tag" style={{ color: 'var(--annotation)' }}>owned by {owner}</span>
      </header>
      <div className="p-3.5 text-[12px] text-ink-3">{children}</div>
    </section>
  );
}
