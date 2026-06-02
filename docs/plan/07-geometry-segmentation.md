# Brief 07 — Segmentation + geometry + spans/placement editors

**Milestone:** v1.5 (items 10–13, 24, + spans/placement editors of item 23) · **Depends on:** 06 · **Status:** in progress

> Height flight auto-split implemented (engine): climb > flight_max → `flights` /
> `rest_platforms` derived counts + an "auto-split engaged" info warning; the ladder
> splits into 2 flights. Next: full canonical geometry (segments/junctions/spans/
> mount-surfaces) + segmentable length + the dimension-chain derivations panel.

## Goal
Engine geometry depth (segments, junctions, spans, mount surfaces, scope instances, dimension-
chain panel for segmented runs) + the deferred **spans editor** and **placement-rules editor**
from `system-edit.html`.

## Create
- `lib/engine/geometry/{segmentation,spans}.ts`.
- Scope-instance support in `lib/engine/context.ts` + `lib/engine/rules/scope.ts`
  (per_segment / per_junction / per_span / per_mount_surface → list of contexts).
- `components/system-wizard/{SpansEditor,PlacementRulesEditor}.tsx`.
- Read-only dimension-chain panel on the take-off (item 24).

## Tasks
- [ ] Segmentable length → segments + junctions (each with own chain + foot/head roles).
- [ ] Height flight auto-split (>flight_max → rest_platform junctions; adjacent-segment constraints).
- [ ] `SpanDeclaration` resolution; mount_surfaces with support_grid; supports/joints/gaps.
- [ ] Per-scope rule firing (scope returns multiple instances; placement rules apply per segment).
- [ ] Spans + placement-rules editors author and persist; engine consumes them.
- [ ] Scope + segmentation unit tests.

## Definition of Done
- [ ] A segmented length take-off produces per-segment chains and per_segment/per_junction rules.
- [ ] Ladder auto-splits flights and emits rest-platform junctions.
- [ ] Spans/placement editors persist and drive the engine.
