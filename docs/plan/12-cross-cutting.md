# Brief 12 — Cross-cutting (spans all phases)

**Milestone:** all · **Depends on:** scaffolding from 01; deepens throughout · **Status:** not started

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
- [ ] CI green on PR (typecheck + build + test).
- [ ] Engine recompute <100ms verified for the seeded 50-line take-off.
- [ ] RLS prevents cross-tenant reads; inventory reservations can't double-claim.
- [ ] PDF export works; a11y audit clean on core flows.
