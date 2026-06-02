# Brief 03 — Materials + Variants libraries (CRUD)

**Milestone:** v1 (items 3, 4) · **Depends on:** 01 · **Parallel:** yes · **Status:** ✅ done
(common-attributes CRUD; variant version history/diff/pin → Brief 10)

> Browse + CRUD complete. Materials catalogue (`/materials`, filters + search + cuttable cells +
> **New material** + a sticky editor on row-click) and Variants library (`/variants`, list +
> common-attributes detail + **New variant**/**Edit** + snapshot-semantics note). Create/edit/
> delete persist through the repo via Server Actions; version history stays stubbed for Brief 10.

## Goal
`materials.html` + `variants.html` **common-attributes / CRUD only**. Variant version history,
diff, pin policy, publish modal are explicitly deferred to Brief 10.

## Create
- `app/materials/page.tsx` (+ detail/edit) — catalogue table, group/vendor filters, search,
  Visual cells, cuttable fields (`is_cuttable`, `stock_options`, `cut_allowance`,
  `min_offcut_to_retain`), unit/vendor/category.
- `app/variants/page.tsx` (+ detail/edit) — list + status filter; **Common attributes** tab only
  (attribute-columns editor); other tabs visibly stubbed "v2".
- Repo mutations for materials and variants.

## Tasks
- [x] Materials list/grid with Visual, filters, search; full CRUD via repo.
- [x] Material detail: cuttable + stock options persist (engine reads them in Brief 08).
- [x] Variant common-attributes editor (add/edit/remove attributes) persists.
- [x] Snapshot-semantics info card present; version-history/pin/used-in stubbed.

## Definition of Done
- [x] Full CRUD on materials and variant common attributes through the repo.
- [x] Cuttable/stock-options round-trip.
- [x] Deferred variant tabs clearly marked "v2".

## Status notes (live)
- `Repository.{saveMaterial,deleteMaterial,saveVariant,deleteVariant}` (memory + Supabase) +
  Server Actions `app/{materials,variants}/actions.ts`.
- `components/materials/material-editor.tsx` (cuttable fields gated behind the toggle) and
  `components/variants/variant-editor.tsx` (common-attributes key/value editor, values coerced
  to bool/number); both reuse `components/system-wizard/parts.tsx`; `router.refresh()` reflects saves.
- Verified: material + variant CRUD round-trips (cuttable `stock_options` and `common_attributes`
  persist); build + typecheck green; routes 200.
