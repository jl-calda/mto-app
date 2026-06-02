# Brief 06 — Projects + take-off + CSV export

**Milestone:** v1 (items 8, 9) · **Depends on:** 05 · **Status:** ✅ done
(DoD met; the criteria-driven-defaults *flash* nicety is deferred — no seed data exercises it yet)

> Live & engine-computed: Projects list (`/`) + project detail; all three v1
> take-offs — anchors (count), guardrail (length, pack_stock rail), **and the ladder
> (height) rewired from static to the engine** (flight auto-split, threshold cage
> hoops, stiles pack_stock, derived rest-platforms). Shared `PrimitiveTakeoff`
> component, with **CSV export** (`lib/export/csv.ts` + download button) and
> **take-off persistence** (debounced autosave via a Server Action through the repo,
> denormalized `VariantSnapshot` + computed MTO) and **project review/stale badges**.

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
- [x] Input state → `resolveTakeoff` → chain + property cards + MTO + warnings, recompute <100ms.
- [ ] Criteria-driven defaults effect (flash on auto-filled fields). *(deferred — criteria are
      read-only in the take-off and no seed model carries `criteria_driven_defaults`; pairs with
      the editable-criteria/X-picker authoring work.)*
- [x] Save take-off with `VariantSnapshot`; debounced autosave.
      (`saveTakeoffAction` → `Repository.saveTakeoff`; `components/takeoff/persistence.tsx`.)
- [x] CSV from `result.mto`.
- [x] Ladder screen no longer uses hard-coded data.

## Definition of Done
- [x] Ladder, guardrail, anchors take-offs are live and persist with snapshots.
- [x] Project detail lists take-offs + stale/"review needed" badges.
- [x] CSV downloads; ladder is engine-driven.

## Status notes (live)
- `Repository.saveTakeoff(projectId, takeoff)` added to the interface + memory (in-process upsert)
  and Supabase (payload + relational columns) repos. Server Action `app/takeoff/actions.ts`
  revalidates `/projects/[id]` and `/`.
- Persistence is shared by both take-off components via `useTakeoffPersistence` (debounced 800ms
  autosave + manual Save) and `SaveStatus`. Saved payload = inputs + `VariantSnapshot` + attachments
  + `computed_geometry` + `mto` + `warnings`.
- Badges: stale-snapshot (`variant vN→vM` when a pinned library variant has advanced — demoed via
  `var-ss316` @ v2 vs the guardrail take-off pinned at v1), `N review` (stored warning/error),
  `✓ N lines` vs `draft`.
- Verified: build + typecheck green; `saveTakeoff` round-trips; all routes 200; badges render.
