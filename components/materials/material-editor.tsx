'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Material, MaterialUnit } from '@/lib/types';
import { Field, NumberInput, Select, TextInput, Toggle } from '@/components/system-wizard/parts';
import { VisualEditor } from '@/components/visual-editor';
import { saveMaterialAction, deleteMaterialAction } from '@/app/materials/actions';

const UNITS: MaterialUnit[] = ['ea', 'lin.m', 'kg', 'set', 'hr'];

export function MaterialEditor({ material, isNew, onClose }: { material: Material; isNew: boolean; onClose: () => void }) {
  const router = useRouter();
  const [m, setM] = useState<Material>(material);
  const [stockStr, setStockStr] = useState((material.stock_options ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const set = (patch: Partial<Material>) => setM((cur) => ({ ...cur, ...patch }));

  async function save() {
    setBusy(true);
    setError(undefined);
    const stock = stockStr.split(',').map((s) => Number(s.trim())).filter((n) => n > 0);
    const payload: Material = {
      ...m,
      stock_options: m.is_cuttable && stock.length ? stock : undefined,
      cut_allowance: m.is_cuttable ? m.cut_allowance : undefined,
      min_offcut_to_retain: m.is_cuttable ? m.min_offcut_to_retain : undefined,
    };
    const res = await saveMaterialAction(payload);
    setBusy(false);
    if (res.ok) { router.refresh(); onClose(); }
    else setError(res.error ?? 'save failed');
  }

  async function remove() {
    if (!confirm(`Delete ${m.name}?`)) return;
    setBusy(true);
    const res = await deleteMaterialAction(m.id);
    setBusy(false);
    if (res.ok) { router.refresh(); onClose(); }
    else setError(res.error ?? 'delete failed');
  }

  return (
    <div className="sticky top-[60px] overflow-hidden rounded-md border border-line bg-panel" style={{ boxShadow: 'var(--shadow-sticky)' }}>
      <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
        <h3 className="m-0 text-[13px] font-semibold">{isNew ? 'New material' : 'Edit material'}</h3>
        <button className="btn sm" onClick={onClose}>Close</button>
      </header>
      <div className="flex flex-col gap-2.5 p-3.5">
        <Field label="visual"><VisualEditor value={m.visual} name={m.name || m.sku} onChange={(v) => set({ visual: v })} /></Field>
        <Field label="name"><TextInput value={m.name} onChange={(v) => set({ name: v })} placeholder="Material name" /></Field>
        <Field label="sku"><TextInput mono value={m.sku} onChange={(v) => set({ sku: v })} placeholder="VEC-…" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="vendor"><TextInput value={m.vendor} onChange={(v) => set({ vendor: v })} /></Field>
          <Field label="category"><TextInput value={m.category ?? ''} onChange={(v) => set({ category: v })} /></Field>
        </div>
        <Field label="unit"><Select value={m.unit as MaterialUnit} options={UNITS} onChange={(v) => set({ unit: v })} /></Field>
        <Field label="description"><TextInput value={m.description ?? ''} onChange={(v) => set({ description: v })} /></Field>

        <div className="rounded border border-line p-2.5">
          <Toggle on={m.is_cuttable} label="Cuttable (stock cut to length)" onChange={(v) => set({ is_cuttable: v })} />
          {m.is_cuttable && (
            <div className="mt-2.5 flex flex-col gap-2">
              <Field label="stock options · mm (comma)" hint="lengths the engine packs/cuts from"><TextInput mono value={stockStr} onChange={setStockStr} placeholder="3000, 6000" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="cut allowance · mm"><NumberInput value={m.cut_allowance ?? 0} onChange={(v) => set({ cut_allowance: v })} /></Field>
                <Field label="min offcut · mm"><NumberInput value={m.min_offcut_to_retain ?? 0} onChange={(v) => set({ min_offcut_to_retain: v })} /></Field>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mono text-[11px] text-err">{error}</div>}
        <div className="flex items-center justify-between pt-1">
          {!isNew ? <button className="btn sm danger" onClick={remove} disabled={busy}>Delete</button> : <span />}
          <button className="btn primary sm" onClick={save} disabled={busy || !m.name || !m.sku}>{busy ? 'Saving…' : isNew ? 'Create' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
