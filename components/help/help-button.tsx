'use client';

// The (i) trigger placed next to page titles and concept section headers. Opens
// the Guide panel deep-linked to a specific concept. Takes only string props, so
// it can be dropped straight into server components.

import { Icon } from '@/components/chrome';
import { useHelp } from './help-context';
import { CONCEPT_BY_ID, type ConceptId } from '@/lib/help/content';

export function HelpButton({ topic, label }: { topic: ConceptId; label?: string }) {
  const { openTopic } = useHelp();
  return (
    <button
      type="button"
      onClick={() => openTopic(topic)}
      aria-label={label ?? `What is a ${CONCEPT_BY_ID[topic]?.label ?? topic}?`}
      title={label ?? `What is a ${CONCEPT_BY_ID[topic]?.label ?? topic}?`}
      className="inline-flex shrink-0 items-center justify-center align-middle text-ink-3 hover:text-accent"
      style={{ width: 18, height: 18 }}
    >
      <Icon.Info />
    </button>
  );
}
