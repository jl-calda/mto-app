# MTO — Implementation Plan (v1 → v3)

This folder is the durable, in-repo copy of the approved build plan. It covers the **entire**
product from both briefs (the engineering brief — data model, pure engine, algorithms,
pipelines, build order 1–46 — and the design brief — ≈16 screens), split into **12
self-contained briefs** executed one-per-session so no chunk is unmanageable.

Read this overview, then the per-brief file you're executing. Each brief lists Goal · Owns ·
Depends · Create · Tasks · Definition of Done, with checkboxes for tracking.

## Locked decisions

- **Persistence: Supabase.** New `mto-app` project in org `jlapps` (pause `akro-app` first to
  free an active slot). Accessed through a repository abstraction; stable top-level entities are
  relational, the volatile declarative payloads (Rule/Property/Geometry) are **JSONB** to avoid
  schema churn. Seeded from the prototype fixtures (`data.jsx`).
- **Styling: Tailwind CSS v4** (CSS-first `@theme`). The design tokens map ~1:1 to Tailwind
  theme tokens; tokens stay the single source of truth, exposed both as CSS variables and
  Tailwind utilities so existing inline-styled components keep working during migration.
- **Auth: design now, build later.** Schema is org/user/membership + RLS-ready from Brief 01;
  auth UI + realtime collaboration are deferred to Brief 11 (v3). v1 is a single shared workspace.

## Current status

| Area | State |
|---|---|
| App scaffold | Next 16 App Router + React 19 + TS; builds + typechecks clean |
| Design tokens | `app/globals.css` (ported `tokens.css`) |
| Chrome | `components/chrome.tsx` (Shell/TopBar/Sidebar/Stat/PrimitiveBadge/Icon) |
| Visual | `components/visual.tsx` (display only); editor not built |
| Types | `lib/types.ts` minimal (Visual, MtoLine) → expand to full §16 model |
| Engine / Persistence | none |
| Screens | ladder take-off only (static); `/` → it; unbuilt routes → on-brand not-found |

## Architecture (summary — full detail in each brief)

**The pure, data-driven engine is the core and the critical path.** The prototype's
`computeGuardrail` is hard-coded per system; we replace it with a **generic interpreter** over
declaratively-authored records. The interpreter seed already exists in the prototype
(`material-rule.html`: `evaluateRule`/`resolveX`); port it, swap mock `sample.*` reads for a real
`EvalContext`, and wrap it in the geometry/algorithm/aggregation pipeline. **Build it once** —
`resolveTakeoff` (take-off screen) and `evaluateRuleAgainstSample` (material-rule live pane) share
the same evaluator.

- `lib/engine/` is the only engine import surface (`index.ts`). Internals: `context`, `modifiers`,
  `defaults`, `primitive`, `geometry/{index,dimension-chain,segmentation,spans}`,
  `algorithms/{types,registry,place-supports,pack-stock,cut-from-stock,pack-stock-2d}`,
  `rules/{evaluate,resolve-x,quantity,sku,scope,english}`, `emit`, `attachments`, `cutting`,
  `consolidate`, `warnings`, `trace`.
- **Purity contract:** no I/O, no `Date.now`, no randomness; deterministic solvers (stable
  sorts). Makes the <100ms budget testable and lets the engine run identically server/client.
- **`XRef` tagged union** is the authoring↔runtime contract: `deriveRuleContext` (what the
  X-picker offers) and `resolveX` (what runtime resolves) consume the same union + algorithm
  `outputFields` metadata.
- **Dimension chain is generic per primitive**, driven by declared modifier *types* — never by
  system identity. Bounded fixed-point loop (≤2 iterations).
- **Persistence:** `lib/repo/` async-shaped interface; relational top-level + JSONB payloads;
  snapshots denormalized into take-offs (a correctness law).
- **State:** Server Components/Actions for libraries; client + pure engine for live editors.

## Build sequence & dependency graph

```
01 Foundations ──┬─► 02 Visual editor (parallel)
                 ├─► 03 Materials+Variants CRUD (parallel)
                 └─► 04 Systems+wizard ─► 05 Engine core + Model/rule ─► 06 Projects+take-off+CSV
                                                                          └─► 07 Geometry+spans/placement
                                                                                 └─► 08 Algorithms+cutting
                                                                                        └─► 09 Sub-assemblies+attachments
                                                                                               └─► 10 v2 power ─► 11 v3 scale
12 Cross-cutting (testing from 01; deploy/RLS/PDF/perf late) ── spans all
```

Parallelizable after 01: **02**, **03**, **04**. Lock `lib/engine/index.ts` + `context.ts` types
early as a stable contract.

## Coverage matrix — build-order items 1–46

| Items | Brief | | Items | Brief |
|---|---|---|---|---|
| 1 | 01 | | 23 (wizard) | 04; (spans/placement) 07 |
| 2 | 02 | | 24 | 07 |
| 3, 4 | 03 | | 25 | 09 |
| 5 | 04 | | 26–35 | 10 |
| 6, 7 | 05 | | 36–46 | 11 |
| 8, 9 | 06 (PDF→12) | | testing/CI/deploy/RLS/perf/PDF | 12 |
| 10–13 | 07 | | | |
| 14–20 | 08 | | | |
| 21, 22 | 09 | | | |

All of 1–46 covered exactly once (23 spans 04+07; PDF half of 9 → 12).

## Coverage matrix — screens

| Screen | Brief(s) |
|---|---|
| index.html (projects) · project.html | 06 |
| systems.html | 04 |
| system-edit.html | 04 (steps 1–3 + properties) · 07 (spans, placement) · 09 (attachments editor) |
| model-edit.html · material-rule.html | 05 |
| variants.html | 03 (CRUD) · 10 (version history) |
| subassemblies.html | 09 (browse+authoring) · 10 (version history) |
| materials.html | 03 |
| inventory.html | 11 |
| takeoff.html · takeoff-anchors.html | 06 |
| takeoff-ladder.html | 06 (rewire static → real engine) |
| takeoff-area.html | 11 |
| Visual identifier editor | 02 |

## Risks (mitigations in each brief)

R1 engine core = critical path · R2 authoring↔runtime drift (one `XRef`) · R3 solver determinism ·
R4 snapshots are a correctness law · R5 schema churn (JSONB) · R6 shared screens span briefs ·
R7 bound the fixed-point loop · R8 Tailwind token drift (single `@theme` source) · R9 live perf
(memoize algorithm runs).

## Execution protocol

1. One brief per session on a feature branch; commit + push when its DoD is met.
2. Lock `lib/engine/index.ts` + `lib/engine/context.ts` types in Brief 01 as a contract.
3. Gate each brief on its DoD before starting the next on the dependency chain; parallel briefs
   (02/03/04) may proceed independently.
4. Tick the checkboxes in each brief file as work lands.

## Verification

- **Engine:** unit + golden tests reproducing `computeGuardrail` outputs (the oracle) per
  primitive; deterministic algorithm-contract tests; <100ms perf assertion on the seeded 50-line
  take-off.
- **Per brief:** `npm run build` + `npm run typecheck` clean + the brief's DoD checklist + manual
  run of the new screen(s) against seeded data.
- **CI (Brief 12):** typecheck + build + test on every PR; Vercel preview deploys.
