# Brief 12 — Cross-cutting (spans all phases)

**Milestone:** all · **Depends on:** scaffolding from 01; deepens throughout · **Status:** ◐ core done
(tests + CI + perf + PDF done; deploy/RLS/a11y need a keyed Vercel+Supabase deploy)

## Goal
Quality, performance, security, delivery — plus PDF export (moved here from Brief 06).

## Scope
- **Testing:** engine golden tests (reproduce `computeGuardrail` per primitive — the oracle),
  algorithm-contract tests (deterministic; greedy ≡ ILP where applicable), component + e2e for
  core flows. Scaffold from Brief 01; expand each phase.
- **Performance:** assert engine recompute **<100ms** on the seeded 50-line take-off; memoize
  algorithm runs by `(algo, resolved-inputs)`.
- **Warnings framework:** all §15 warning types; consistent UI registry/rendering.
- **A11y:** keyboard + ARIA pass on the authoring screens.
- **CI:** typecheck + build + test on every PR.
- **Deploy:** Vercel + Supabase env config; preview deploys.
- **Security:** RLS policies enforced (org-scoped); transactional inventory reservations
  (row-level locking / status transitions).
- **PDF export:** `lib/export/pdf.ts` (+ cutting-list PDF).

## Definition of Done
- [x] CI green (typecheck + test + build) — `.github/workflows/ci.yml` runs all on push/PR.
- [x] Engine recompute <100ms — perf test asserts the full ladder take-off (sub-assembly +
      attachment + cutting + offcut) resolves well under budget.
- [~] RLS / no-double-claim: schema is RLS-ready (Brief 01); enforcement + transactional
      reservations need a **keyed Supabase deploy** — not runnable in the in-memory workspace.
- [x] PDF export works (`lib/export/pdf.ts`, dependency-free; PDF button on the take-off).
      A11y audit = a follow-up pass.

## Status notes (live)
- **Testing:** `vitest` + `lib/engine/engine.test.ts` (22 tests): golden reproductions
  (ladder/guardrail/anchors/segmented), chain-override, algorithm contracts (place_supports
  greedy≡optimal valid spacing + forbidden zones; cut_from_stock FFD + offcut reuse;
  pack_stock_2d) + a perf gate; `lib/export/pdf.test.ts`. `npm test` → `vitest run`.
- **CI:** `.github/workflows/ci.yml` (Node 22 · npm ci · typecheck · test · build).
- **PDF:** `lib/export/pdf.ts` (hand-rolled single-page A4, Courier) + take-off PDF button.
- **Warnings framework:** typed `Warning`s (high_wastage, cut_too_long, geometry_mismatch,
  missing_sku, auto-split info, offcut-reuse info) with consistent take-off rendering.
- **Needs a keyed deploy:** Vercel preview deploys, Supabase RLS enforcement + transactional
  inventory reservations, full a11y audit.
