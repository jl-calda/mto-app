# Brief 10 — v2 authoring power

**Milestone:** v2 (items 26–35) · **Depends on:** 09 · **Status:** not started

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
- [ ] Publishing a new version leaves existing take-offs on their snapshot (pin policy honoured).
- [ ] ILP solver passes the same algorithm-contract tests as greedy.
- [ ] Chain overrides recompute downstream with revert + conflict warning.
- [ ] Version diff/changelog renders; extra placement rules author + apply.
