# Brief 08 — Algorithms + stock + cutting

**Milestone:** v1.5 (items 14–20) · **Depends on:** 07 · **Status:** in progress

> Algorithms implemented behind the registry: `pack_stock` (tight/spaced),
> `place_supports` (greedy), `cut_from_stock` (FFD). The `algorithm` quantity kind is
> wired (guardrail rail → 4×6000mm). **Cut-demand aggregation works**: `cut` rules pool
> per material → `cut_from_stock` → a stock-order MTO line carrying a `CuttingPlan` +
> high-wastage warning (ladder L-bar → 1 stock · 7 pieces). Threshold archetype done
> (cage hoops). Remaining: stock-archetype properties + per-segment placement.

## Goal
Stock/threshold/junction archetypes fully live; `place_supports` (greedy), `pack_stock`
(tight/spaced), `cut_from_stock` (FFD); cuttable materials end-to-end. Algorithms behind the
stable registry interface so greedy→ILP (Brief 10) is internal.

## Create
- `lib/engine/algorithms/{place-supports,pack-stock,cut-from-stock}.ts` (+ `pack-stock-2d.ts` stub).
- `lib/engine/cutting.ts` (aggregate `CutDemand`s → `cut_from_stock` → `CuttingPlan`).
- Cutting-plan + cutting-list UI surface on the take-off.

## Tasks
- [ ] Lift `pack_stock` from `engine.jsx`; tight + spaced packing policies.
- [ ] Greedy `place_supports` consuming placement rules; reconcile to support grid.
- [ ] FFD `cut_from_stock`; aggregate demands across rules (+ later sub-assemblies/attachments).
- [ ] Wire `algorithm` quantity kind + `algorithm_output` X-refs (stubbed in 05) to real outputs
      via registry `outputFields`.
- [ ] Stock / threshold / junction property archetypes evaluate.
- [ ] High-wastage + grid warnings (`high_wastage`, `grid_too_sparse`, `cut_too_long`, …).

## Definition of Done
- [ ] Seeded guardrail MTO now matches `computeGuardrail` **including** rail pack pieces,
      couplers-per-joint, and toe-board cut demands.
- [ ] Cut lines aggregate to one line per stock with a cutting plan.
- [ ] A stub solver can be injected in tests (deterministic contract tests pass).
