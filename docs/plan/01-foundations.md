# Brief 01 — Foundations & platform

**Milestone:** v1 (build-order item 1) · **Depends on:** — · **Status:** in progress

## Goal
Full data model, pure engine skeleton + algorithm interfaces + Warning accumulator, Supabase
project + schema + repo, Tailwind setup + token theme + migrate existing components, all 6
resource routes as Shell placeholders.

## Create
- `lib/types/*` — split the engineering brief §16 model into `project.ts`, `system.ts`,
  `material.ts`, `variant.ts`, `subassembly.ts`, `inventory.ts`, `takeoff.ts`, `geometry.ts`,
  `rule.ts`, `index.ts` (replaces the minimal `lib/types.ts`).
- `lib/engine/index.ts` (typed throwing stubs + `TakeoffResult`/`EvalContext`/`XRef`),
  `lib/engine/algorithms/{types,registry}.ts`, `lib/engine/warnings.ts`.
- `lib/repo/{types,index}.ts`, `lib/repo/memory-repo.ts`, `lib/repo/seed/*` (port `data.jsx` +
  `engine.jsx` LOOKUPS/MATERIALS), later `lib/repo/supabase-repo.ts`.
- Tailwind config + CSS-first `@theme` in `app/globals.css`; migrate `components/chrome.tsx`,
  `components/visual.tsx`, `app/takeoff/ladder/page.tsx`.
- Route folders: `app/systems`, `app/variants`, `app/sub-assemblies`, `app/materials`,
  `app/inventory` (placeholder pages using `Shell`).
- Supabase: pause `akro-app`, create `mto-app`, initial migration, seed.

## Tasks
- [ ] Tailwind v4 installed; tokens expressed as `@theme` (CSS vars retained as single source).
- [ ] Existing components render unchanged with Tailwind available.
- [ ] Full §16 data model transcribed into `lib/types/*`; `XRef`, `EvalContext`,
      `CanonicalGeometry`, `Rule`, `PropertyInstance`, `Warning`, `CuttingPlan` defined.
- [ ] Engine public surface (`resolveTakeoff`, `evaluateRuleAgainstSample`, `deriveRuleContext`)
      typed with throwing stubs; algorithm interface + registry; warnings accumulator.
- [ ] Repository interface (async) + in-memory impl over ported seed; `getRepo()`.
- [ ] Supabase project provisioned; schema migration (relational + JSONB); seed loaded;
      `supabase-repo.ts` behind the same interface.
- [ ] Placeholder pages for all 6 resources render the Shell with correct `navActive`.

## Definition of Done
- [ ] `npm run build` + `npm run typecheck` pass.
- [ ] Every sidebar route renders Shell with a placeholder.
- [ ] `getRepo()` returns seeded data for all 8 collections.
- [ ] Engine public types imported by a trivial passing test.
- [ ] No `any` in `lib/types/*` or `lib/engine/index.ts`.
- [ ] Ladder screen visually unchanged after Tailwind migration.
