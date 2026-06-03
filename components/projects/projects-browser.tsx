'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Visual } from '@/components/visual';
import { Stat } from '@/components/chrome';
import { Cell } from '@/components/chrome/responsive-cell';
import { DeleteButton } from '@/components/delete-button';
import { HelpButton } from '@/components/help/help-button';
import { deleteProjectAction } from '@/app/projects/actions';
import type { Project } from '@/lib/types';

// Desktop (lg+): 6-track grid. Mobile: each row is a stacked card.
const COLS = 'lg:grid lg:grid-cols-[28px_minmax(0,1fr)_160px_140px_80px_40px] lg:items-center lg:gap-2.5';

export function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return projects.filter((p) => !n || `${p.name} ${p.client} ${p.location ?? ''}`.toLowerCase().includes(n));
  }, [projects, q]);

  const takeoffs = projects.reduce((s, p) => s + p.takeoffs.length, 0);
  const systems = new Set(projects.flatMap((p) => p.takeoffs.map((t) => t.system_id))).size;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
      <div className="flex items-end justify-between border-b border-line pb-3.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="m-0 text-[22px] font-semibold">Projects</h1>
            <HelpButton topic="takeoff" />
          </div>
          <div className="mt-1 text-[12px] text-ink-3">Workspaces where take-offs happen and MTOs are produced.</div>
        </div>
        <div className="flex border-l border-line">
          <Stat k="projects" v={projects.length} />
          <Stat k="take-offs" v={takeoffs} />
          <Stat k="systems used" v={systems} />
        </div>
      </div>

      <div className="py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="input w-full sm:w-[280px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          />
          <span className="hidden flex-1 sm:block" />
          <Link href="/projects/new" className="btn primary sm">New project</Link>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-panel">
          <div className={`${COLS} hidden border-b border-line bg-panel-2 px-3.5 py-2`}>
            {['', 'project', 'client', 'location', 'take-offs', ''].map((h, i) => (
              <div key={i} className="uc">{h}</div>
            ))}
          </div>
          {rows.map((p) => (
            <div
              key={p.id}
              className={`${COLS} relative border-b border-line px-3.5 last:border-b-0 hover:bg-panel-hover lg:py-2.5`}
            >
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center gap-3 pt-3 pb-2 pr-9 lg:contents lg:p-0"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Visual visual={p.visual} name={p.name} size={26} rounded={4} />
                <div className="min-w-0 flex-1 lg:flex-none">
                  <div className="truncate text-[13px] font-medium">{p.name}</div>
                  <div className="mono truncate text-[10px] text-ink-3">{p.id}</div>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-3 lg:contents lg:pb-0">
                <Cell label="client" className="truncate text-[12px] text-ink-2">{p.client}</Cell>
                <Cell label="location" className="truncate text-[12px] text-ink-2">{p.location ?? '—'}</Cell>
                <Cell label="take-offs" className="mono text-[13px]">{p.takeoffs.length}</Cell>
              </div>
              <div className="absolute right-2.5 top-2.5 lg:static">
                <DeleteButton
                  confirmMessage={`Delete project "${p.name}" and its ${p.takeoffs.length} take-off(s)? This cannot be undone.`}
                  onDelete={() => deleteProjectAction(p.id)}
                />
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-3.5 py-10 text-center text-[12px] text-ink-3">No projects match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
