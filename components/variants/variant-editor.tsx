'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AttrValue, Variant, Visual } from '@/lib/types';
import { Field, Select, TextInput } from '@/components/system-wizard/parts';
import { VisualEditor } from '@/components/visual-editor';
import { saveVariantAction, deleteVariantAction } from '@/app/variants/actions';

const STATUS = ['active', 'deprecated', 'archived'] as const;

function coerce(v: string): AttrValue {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v !== '' && !Number.isNaN(Number(v))) return Number(v);
  return v;
}

export function VariantEditor({ variant, isNew, onClose }: { variant: Variant; isNew: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(variant.name);
  const [description, setDescription] = useState(variant.description ?? '');
  const [status, setStatus] = useState(variant.status);
  const [visual, setVisual] = useState<Visual | undefined>(variant.visual);
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>(
    Object.entries(variant.common_attributes).map(([k, v]) => ({ key: k, value: String(v) })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const setAttr = (i: number, patch: Partial<{ key: string; value: string }>) =>
    setAttrs((a) => a.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  async function save() {
    setBusy(true);
    setError(undefined);
    const common_attributes = Object.fromEntries(attrs.filter((a) => a.key.trim()).map((a) => [a.key.trim(), coerce(a.value)]));
    const payload: Variant = {
      ...variant,
      name,
      description: description || undefined,
      status,
      visual,
      common_attributes,
      // keep the current version's snapshot in step (full version history → Brief 10)
      versions: variant.versions.map((v) => (v.version === variant.current_version ? { ...v, common_attributes } : v)),
    };
    const res = await saveVariantAction(payload);
    setBusy(false);
    if (res.ok) { router.refresh(); onClose(); }
    else setError(res.error ?? 'save failed');
  }

  async function remove() {
    if (!confirm(`Delete ${name}?`)) return;
    setBusy(true);
    const res = await deleteVariantAction(variant.id);
    setBusy(false);
    if (res.ok) { router.refresh(); onClose(); }
    else setError(res.error ?? 'delete failed');
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-md border border-accent-line bg-panel p-3.5" style={{ background: 'var(--selected)' }}>
        <h3 className="m-0 text-[14px] font-semibold">{isNew ? 'New variant' : 'Edit variant'}</h3>
        <button className="btn sm" onClick={onClose}>Close</button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <div className="flex flex-col gap-2.5 p-3.5">
          <Field label="visual"><VisualEditor value={visual} name={name} onChange={setVisual} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="name"><TextInput value={name} onChange={setName} /></Field>
            <Field label="status"><Select value={status} options={STATUS} onChange={setStatus} /></Field>
          </div>
          <Field label="description"><TextInput value={description} onChange={setDescription} /></Field>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
          <h3 className="m-0 text-[13px] font-semibold">Common attributes</h3>
          <button className="btn sm" onClick={() => setAttrs((a) => [...a, { key: '', value: '' }])}>Add attribute</button>
        </header>
        <div className="flex flex-col gap-2 p-3.5">
          {attrs.map((row, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
              <Field label="key"><TextInput mono value={row.key} onChange={(v) => setAttr(i, { key: v })} /></Field>
              <Field label="value" hint="true/false or number coerced"><TextInput mono value={row.value} onChange={(v) => setAttr(i, { value: v })} /></Field>
              <button className="btn sm danger" onClick={() => setAttrs((a) => a.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {attrs.length === 0 && <div className="text-[12px] text-ink-3">No attributes.</div>}
          <div className="mt-1 rounded p-2.5 text-[11px] text-ink-2" style={{ background: 'var(--bg-2)' }}>
            Snapshot semantics: take-offs freeze a version at use — these edits don&apos;t rewrite saved take-offs. Version history / diff / pin policy: <span className="mono text-annotation">v2 (Brief 10)</span>.
          </div>
        </div>
      </div>

      {error && <div className="mono text-[11px] text-err">{error}</div>}
      <div className="flex items-center justify-between">
        {!isNew ? <button className="btn sm danger" onClick={remove} disabled={busy}>Delete</button> : <span />}
        <button className="btn primary sm" onClick={save} disabled={busy || !name.trim()}>{busy ? 'Saving…' : isNew ? 'Create' : 'Save'}</button>
      </div>
    </section>
  );
}
