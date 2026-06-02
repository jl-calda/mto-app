# Brief 11 — v3 scale & collaboration

**Milestone:** v3 (items 36–46) · **Depends on:** 10 · **Status:** ◐ core done
(36,37,38,40,41 done; 39 auth/realtime + 42–46 bulk/templates need live Supabase Auth/realtime — designed, not enforced here)

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
- [x] Area take-off nests sheets (`/takeoff/area`, `pack_stock_2d`); volume primitive resolves
      (input-only chain). Offcut reuse: `cut_from_stock` consults retained offcuts (ladder L-bar 2→1).
- [~] Inventory reservations: status lifecycle (available→reserved→consumed) via the inventory
      screen. True no-double-claim needs DB row-locking → Brief 12 (RLS).
- [ ] Collab presence/locks + auth + RLS: **requires live Supabase Auth/realtime + deploy** — the
      schema is RLS-ready (Brief 01); not enforceable in the in-memory workspace. Deferred to a
      keyed deploy (tracked in Brief 12).
- [~] Bulk upgrades / property templates / model versioning: variant + sub-assembly versioning
      done (Brief 10); bulk admin upgrades + shared property templates remain follow-ups.

## Status notes (live)
- Done + verified: area primitive + `/takeoff/area` 2D nesting SVG (40); volume primitive engine
  support (41); inventory screen + reservation transitions (36, `setInventoryStatusAction` +
  `Repository.saveInventoryItem`); offcut reuse in `cut_from_stock` + cross-project consultation
  (37, 38) — wired into the ladder take-off.
- Needs a keyed Supabase deploy (not buildable in-memory): 39 auth + RLS + realtime collaboration.
- Follow-ups: 42 property templates, 43 model version pin-on-take-off, 44/45 bulk upgrades,
  46 complex-shape area editor.
