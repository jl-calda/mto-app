# Brief 02 — Visual identifier authoring

**Milestone:** v1 (item 2) · **Depends on:** 01 · **Parallel:** yes · **Status:** ✅ done

## Goal
Authoring for the Visual identifier (paste / drop / emoji / icon / file upload) with async blob
upload + optimistic UI. Display already exists in `components/visual.tsx`.

## Create
- `components/visual-editor.tsx` (port `visuals.jsx` `VisualEditor`: emoji picker, icon set via
  `Icon`, paste/drop handlers, file picker).
- `app/api/visuals/route.ts` — upload endpoint (Supabase Storage).
- `lib/visuals.ts` — optimistic-state helper (generate filename at paste/drop, upload, patch URL).

## Tasks
- [x] Editor supports current / emoji / icon / upload modes + clear.
- [x] Paste (clipboard) and drag-drop produce an optimistic `{kind:'image'}` immediately (objectURL).
- [x] Async upload to blob storage; patch `visual.url` on success; rollback on error.
- [x] Wired into ≥1 entity editor (material) end-to-end — also the variant editor.

## Definition of Done
- [x] Set a Visual via each modality; optimistic preview appears instantly then swaps to the
      returned URL; error rolls back.
- [x] `Visual` union round-trips through the repo.

## Status notes (live)
- `components/visual-editor.tsx` (tabbed: none/emoji/icon/upload + clear; click/drop/paste upload
  with optimistic objectURL → returned URL → rollback). Wired into the material + variant editors.
- `app/api/visuals/route.ts`: Supabase Storage when configured, else a data URL; image-only (415),
  5 MB cap (413), missing-file (400). `lib/visuals.ts` is the POST helper.
- Verified: upload returns a URL (data URL in-memory; non-image→415); visual round-trips through
  the repo (none → emoji); build + typecheck green; routes 200.
- Follow-up: also wire the editor into the system-wizard + model-editor headers (currently
  material + variant only).
