'use client';

// Client wrapper so the server-rendered project page can drop a delete control
// into each take-off row (a server component can't hand an inline onDelete arrow
// to the client DeleteButton — but a server action imported here is fine).

import { DeleteButton } from '@/components/delete-button';
import { deleteTakeoffAction } from '@/app/takeoff/actions';

export function DeleteTakeoffButton({ projectId, takeoffId, name }: { projectId: string; takeoffId: string; name: string }) {
  return (
    <DeleteButton
      confirmMessage={`Delete take-off "${name}"? This cannot be undone.`}
      onDelete={() => deleteTakeoffAction(projectId, takeoffId)}
    />
  );
}
