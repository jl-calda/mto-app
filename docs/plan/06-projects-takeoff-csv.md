# Brief 06 — Projects + take-off + CSV export

**Milestone:** v1 (items 8, 9) · **Depends on:** 05 · **Status:** in progress

> Live & engine-computed: Projects list (`/`) + project detail; all three v1
> take-offs — anchors (count), guardrail (length, pack_stock rail), **and the ladder
> (height) rewired from static to the engine** (flight auto-split, threshold cage
> hoops, stiles pack_stock, derived rest-platforms). Shared `PrimitiveTakeoff`
> component, with **CSV export** (`lib/export/csv.ts` + download button). Next:
> take-off persistence (save back to the repo with the variant snapshot).

## Owns
`index.html` (projects list) + `project.html` (project detail); generic length/count take-offs;
**rewire the static `app/takeoff/ladder/page.tsx` to the real engine**; CSV export; take-off
persistence with snapshots. PDF export → Brief 12.

## Create
- `app/page.tsx` (projects list — search/filter/sort/grid), `app/projects/[id]/page.tsx`
  (take-offs list, systems-&-models-in-use summary, stale-system + "review needed" banners).
- `components/takeoff/*` — port `takeoff-controls.jsx` (Section/Field/NumInput/Toggle/
  VariantPicker/BandedSlider/DimensionChain) + `takeoff-mto.jsx` (MTO panel with hover rule-trace).
- `app/takeoff/guardrail/page.tsx`, `app/takeoff/anchors/page.tsx`; refactor the ladder page.
- `lib/export/csv.ts`; take-off persistence (denormalized `VariantSnapshot`).

## Tasks
- [ ] Input state → `resolveTakeoff` → chain + property cards + MTO + warnings, recompute <100ms.
- [ ] Criteria-driven defaults effect (flash on auto-filled fields).
- [ ] Save take-off with `VariantSnapshot`; debounced autosave.
- [ ] CSV from `result.mto`.
- [ ] Ladder screen no longer uses hard-coded data.

## Definition of Done
- [ ] Ladder, guardrail, anchors take-offs are live and persist with snapshots.
- [ ] Project detail lists take-offs + stale/"review needed" badges.
- [ ] CSV downloads; ladder is engine-driven.
