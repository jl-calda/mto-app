'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AttrValue, ModifierType, PropertyInstance, System, SystemVariantRef } from '@/lib/types';
import { Card, Field, NumberInput, Select, TextInput, Toggle } from './parts';

const COL_KINDS = ['bool', 'enum', 'distance'] as const;
type ColKind = (typeof COL_KINDS)[number];

function rowName(r: SystemVariantRef): string {
  return r.kind === 'local' ? r.name : r.variant_id;
}
function blankColType(kind: ColKind): ModifierType {
  return kind === 'enum' ? { kind: 'enum', values: ['a', 'b'] } : { kind };
}

export function Step3Variants({ system, setSystem }: { system: System; setSystem: Dispatch<SetStateAction<System>> }) {
  const [sel, setSel] = useState(0);
  const cols = system.variants.attribute_columns;
  const rows = system.variants.rows;

  // ── attribute columns ──
  const addCol = () => setSystem((s) => ({ ...s, variants: { ...s.variants, attribute_columns: [...s.variants.attribute_columns, { name: `attr_${s.variants.attribute_columns.length + 1}`, type: { kind: 'bool' } }] } }));
  const updateCol = (i: number, patch: Partial<{ name: string; type: ModifierType }>) =>
    setSystem((s) => ({ ...s, variants: { ...s.variants, attribute_columns: s.variants.attribute_columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) } }));
  const removeCol = (i: number) =>
    setSystem((s) => ({ ...s, variants: { ...s.variants, attribute_columns: s.variants.attribute_columns.filter((_, j) => j !== i) } }));

  // ── variant rows ──
  const addRow = () => setSystem((s) => ({ ...s, variants: { ...s.variants, rows: [...s.variants.rows, { kind: 'local', name: `Variant ${s.variants.rows.length + 1}`, attributes: {} }] } }));
  const removeRow = (i: number) => setSystem((s) => ({ ...s, variants: { ...s.variants, rows: s.variants.rows.filter((_, j) => j !== i) } }));
  const renameRow = (i: number, name: string) =>
    setSystem((s) => ({ ...s, variants: { ...s.variants, rows: s.variants.rows.map((r, j) => (j === i && r.kind === 'local' ? { ...r, name } : r)) } }));
  const setAttr = (i: number, col: string, value: AttrValue) =>
    setSystem((s) => ({ ...s, variants: { ...s.variants, rows: s.variants.rows.map((r, j) => (j === i && r.kind === 'local' ? { ...r, attributes: { ...r.attributes, [col]: value } } : r)) } }));

  // ── criteria ──
  const addCrit = () => setSystem((s) => ({ ...s, criteria: [...s.criteria, { library_id: `criterion_${s.criteria.length + 1}`, default_value: '' }] }));
  const updateCrit = (i: number, patch: Partial<{ library_id: string; default_value: AttrValue }>) =>
    setSystem((s) => ({ ...s, criteria: s.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const removeCrit = (i: number) => setSystem((s) => ({ ...s, criteria: s.criteria.filter((_, j) => j !== i) }));

  // read-only: which properties apply to a variant (the gating matrix is edited in the Properties step)
  const isOn = (p: PropertyInstance, name: string) => !p.applies_to_variants?.length || p.applies_to_variants.includes(name);

  const selRow = rows[sel];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4">
      <div className="flex flex-col gap-3">
        {/* attribute columns */}
        <Card title={`Attribute columns — ${cols.length}`} action={<button type="button" className="btn sm" onClick={addCol}>Add column</button>}>
          <div className="flex flex-col gap-2">
            {cols.map((c, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_auto] items-end gap-2">
                <Field label="name"><TextInput mono value={c.name} onChange={(v) => updateCol(i, { name: v })} /></Field>
                <Field label="type"><Select value={c.type.kind as ColKind} options={COL_KINDS} onChange={(v) => updateCol(i, { type: blankColType(v) })} /></Field>
                {c.type.kind === 'enum'
                  ? <Field label="values"><TextInput value={c.type.values.join(', ')} onChange={(v) => updateCol(i, { type: { kind: 'enum', values: v.split(',').map((x) => x.trim()).filter(Boolean) } })} /></Field>
                  : <div />}
                <button type="button" className="btn sm danger" onClick={() => removeCol(i)}>×</button>
              </div>
            ))}
            {cols.length === 0 && <div className="text-[12px] text-ink-3">No attribute columns yet.</div>}
          </div>
        </Card>

        {/* variant rows */}
        <Card title={`Variants — ${rows.length}`} action={<button type="button" className="btn primary sm" onClick={addRow}>Add variant</button>}>
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={i} className="rounded border p-2.5" style={{ borderColor: i === sel ? 'var(--accent-line)' : 'var(--line)' }} onClick={() => setSel(i)}>
                <div className="flex items-center gap-2">
                  {r.kind === 'local'
                    ? <input className="input text w-full" value={r.name} onChange={(e) => renameRow(i, e.target.value)} />
                    : <span className="mono text-[12px]">library · {r.variant_id} @v{r.pinned_version}</span>}
                  <button type="button" className="btn sm danger" onClick={() => removeRow(i)}>×</button>
                </div>
                {r.kind === 'local' && cols.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {cols.map((c) => (
                      <Field key={c.name} label={c.name}>
                        {c.type.kind === 'bool'
                          ? <div className="pt-1"><Toggle on={!!r.attributes[c.name]} onChange={(v) => setAttr(i, c.name, v)} /></div>
                          : c.type.kind === 'enum'
                            ? <Select value={String(r.attributes[c.name] ?? c.type.values[0])} options={c.type.values} onChange={(v) => setAttr(i, c.name, v)} />
                            : <NumberInput value={Number(r.attributes[c.name]) || 0} onChange={(v) => setAttr(i, c.name, v)} />}
                      </Field>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {rows.length === 0 && <div className="text-[12px] text-ink-3">Add at least one variant.</div>}
          </div>
        </Card>

        {/* criteria picker */}
        <Card title={`Criteria — ${system.criteria.length}`} action={<button type="button" className="btn sm" onClick={addCrit}>Add criterion</button>}>
          <div className="flex flex-col gap-2">
            {system.criteria.map((c, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-end gap-2">
                <Field label="library id"><TextInput mono value={c.library_id} onChange={(v) => updateCrit(i, { library_id: v })} /></Field>
                <Field label="default"><TextInput value={String(c.default_value ?? '')} onChange={(v) => updateCrit(i, { default_value: v })} /></Field>
                <button type="button" className="btn sm danger" onClick={() => removeCrit(i)}>×</button>
              </div>
            ))}
            {system.criteria.length === 0 && <div className="text-[12px] text-ink-3">No criteria.</div>}
          </div>
        </Card>
      </div>

      {/* sticky variant inspector */}
      <aside className="sticky top-[60px]">
        <Card title="Variant inspector">
          {selRow ? (
            <div className="flex flex-col gap-2.5">
              <div className="text-[14px] font-semibold">{rowName(selRow)}</div>
              <div>
                <div className="uc mb-1">attributes</div>
                {selRow.kind === 'local' && Object.keys(selRow.attributes).length ? (
                  <div className="flex flex-col gap-1">
                    {Object.entries(selRow.attributes).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between border-b border-line py-1 last:border-b-0">
                        <span className="uc">{k}</span><span className="mono text-[12px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[12px] text-ink-3">none</div>}
              </div>
              <div>
                <div className="uc mb-1">applicable properties</div>
                <div className="flex flex-wrap gap-1">
                  {system.properties.filter((p) => isOn(p, rowName(selRow))).map((p) => <span key={p.name} className="tag">{p.name}</span>)}
                  {system.properties.filter((p) => isOn(p, rowName(selRow))).length === 0 && <span className="text-[12px] text-ink-3">none</span>}
                </div>
              </div>
            </div>
          ) : <div className="text-[12px] text-ink-3">Select a variant.</div>}
        </Card>
      </aside>
    </div>
  );
}
