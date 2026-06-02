import { Shell } from '@/components/chrome';
import { ProjectsBrowser } from '@/components/projects/projects-browser';
import { getRepo } from '@/lib/repo';

export default async function Home() {
  const projects = await getRepo().listProjects();
  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects' }]}>
      <ProjectsBrowser projects={projects} />
    </Shell>
  );
}
