# Brief 03 — Materials + Variants libraries (CRUD)

**Milestone:** v1 (items 3, 4) · **Depends on:** 01 · **Parallel:** yes · **Status:** in progress

> Materials catalogue (browse: group/vendor filters, search, cuttable/stock-option
> cells) is live at `/materials`, wired to `getRepo()`. Next: material detail/edit +
> create/delete mutations, then the Variants list + common-attributes editor.

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
- [ ] Materials list/grid with Visual, filters, search; full CRUD via repo.
- [ ] Material detail: cuttable + stock options persist (engine reads them in Brief 08).
- [ ] Variant common-attributes editor (add/edit/remove attribute columns) persists.
- [ ] Snapshot-semantics info card present; version-history/pin/used-in tabs stubbed.

## Definition of Done
- [ ] Full CRUD on materials and variant common attributes through the repo.
- [ ] Cuttable/stock-options round-trip.
- [ ] Deferred variant tabs clearly marked "v2".
