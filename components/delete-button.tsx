'use client';

// Reusable confirm-guarded delete control. Calls a server action (returning the
// app's standard {ok,error} shape), then refreshes — or runs onDeleted. Stops
// event propagation so it can sit next to (not inside) a row <Link>.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteButton({
  confirmMessage,
  onDelete,
  onDeleted,
  label = '×',
  title = 'Delete',
  className = 'btn sm danger',
}: {
  confirmMessage: string;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  onDeleted?: () => void;
  label?: string;
  title?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    const res = await onDelete();
    setBusy(false);
    if (res.ok) {
      if (onDeleted) onDeleted();
      else router.refresh();
    } else {
      window.alert(res.error ?? 'Delete failed');
    }
  }

  return (
    <button type="button" className={className} title={title} aria-label={title} disabled={busy} onClick={handle}>
      {busy ? '…' : label}
    </button>
  );
}
