import { Shell } from '@/components/shell';
import { NewProjectForm } from '@/components/projects/new-project-form';

export default function NewProjectPage() {
  return (
    <Shell navActive="projects" crumbs={[{ label: 'Projects', href: '/' }, { label: 'New project' }]}>
      <NewProjectForm />
    </Shell>
  );
}
