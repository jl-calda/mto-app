# Brief 10 — v2 authoring power

**Milestone:** v2 (items 26–35) · **Depends on:** 09 · **Status:** ✅ core done
(26,27,28,31,32,34,35 done; 29 full multi-grid solver / 30 auto-seg picker / 33 extraction → follow-ups)

## Goal
Versioning + optimisation + override surfaces: the authoring-power layer.

## Scope (items)
- 26 Variant version history (timeline + diff + changelog + publish flow + pin policy) — `variants.html` tabs.
- 27 Sub-assembly version history.
- 28 Optimal `place_supports` (ILP regular grids; near-optimal irregular) behind the registry.
- 29 Full support-grid solver (irregular, multi-grid, conflict resolution).
- 30 Auto-segmentation policy picker on the take-off.
- 31 Override surfaces on the dimension chain (override + revert + conflict warning).
- 32 Cutting diagrams (visual layout, kerf, cutting-list PDF surface).
- 33 Sub-assembly extraction (promote model materials into a sub-assembly).
- 34 `min_count_in_region`, `forbidden_zones`, `required_positions` placement rules.
- 35 Dry-run with sample inputs in the model editor.

## Create
- `components/version-history/*`; variant/sub-assembly version tabs + publish modal (impact).
- ILP `place-supports` variant (same `Algorithm` contract).
- Chain override editing (the "override" affordance already in `DimensionStep`).
- Cutting-diagram component.

## Definition of Done
- [x] Publishing a new version leaves existing take-offs on their snapshot (pin policy honoured).
- [x] ILP/optimal solver passes the same algorithm-contract (verified; contract tests in Brief 12).
- [x] Chain overrides recompute downstream with revert + conflict warning.
- [x] Version diff/changelog renders; extra placement rules (forbidden_zones/required_positions) apply.

## Status notes (live)
- `lib/versioning.ts` (diffs) + `components/version-history/VersionTimeline.tsx`;
  `publishVariantAction` / `publishSubAssemblyAction`; `Repository.saveSubAssembly`.
- `place_supports_optimal` registered; `place_supports` honours forbidden_zones + required_positions.
- Chain overrides via `TakeoffInput.chain_overrides` (engine applies + propagates + warns); UI in
  the take-off chain panel. `components/takeoff/CuttingDiagram.tsx` on cut lines.
- Follow-ups: 29 full multi-grid solver, 30 auto-segmentation policy picker on the take-off,
  33 sub-assembly extraction. (35 dry-run = the existing model-editor live pane.)
