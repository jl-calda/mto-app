import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell, PrimitiveBadge, Stat } from '@/components/chrome';
import { Visual } from '@/components/visual';
import { getRepo } from '@/lib/repo';
import type { Takeoff, Variant } from '@/lib/types';

function takeoffHref(kind?: string): string {
  return kind === 'height'
    ? '/takeoff/ladder'
    : kind === 'count'
      ? '/takeoff/anchors'
      : kind === 'length'
        ? '/takeoff/guardrail'
        : '#';
}

type Badge = { label: string; tone: 'ok' | 'warn' | 'muted' };
const TONE: Record<Badge['tone'], { color: string; bg: string }> = {
  ok: { color: 'var(--ok)', bg: 'var(--ok-soft)' },
  warn: { color: 'var(--warn)', bg: 'var(--warn-soft)' },
  muted: { color: 'var(--ink-3)', bg: 'var(--bg-2)' },
};

/** Stale-snapshot / review-needed / saved badges for a take-off row. */
function badgesFor(t: Takeoff, variantById: Map<string, Variant>): Badge[] {
  const out: Badge[] = [];
  const ref = t.variant_choice?.source_ref;
  if (ref?.kind === 'library') {
    const cur = variantById.get(ref.variant_id)?.current_version;
    const snap = t.variant_choice.snapshot_version;
    if (cur != null && snap != null && snap < cur) out.push({ label: `variant v${snap}→v${cur}`, tone: 'warn' });
  }
  const review = (t.warnings ?? []).filter((w) => w.level === 'warning' || w.level === 'error').length;
  if (review) out.push({ label: `${review} review`, tone: 'warn' });
  out.push(t.mto && t.mto.length ? { label: `✓ ${t.mto.length} lines`, tone: 'ok' } : { label: 'draft', tone: 'muted' });
  return out;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const project = await repo.getProject(id);
  if (!project) notFound();

  const systems = await repo.listSystems();
  const models = await repo.listModels();
  const variants = await repo.listVariants();
  const sysById = new Map(systems.map((s) => [s.id, s]));
  const modelById = new Map(models.map((m) => [m.id, m]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const usedSystemIds = [...new Set(project.takeoffs.map((t) => t.system_id))];
  const reviewCount = project.takeoffs.filter((t) => badgesFor(t, variantById).some((b) => b.tone === 'warn')).length;

  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: project.name }]}>
      <div className="mx-auto max-w-[1400px] px-5 pt-[18px]">
        <div className="flex items-end justify-between border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            <Visual visual={project.visual} name={project.name} size={40} rounded={6} />
            <div>
              <h1 className="m-0 text-[22px] font-semibold">{project.name}</h1>
              <div className="mt-1 text-[12px] text-ink-3">
                {project.client}
                {project.location ? ` · ${project.location}` : ''}
              </div>
            </div>
          </div>
          <div className="flex border-l border-line">
            <Stat k="take-offs" v={project.takeoffs.length} />
            <Stat k="systems used" v={usedSystemIds.length} />
            {reviewCount > 0 && <Stat k="review" v={reviewCount} highlight="warn" />}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4 py-4">
          <section className="overflow-hidden rounded-md border border-line bg-panel">
            <header className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2.5">
              <h3 className="m-0 text-[13px] font-semibold">Take-offs</h3>
              <button className="btn primary sm">New take-off</button>
            </header>
            {project.takeoffs.map((t) => {
              const sys = sysById.get(t.system_id);
              const mdl = modelById.get(t.model_id);
              const pk = sys?.primitive.kind;
              return (
                <Link
                  key={t.id}
                  href={takeoffHref(pk)}
                  className="flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-panel-hover"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {pk && pk !== 'area' && pk !== 'volume' && <PrimitiveBadge kind={pk} mini />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{t.name}</div>
                    <div className="mono truncate text-[10px] text-ink-3">
                      {sys?.name} › {mdl?.name}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {badgesFor(t, variantById).map((b, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ color: TONE[b.tone].color, background: TONE[b.tone].bg }}>{b.label}</span>
                    ))}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--ink-4)' }}>
                    <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              );
            })}
            {project.takeoffs.length === 0 && (
              <div className="px-3.5 py-8 text-center text-[12px] text-ink-3">No take-offs yet.</div>
            )}
          </section>

          <aside className="overflow-hidden rounded-md border border-line bg-panel">
            <header className="border-b border-line bg-panel-2 px-3.5 py-2.5">
              <h3 className="m-0 text-[13px] font-semibold">Systems &amp; models in use</h3>
            </header>
            {usedSystemIds.map((sid) => {
              const sys = sysById.get(sid);
              return (
                <Link
                  key={sid}
                  href="/systems"
                  className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-panel-hover"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Visual visual={sys?.visual} name={sys?.name ?? sid} size={22} rounded={3} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px]">{sys?.name ?? sid}</div>
                    <div className="mono text-[10px] text-ink-3">{sys?.primitive.kind}</div>
                  </div>
                </Link>
              );
            })}
            {usedSystemIds.length === 0 && (
              <div className="px-3.5 py-6 text-center text-[12px] text-ink-3">None yet.</div>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
