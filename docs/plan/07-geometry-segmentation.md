# Brief 07 — Segmentation + geometry + spans/placement editors

**Milestone:** v1.5 (items 10–13, 24, + spans/placement editors of item 23) · **Depends on:** 06 · **Status:** ✅ done
(scope/segmentation unit tests fold into Brief 12 CI)

> Canonical geometry implemented (engine): `buildGeometry` resolves segments +
> junctions (+ spans + a whole-run mount surface) by primitive kind; scope-aware
> property evaluation (`evaluatePropertiesScoped`: per_segment sums per segment,
> per_span uses the span length, per_mount_surface per surface); derived
> segment/junction counts. The take-off has a segmented-length input + a
> segments/junctions panel. Spans + placement-rules editors author + persist +
> drive the engine.

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
- [x] Segmentable length → segments + junctions (each with own chain + foot/head roles).
- [x] Height flight auto-split (>flight_max → rest_platform junctions).
- [x] `SpanDeclaration` resolution; mount_surfaces (whole-run v1); per_span/per_mount_surface lengths.
- [x] Per-scope property evaluation (per_segment sums per segment; per_junction via derived
      `junction_<type>` counts driving rules).
- [x] Spans + placement-rules editors author and persist; engine consumes them.
- [ ] Scope + segmentation unit tests → **Brief 12 (CI)**. Verified by hand via temp harnesses.

## Definition of Done
- [x] A segmented length take-off produces per-segment chains and per_segment/per_junction rules.
- [x] Ladder auto-splits flights and emits rest-platform junctions.
- [x] Spans/placement editors persist and drive the engine.

## Status notes (live)
- `lib/engine/geometry/segmentation.ts` (`buildGeometry`) + `spans.ts` (`resolveSpans`).
- `evaluate.ts`: `archetypeValue` + `evaluatePropertiesScoped` (single-segment runs reduce to the
  run length → existing take-offs unchanged; ladder rungs stay 35, guardrail single 17).
- `index.ts`: geometry built in `resolveModel`; derived `segment_count`/`junction_count`/
  `junction_<type>`; canonical geometry populated; `place_supports` receives `placement_rules`.
- UI: segmented-length input + segments/junctions panel (`primitive-takeoff.tsx`);
  `SpansEditor` + `PlacementRulesEditor` in the wizard properties step.
- Verified: guardrail segmented (10000⌐+14000) → 19 uprights / 1 corner bracket; ladder
  rest_platform junction @ 4,725; cage_zone span drops hoops 23→13; place_supports → 6 supports.
