import { notFound } from 'next/navigation';
import { Shell } from '@/components/shell';
import { NewTakeoffPicker } from '@/components/takeoff/new-takeoff-picker';
import { getRepo } from '@/lib/repo';

export default async function NewTakeoffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const project = await repo.getProject(id);
  if (!project) notFound();
  // take-offs run on length/height/count systems (area uses its own bespoke screen)
  const systems = (await repo.listSystems()).filter((s) => ['length', 'height', 'count'].includes(s.primitive.kind));
  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: project.name, href: `/projects/${project.id}` }, { label: 'New take-off' }]}>
      <NewTakeoffPicker projectId={project.id} projectName={project.name} systems={systems} />
    </Shell>
  );
}
