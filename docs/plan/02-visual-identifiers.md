# Brief 02 — Visual identifier authoring

**Milestone:** v1 (item 2) · **Depends on:** 01 · **Parallel:** yes · **Status:** not started

## Goal
Authoring for the Visual identifier (paste / drop / emoji / icon / file upload) with async blob
upload + optimistic UI. Display already exists in `components/visual.tsx`.

## Create
- `components/visual-editor.tsx` (port `visuals.jsx` `VisualEditor`: emoji picker, icon set via
  `Icon`, paste/drop handlers, file picker).
- `app/api/visuals/route.ts` — upload endpoint (Supabase Storage).
- `lib/visuals.ts` — optimistic-state helper (generate filename at paste/drop, upload, patch URL).

## Tasks
- [ ] Editor supports current / emoji / icon / upload modes + clear.
- [ ] Paste (clipboard) and drag-drop produce an optimistic `{kind:'image'}` immediately.
- [ ] Async upload to blob storage; patch `visual.url` on success; rollback on error.
- [ ] Wired into at least one entity editor (material) end-to-end.

## Definition of Done
- [ ] Set a Visual via each modality; optimistic preview appears instantly then swaps to the
      returned URL; error rolls back.
- [ ] `Visual` union round-trips through the repo.
