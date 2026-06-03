'use client';

// Persistent Guide trigger for the TopBar — present on every page via Shell.
// Toggles the help panel; it opens focused on the active tab's concept (the
// provider seeds `topic` from navActive).

import { Icon } from '@/components/chrome';
import { useHelp } from './help-context';

export function GuideButton() {
  const { open, toggle } = useHelp();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={open}
      title="Open the concept guide"
      className="btn ghost sm inline-flex items-center gap-1"
      style={open ? { background: 'var(--selected)', color: 'var(--accent)' } : undefined}
    >
      <Icon.Info />
      <span>Guide</span>
    </button>
  );
}
