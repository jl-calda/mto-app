# Brief 01 — Foundations & platform

**Milestone:** v1 (build-order item 1) · **Depends on:** — · **Status:** mostly complete

> Supabase `mto-app` provisioned (ref `kzprzimqdhqnttkvdxpb`, region ap-southeast-2,
> ACTIVE_HEALTHY; `akro-app` paused). Initial schema applied (13 tables, RLS enabled,
> service-role-only until auth). Remaining: wire `supabase-repo.ts` + env + load seed
> into Supabase (memory-repo is active meanwhile, behind the same interface).

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
- [x] Tailwind v4 installed; tokens expressed as `@theme inline` (CSS vars retained as single source).
- [x] Existing components render unchanged with Tailwind available (coexist; no migration needed).
- [x] Full §16 data model transcribed into `lib/types/*`; `XRef`, `EvalContext`,
      `CanonicalGeometry`, `Rule`, `PropertyInstance`, `Warning`, `CuttingPlan` defined.
- [x] Engine public surface (`resolveTakeoff`, `evaluateRuleAgainstSample`, `deriveRuleContext`)
      typed with throwing stubs; algorithm interface + registry; warnings accumulator.
- [x] Repository interface (async) + in-memory impl over ported seed; `getRepo()`.
- [x] Supabase project provisioned; schema migration (relational + JSONB + RLS).
- [x] `supabase-repo.ts` (payload-based) + service client + env-switch in `getRepo()` +
      `.env.example`; seed loads via gated `POST /api/seed` once the service-role key is set.
- [x] Placeholder pages for all 6 resources render the Shell with correct `navActive`.

**Brief 01 complete.** Activation (deploy step): set `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`, then `POST /api/seed` with `x-seed-token`. Until then the
app runs on the in-memory seed behind the identical `Repository` interface.

## Definition of Done
- [x] `npm run build` + `npm run typecheck` pass.
- [x] Every sidebar route renders Shell with a placeholder.
- [x] `getRepo()` returns seeded data for all 8 collections (memory-repo).
- [~] Engine public types compile clean and are exercised by `tsc`; formal test harness in Brief 12.
- [x] No `any` in `lib/types/*` or `lib/engine/index.ts`.
- [x] Ladder screen visually unchanged (untouched; Tailwind coexists via tokens).
