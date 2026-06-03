'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Material, System } from '@/lib/types';
import { deriveRuleContext, type XRef } from '@/lib/engine';
import { saveSystemAction } from '@/app/systems/actions';
import { useHelp } from '@/components/help/help-context';
import { buildSystemTree } from '@/lib/help/tree';
import { Step1Primitive } from './Step1Primitive';
import { Step2Modifiers } from './Step2Modifiers';
import { Step3Variants } from './Step3Variants';
import { PropertiesEditor } from './PropertiesEditor';
import { Card } from './parts';
import { VisualEditor } from '@/components/visual-editor';

// Authoring order: measure → families → tuning → quantities. (Step component
// filenames keep their original numbering; render order below is what matters.)
const STEPS = ['Primitive', 'Variants & criteria', 'Modifiers', 'Properties'];

function xrefLabel(x: XRef): string {
  switch (x.kind) {
    case 'property': return `prop:${x.name}`;
    case 'property_length': return `len:${x.name}`;
    case 'derived': return `derived:${x.name}`;
    case 'chain': return `chain:${x.role}`;
    case 'primitive_input': return 'primitive_input';
    case 'algorithm_output': return `algo:${x.algo}.${x.field}`;
  }
}

function CtxList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="uc mb-1">{label} · {items.length}</div>
      <div className="flex flex-col gap-0.5">
        {items.map((it) => <span key={it} className="mono truncate text-[11px]">{it}</span>)}
        {items.length === 0 && <span className="text-[11px] text-ink-3">—</span>}
      </div>
    </div>
  );
}

export function SystemWizard({ initial, isNew, materials = [] }: { initial: System; isNew?: boolean; materials?: Material[] }) {
  const router = useRouter();
  const [system, setSystem] = useState<System>(initial);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const ctx = useMemo(() => deriveRuleContext(system), [system]);

  // Publish the live draft into the Guide so its dependency tree updates as you edit.
  const { setSubject } = useHelp();
  useEffect(() => {
    setSubject(buildSystemTree(system, materials));
    return () => setSubject(null);
  }, [system, materials, setSubject]);

  async function save() {
    setStatus('saving');
    const res = await saveSystemAction(system);
    if (res.ok) {
      setStatus('saved');
      router.push(`/systems/${res.id}`);
    } else {
      setStatus('error');
      setError(res.error);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      {/* header */}
      <div className="flex flex-col gap-3 border-b border-line pb-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-full sm:w-[300px] sm:shrink-0"><VisualEditor value={system.visual} name={system.name} onChange={(v) => setSystem((s) => ({ ...s, visual: v }))} /></div>
          <div className="min-w-0 flex-1">
            <input className="input text w-full max-w-[480px] text-[18px] font-semibold" style={{ height: 'auto', padding: '4px 8px' }} value={system.name} onChange={(e) => setSystem((s) => ({ ...s, name: e.target.value }))} placeholder="System name" />
            <input className="input text mt-1.5 w-full max-w-[480px]" value={system.description ?? ''} onChange={(e) => setSystem((s) => ({ ...s, description: e.target.value }))} placeholder="Description (optional)" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'error' && <span className="mono text-[10px] text-err">{error ?? 'save failed'}</span>}
          {status === 'saved' && <span className="mono text-[10px] text-ok">● saved</span>}
          <Link href={isNew ? '/systems' : `/systems/${system.id}`} className="btn sm">Cancel</Link>
          <button className="btn primary sm" onClick={save} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : isNew ? 'Create system' : 'Save'}</button>
        </div>
      </div>

      {/* stepper */}
      <div className="flex flex-wrap items-center gap-1.5 py-3.5">
        {STEPS.map((label, i) => {
          const on = i === step;
          const done = i < step;
          return (
            <button key={i} onClick={() => setStep(i)} className="flex items-center gap-2 rounded px-3 py-1.5 text-[12px]" style={{ background: on ? 'var(--selected)' : 'transparent', color: on ? 'var(--accent)' : 'var(--ink-2)', fontWeight: on ? 600 : 400 }}>
              <span className="mono flex h-5 w-5 items-center justify-center rounded-full text-[10px]" style={{ background: on ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--bg-2)', color: on || done ? '#fff' : 'var(--ink-3)' }}>{i + 1}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* step body */}
      <div className="pb-4">
        {step === 0 && <Step1Primitive system={system} setSystem={setSystem} />}
        {step === 1 && <Step3Variants system={system} setSystem={setSystem} />}
        {step === 2 && <Step2Modifiers system={system} setSystem={setSystem} />}
        {step === 3 && <PropertiesEditor system={system} setSystem={setSystem} />}
      </div>

      {/* nav */}
      <div className="flex items-center justify-between border-t border-line py-3">
        <button className="btn sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
        <div className="mono text-[11px] text-ink-3">step {step + 1} of {STEPS.length}</div>
        {step < STEPS.length - 1
          ? <button className="btn sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next →</button>
          : <button className="btn primary sm" onClick={save} disabled={status === 'saving'}>{isNew ? 'Create system' : 'Save'}</button>}
      </div>

      {/* deriveRuleContext preview — the authoring↔runtime contract the X-picker consumes */}
      <div className="pb-10 pt-2">
        <Card title="Rule context preview — SYSTEM_CTX the model/rule X-picker will offer">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <CtxList label="variants" items={ctx.variants} />
            <CtxList label="criteria" items={Object.keys(ctx.criteria)} />
            <CtxList label="properties" items={ctx.properties.map((p) => `${p.name} · ${p.archetype}`)} />
            <CtxList label="modifiers" items={ctx.modifiers} />
          </div>
          <div className="mt-3">
            <div className="uc mb-1">X-refs · {ctx.xrefs.length}</div>
            <div className="flex flex-wrap gap-1">
              {ctx.xrefs.map((x, i) => <span key={i} className="tag">{xrefLabel(x)}</span>)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
