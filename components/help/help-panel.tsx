'use client';

// The Guide panel body: a "Tree" tab (the Inputs→Outputs dependency graph of the
// current screen) and a "Glossary" tab (the four-way comparison + concept cards).
// (i)/node clicks deep-link to the Glossary tab focused on a concept.

import { forwardRef, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/chrome';
import { useHelp } from './help-context';
import { DependencyGraph } from './dependency-graph';
import { GENERIC_TREE } from '@/lib/help/tree';
import { COMPARE_ROWS, CONCEPTS, type Concept } from '@/lib/help/content';

export function HelpPanel() {
  const { topic, close, subject, view, setView } = useHelp();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (view !== 'glossary' || !topic) return;
    cardRefs.current[topic]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [topic, view]);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="m-0 text-[13px] font-semibold">Guide</h3>
          <div className="flex gap-0.5">
            {(['tree', 'glossary'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setView(t)}
                className="rounded px-2 py-0.5 text-[11px] capitalize"
                style={{ background: view === t ? 'var(--selected)' : 'var(--bg-2)', color: view === t ? 'var(--accent)' : 'var(--ink-2)', fontWeight: view === t ? 600 : 400 }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn ghost sm" onClick={close} aria-label="Close guide"><Icon.X /></button>
      </header>

      {view === 'tree' ? (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
          <p className="m-0 text-[12px] text-ink-2">
            What goes <b>in</b> (variants, modifiers, criteria, properties) and what comes <b>out</b> (models → MTO){subject ? ' for this system' : ''}. Click a box to read about it.
          </p>
          <DependencyGraph model={subject ?? GENERIC_TREE} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3.5">
          <ComparisonTable />
          <div className="flex flex-col gap-2">
            {CONCEPTS.map((c) => (
              <ConceptCard key={c.id} concept={c} defaultOpen={c.id === topic} ref={(el) => { cardRefs.current[c.id] = el; }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonTable() {
  const cols: { key: keyof (typeof COMPARE_ROWS)[number]; label: string }[] = [
    { key: 'variant', label: 'Variant' },
    { key: 'modifier', label: 'Modifier' },
    { key: 'criterion', label: 'Criterion' },
    { key: 'property', label: 'Property' },
  ];
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      <div className="border-b border-line bg-panel-2 px-3 py-2 text-[12px] font-semibold">Variant vs modifier vs criterion vs property</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="uc border-b border-line px-2 py-1.5 text-left" />
              {cols.map((c) => <th key={c.key} className="uc border-b border-line px-2 py-1.5 text-left">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r.aspect}>
                <td className="border-b border-line px-2 py-1.5 text-ink-3">{r.aspect}</td>
                {cols.map((c) => <td key={c.key} className="border-b border-line px-2 py-1.5 text-ink-2">{r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ConceptCard = forwardRef<HTMLDivElement, { concept: Concept; defaultOpen: boolean }>(
  function ConceptCard({ concept, defaultOpen }, ref) {
    const [expanded, setExpanded] = useState(defaultOpen);
    // Re-expand when a later deep-link targets this card.
    useEffect(() => { if (defaultOpen) setExpanded(true); }, [defaultOpen]);

    return (
      <div ref={ref} className="overflow-hidden rounded-md border border-line bg-panel" style={{ scrollMarginTop: 8 }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
          aria-expanded={expanded}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: concept.color }} />
          <span className="flex-1 text-[13px] font-medium">{concept.label}</span>
          <span className="text-ink-3">{expanded ? <Icon.ChevDown /> : <Icon.Chev />}</span>
        </button>
        {expanded && (
          <div className="flex flex-col gap-2 border-t border-line px-3 py-2.5 text-[12px]">
            <div className="text-ink">{concept.oneLiner}</div>
            <Row label="How it differs" value={concept.differs} />
            <Row label="Example" value={concept.example} />
            <Row label="In the MTO" value={concept.feedsMto} />
          </div>
        )}
      </div>
    );
  },
);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uc text-ink-4">{label}</div>
      <div className="text-ink-2">{value}</div>
    </div>
  );
}
