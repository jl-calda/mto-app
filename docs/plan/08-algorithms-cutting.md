# Brief 08 — Algorithms + stock + cutting

**Milestone:** v1.5 (items 14–20) · **Depends on:** 07 · **Status:** ✅ done
(contract/golden tests → Brief 12; offcut reuse → Brief 11)

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
- [x] `pack_stock` tight + spaced packing policies.
- [x] Greedy `place_supports` consuming placement rules (Brief 07 wired the rules in).
- [x] FFD `cut_from_stock`; aggregate demands across rules + sub-assemblies + attachments (Brief 09).
- [x] Wire `algorithm` quantity kind + `algorithm_output` X-refs to real outputs (by-algorithm map).
- [~] Stock/threshold/junction archetypes: threshold ✓; junctions via derived `junction_<type>`
      counts (Brief 07); a dedicated stock archetype is subsumed by the `algorithm` (pack_stock) path.
- [x] `high_wastage` + `cut_too_long` warnings (grid warnings land with the grid solver, Brief 10/11).
- [x] `pack_stock_2d` implemented (real shelf packer) + registered (drives the area take-off, Brief 11).

## Definition of Done
- [x] Seeded guardrail MTO matches `computeGuardrail` — rail pack pieces (4), couplers-per-joint
      (3, via `algorithm_output`), toe-board cut demands (6 stocks).
- [x] Cut lines aggregate to one line per stock with a cutting plan.
- [x] A stub solver can be injected (`resolveTakeoff({ algorithms })` + `createRegistry`); contract
      tests land in Brief 12.
