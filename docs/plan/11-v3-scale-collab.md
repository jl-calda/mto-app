# Brief 11 — v3 scale & collaboration

**Milestone:** v3 (items 36–46) · **Depends on:** 10 · **Status:** not started

## Goal
Scale, inventory, realtime, and the higher primitives. This is where Supabase Auth + realtime +
storage are fully exercised.

## Scope (items)
- 36 Inventory tab (`inventory.html`) + reservation lifecycle (available→reserved→consumed).
- 37 Cross-segment offcut reuse within a take-off.
- 38 Cross-project inventory consultation in `cut_from_stock`.
- 39 Real-time collaboration (field locks, cursors, CRDT) + **auth (Supabase Auth + RLS enforced)**.
- 40 Area primitive + `pack_stock_2d` (`takeoff-area.html`: SVG 2D packing, openings, collab strip,
  high-wastage warning).
- 41 Volume primitive.
- 42 Property templates library (shared, versioned).
- 43 Model versioning (pin policy on take-offs, version history).
- 44 Bulk variant version upgrades (admin, dry-run preview).
- 45 Bulk model version upgrades.
- 46 Complex shape editor for area take-offs.

## Create
- `app/inventory/*` (offcut-pool viz, status×origin filters, reservations).
- `lib/engine/algorithms/pack-stock-2d.ts`; `app/takeoff/area/page.tsx`.
- Presence/collab layer (Supabase realtime); `lib/repo/supabase-repo.ts` realtime hooks; auth UI.

## Definition of Done
- [ ] Area take-off nests sheets and reuses offcuts; volume primitive resolves.
- [ ] Inventory reservations are transactional/consistent (no double-claim).
- [ ] Collab presence + locks on the area screen; auth + RLS enforced.
- [ ] Bulk upgrades + property templates + model versioning work.
