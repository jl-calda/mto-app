'use client';

// The Inputs → Outputs dependency graph: two columns of subgroup "boxes" with a
// flow arrow between them. Each box header deep-links to its glossary concept.
// Driven entirely by a TreeModel (the current system, or the generic fallback).

import { useHelp } from './help-context';
import { CONCEPT_BY_ID } from '@/lib/help/content';
import type { SubGroup, TreeGroup, TreeModel } from '@/lib/help/tree';

const MAX_ITEMS = 6;

function Box({ sg }: { sg: SubGroup }) {
  const { openTopic } = useHelp();
  const color = sg.kind ? CONCEPT_BY_ID[sg.kind].color : 'var(--ink-4)';
  const shown = sg.items.slice(0, MAX_ITEMS);
  const extra = sg.items.length - shown.length;
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
      <div className="flex flex-col gap-1 p-1.5">
        {shown.map((it, i) => (
          <div key={i} className="leading-tight">
            <div className="text-[11px] text-ink">{it.label}</div>
            {it.detail && <div className="mono text-[9px] text-ink-3">{it.detail}</div>}
            {it.chips && it.chips.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {it.chips.map((c, j) => <span key={j} className="tag" style={{ fontSize: 9 }}>{c}</span>)}
              </div>
            )}
          </div>
        ))}
        {extra > 0 && <div className="mono text-[9px] text-ink-4">+{extra} more</div>}
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

export function DependencyGraph({ model }: { model: TreeModel }) {
  const inputs = model.groups.find((g) => g.id === 'inputs');
  const outputs = model.groups.find((g) => g.id === 'outputs');
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      {(model.title || model.subtitle) && (
        <div className="mb-2">
          {model.title && <div className="text-[13px] font-semibold">{model.title}</div>}
          {model.subtitle && <div className="mono text-[10px] text-ink-3">{model.subtitle}</div>}
        </div>
      )}
      <div className="flex items-stretch gap-1.5 overflow-x-auto">
        {inputs && <Column group={inputs} />}
        <div className="flex shrink-0 items-center px-0.5 text-[14px] text-ink-4" aria-hidden>→</div>
        {outputs && <Column group={outputs} />}
      </div>
    </div>
  );
}
