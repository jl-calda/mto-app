'use client';

// The Inputs → Outputs dependency graph: two columns of subgroup "boxes" with a
// flow arrow between them, then a full-width "Materials & gating" breakdown that
// shows *how* each input gates / counts / SKU-keys every material a model emits.
// Box headers deep-link to the glossary concept. Driven entirely by a TreeModel.

import { useHelp } from './help-context';
import { CONCEPT_BY_ID } from '@/lib/help/content';
import type { MaterialNode, SubGroup, Tag, TreeGroup, TreeModel } from '@/lib/help/tree';

function tagColor(t: Tag): string {
  if (t.kind) return CONCEPT_BY_ID[t.kind].color;
  switch (t.tone) {
    case 'qty': return 'var(--ok)';
    case 'sku': return 'var(--accent)';
    case 'gate': return 'var(--ink-3)';
    default: return 'var(--ink-4)';
  }
}

function TagChip({ t }: { t: Tag }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-line px-1 py-px text-[9px] leading-none text-ink-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tagColor(t) }} />
      {t.text}
    </span>
  );
}

function TagRow({ tags }: { tags?: Tag[] }) {
  if (!tags || tags.length === 0) return null;
  return <div className="mt-0.5 flex flex-wrap gap-1">{tags.map((t, i) => <TagChip key={i} t={t} />)}</div>;
}

function Box({ sg }: { sg: SubGroup }) {
  const { openTopic } = useHelp();
  const color = sg.kind ? CONCEPT_BY_ID[sg.kind].color : 'var(--ink-4)';
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      <button
        type="button"
        disabled={!sg.kind}
        onClick={() => sg.kind && openTopic(sg.kind)}
        className="flex w-full items-center gap-1.5 border-b border-line bg-panel-2 px-2 py-1 text-left"
        title={sg.kind ? `What is a ${sg.label.replace(/s$/, '')}?` : undefined}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="flex-1 text-[12px] font-medium">{sg.label}</span>
        {sg.items.length > 0 && <span className="mono text-[10px] text-ink-4">{sg.items.length}</span>}
      </button>
      <div className="flex flex-col gap-1.5 p-1.5">
        {sg.items.map((it, i) => (
          <div key={i} className="leading-tight">
            <div className="text-[11px] text-ink">{it.label}</div>
            {it.detail && <div className="mono text-[9px] text-ink-3">{it.detail}</div>}
            {it.chips && it.chips.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {it.chips.map((c, j) => <span key={j} className="tag" style={{ fontSize: 9 }}>{c}</span>)}
              </div>
            )}
            <TagRow tags={it.tags} />
          </div>
        ))}
        {sg.items.length === 0 && <div className="text-[10px] text-ink-4">—</div>}
      </div>
    </div>
  );
}

function Column({ group }: { group: TreeGroup }) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
      <div className="uc">{group.label}</div>
      {group.subgroups.map((sg) => <Box key={sg.id} sg={sg} />)}
    </div>
  );
}

function MaterialRow({ node }: { node: MaterialNode }) {
  return (
    <div className="border-b border-line px-2 py-1.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-ink">{node.label}</span>
        {node.detail && <span className="mono shrink-0 text-[9px] text-ink-3">{node.detail}</span>}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="uc text-ink-4" style={{ fontSize: 8 }}>when</span>
        {node.when.map((t, i) => <TagChip key={i} t={t} />)}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {node.qty && (
          <span className="inline-flex items-center gap-1 rounded border border-line px-1 py-px text-[9px] leading-none text-ink-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--ok)' }} />
            {node.qty}
          </span>
        )}
        {node.skuFrom && node.skuFrom.length > 0 && (
          <>
            <span className="uc text-ink-4" style={{ fontSize: 8 }}>SKU ←</span>
            {node.skuFrom.map((t, i) => <TagChip key={i} t={t} />)}
          </>
        )}
      </div>
    </div>
  );
}

function MaterialsBreakdown({ nodes }: { nodes: MaterialNode[] }) {
  // Group rows by model, preserving first-seen order.
  const models: string[] = [];
  for (const n of nodes) if (!models.includes(n.model)) models.push(n.model);
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-2 py-1">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CONCEPT_BY_ID.mto.color }} />
        <span className="flex-1 text-[12px] font-medium">Materials &amp; gating</span>
        <span className="mono text-[10px] text-ink-4">{nodes.length}</span>
      </div>
      {models.map((model) => (
        <div key={model}>
          {models.length > 1 && (
            <div className="mono border-b border-line bg-panel-2 px-2 py-0.5 text-[9px] text-ink-3">{model}</div>
          )}
          {nodes.filter((n) => n.model === model).map((n) => <MaterialRow key={n.id} node={n} />)}
        </div>
      ))}
    </div>
  );
}

export function DependencyGraph({ model }: { model: TreeModel }) {
  const inputs = model.groups.find((g) => g.id === 'inputs');
  const outputs = model.groups.find((g) => g.id === 'outputs');
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-panel p-3">
      {(model.title || model.subtitle) && (
        <div>
          {model.title && <div className="text-[13px] font-semibold">{model.title}</div>}
          {model.subtitle && <div className="mono text-[10px] text-ink-3">{model.subtitle}</div>}
        </div>
      )}
      <div className="flex items-stretch gap-1.5 overflow-x-auto">
        {inputs && <Column group={inputs} />}
        <div className="flex shrink-0 items-center px-0.5 text-[14px] text-ink-4" aria-hidden>→</div>
        {outputs && <Column group={outputs} />}
      </div>
      {model.materials && model.materials.length > 0 && <MaterialsBreakdown nodes={model.materials} />}
    </div>
  );
}
