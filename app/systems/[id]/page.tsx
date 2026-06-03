import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Shell } from '@/components/shell';
import { PrimitiveBadge, Stat } from '@/components/chrome';
import { Visual } from '@/components/visual';
import { AttachmentsEditor } from '@/components/system-wizard/AttachmentsEditor';
import { HelpButton } from '@/components/help/help-button';
import { getRepo } from '@/lib/repo';
import type { ConceptId } from '@/lib/help/content';
import type { PrimitiveKind } from '@/lib/types';

const BADGEABLE: PrimitiveKind[] = ['length', 'height', 'count'];

export default async function SystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const system = await repo.getSystem(id);
  if (!system) notFound();
  const k = system.primitive.kind;

  // other systems available to attach (excluding this one), for the editor's picker
  const otherSystems = (await repo.listSystems()).filter((s) => s.id !== system.id).map((s) => ({ id: s.id, name: s.name }));

  return (
    <Shell navActive="systems" crumbs={[{ label: 'Systems', href: '/systems' }, { label: system.name }]}>
      <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
        <div className="flex items-end justify-between border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            <Visual visual={system.visual} name={system.name} size={40} rounded={6} />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="m-0 text-[22px] font-semibold">{system.name}</h1>
                <HelpButton topic="system" />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {BADGEABLE.includes(k) ? (
                  <PrimitiveBadge kind={k as 'length' | 'height' | 'count'} />
                ) : (
                  <span className="tag">{k}</span>
                )}
                {system.primitive.kind === 'length' && system.primitive.segmentable && (
                  <span className="tag">segmentable</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border-l border-line">
              <Stat k="variants" v={system.variants.rows.length} />
              <Stat k="modifiers" v={system.modifiers.length} />
              <Stat k="criteria" v={system.criteria.length} />
              <Stat k="properties" v={system.properties.length} />
              <Stat k="models" v={system.models.length} />
            </div>
            <Link href={`/systems/${system.id}/edit`} className="btn sm">Edit</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Preview title="Variants" topic="variant">
            {system.variants.rows.map((r, i) => (
              <span key={i} className="tag">{r.kind === 'local' ? r.name : r.variant_id}</span>
            ))}
          </Preview>
          <Preview title="Modifiers" topic="modifier">
            {system.modifiers.map((m) => (
              <span key={m.name} className="tag">
                {m.name} <span className="text-ink-4">· {m.group}</span>
              </span>
            ))}
          </Preview>
          <Preview title="Criteria" topic="criterion">
            {system.criteria.map((c) => (
              <span key={c.library_id} className="tag">{c.library_id}</span>
            ))}
          </Preview>
          <Preview title="Properties" topic="property">
            {system.properties.map((p) => (
              <span key={p.name} className="tag">
                {p.name} <span className="text-ink-4">· {p.archetype}</span>
              </span>
            ))}
          </Preview>
        </div>

        <section className="overflow-hidden rounded-md border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
            <h3 className="m-0 text-[13px] font-semibold">Models</h3>
            <Link href={`/models/new?system=${system.id}`} className="btn primary sm">New model</Link>
          </header>
          {system.models.map((m) => (
            <Link
              key={m.id}
              href={`/models/${m.id}`}
              className="flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-panel-hover"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Visual visual={m.visual} name={m.name} size={24} rounded={3} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{m.name}</div>
                <div className="mono text-[10px] text-ink-3">{m.materials.length} materials · {m.status}</div>
              </div>
            </Link>
          ))}
          {system.models.length === 0 && (
            <div className="px-3.5 py-6 text-center text-[12px] text-ink-3">No models yet.</div>
          )}
        </section>

        <div className="mt-4">
          <AttachmentsEditor systemId={system.id} attachments={system.attachments ?? []} systems={otherSystems} />
        </div>
        <div className="h-6" />
      </div>
    </Shell>
  );
}

function Preview({ title, children, topic }: { title: string; children: ReactNode; topic?: ConceptId }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-3.5 py-2.5">
        <h3 className="m-0 text-[13px] font-semibold">{title}</h3>
        {topic && <HelpButton topic={topic} />}
      </header>
      <div className="flex flex-wrap gap-1.5 p-3.5">{children}</div>
    </section>
  );
}
