# MTO — New-session handoff brief

Paste this as the kickoff message for a fresh session. It assumes the repo
`jl-calda/mto-app`, branch **`claude/trusting-meitner-VEsKg`**.

---

## What this is
A construction **Material Take-Off** app: estimators enter measurements + design
choices for safety-access systems (ladders, guardrails, anchors, walkways); a **pure,
data-driven engine** turns declaratively-authored rules into a procurement bill of
materials. Stack: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 +
Supabase**.

## First, read these (in order)
1. `docs/plan/README.md` — overview, architecture, coverage matrices, dependency graph.
2. `docs/plan/01-foundations.md` … `12-cross-cutting.md` — the 12 self-contained briefs;
   each has a **Status** note kept live as work lands. Trust those statuses.
3. Skim `lib/engine/index.ts` (the engine's public surface) and `lib/repo/seed/index.ts`
   (the seed data you'll be computing against).

The original HTML/CSS design prototypes are **not in the container** (they were in
`/tmp`). If you need pixel detail for a screen, re-fetch the design bundle (gzipped tar)
and extract: `WebFetch` →
`https://api.anthropic.com/v1/design/h/sljeZ06GaGWFeXDwB3zcug?open_file=takeoff-ladder.html`
(it saves a `.bin`; `gunzip` then `tar xf`). Otherwise the implemented screens + plan
capture the intent.

## Locked decisions (do not relitigate)
- **Supabase** is the backend. Project **`mto-app`**, ref `kzprzimqdhqnttkvdxpb`, org
  `jlapps`, region ap-southeast-2 (the unrelated `akro-app` was paused to free a slot).
  13-table schema applied (relational columns + **JSONB payloads** for declarative data;
  RLS on, service-role-only). The app runs on the **in-memory seed** behind the same
  `Repository` interface until `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set (then
  `POST /api/seed`). Use the Supabase MCP tools for schema changes.
- **Tailwind v4**, CSS-first `@theme inline` in `app/globals.css` mapping the design
  tokens → utilities (`text-ink-3`, `bg-panel`, `border-line`, `font-mono`, …). Tokens
  are the single source of truth.
- **Auth: design now, build later** — org/user/membership tables + RLS exist; auth UI +
  realtime collab are deferred to Brief 11 (v3). v1 is a single shared workspace.

## Architecture you must respect
- **The engine is pure** (`lib/engine/`): no I/O, no `Date.now`, no randomness;
  deterministic solvers. `lib/engine/index.ts` is the ONLY import surface. **No
  per-system branching** — it interprets `System`/`Model`/`Rule`/`PropertyInstance`
  records generically.
- **One evaluator, two entry points**: `resolveTakeoff` (take-off screens) and
  `evaluateRuleAgainstSample` (model/rule live-eval pane) share the same core. Keep it so.
- **`XRef`** (in `lib/engine/context.ts`) is the authoring↔runtime contract: the
  X-picker (`deriveRuleContext`) and the resolver (`resolveX`) must consume the same
  vocabulary + algorithm `outputFields`.
- **Algorithms** (`pack_stock`, `place_supports`, `cut_from_stock`) live behind the
  registry (`lib/engine/algorithms/`) — greedy/FFD v1; the greedy→ILP swap (Brief 10) is
  internal. Add new solvers to `standardRegistry`.
- **Snapshots are a correctness law**: take-offs store a deep `VariantSnapshot`; the
  engine only ever receives snapshots, never live library refs.
- **State split**: library/CRUD screens = Server Components + (future) Server Actions;
  take-off + rule editors = client components running the pure engine live (<100ms).

## Conventions / gotchas (save yourself time)
- **Next 16**: `params` is a `Promise` — `await` it in `[id]` pages.
- **Server↔client boundary**: a server component may render an individual client
  component as an element, but **cannot access an object-property export across the
  boundary** (e.g. `Icon.Chev` from the `'use client'` chrome → `undefined` "element type
  is invalid"). Use a direct component import or an inline SVG in server components.
- **Variant identity** = `row.kind === 'local' ? row.name : row.variant_id`; `applies_when.variants`
  matches that string. (Seed systems use local rows.)
- **Height flight auto-split**: the engine finds the flight-max modifier by name regex
  (`/flight.*max|max.*flight/i`) and exposes `derived.flights` / `derived.rest_platforms`.
- `getRepo()` is server-only (imports the Supabase service client). Don't import it into
  client components — pass data down or use Server Actions.
- Commit per increment; push with retry; **do not open a PR unless asked**. Commit footer:
  `https://claude.ai/code/session_01KdDjuSyofRNHywb71wsmgP` (or the new session's link).

## What's DONE (verified: build + typecheck + serve + correct computed output)
- **Brief 01 Foundations** ✅ — full `lib/types/*` data model, engine skeleton→impl, repo
  + seed + Supabase wiring, Tailwind, all routes.
- **Brief 05 Engine core + model/rule authoring** ✅ — chain, archetypes, 5 quantity patterns,
  SKU, consolidation, `deriveRuleContext`; `/models/[id]` editor now **editable** (rule X-picker
  constrained to the system context, qty_kind, applies_when, add/remove materials) with a live
  pane that reacts to the draft rule; persists via `saveModelAction` → `Repository.saveModel`.
  (Golden engine unit tests → Brief 12.)
- **Brief 08 Algorithms** (most) — `pack_stock`/`place_supports`/`cut_from_stock`,
  `algorithm` quantity kind, **cut-demand aggregation → CuttingPlan**.
- **Brief 07** (partial) — height flight auto-split.
- **Brief 06 Projects + take-off + CSV** ✅ — Projects list + detail (with stale-snapshot /
  review / saved badges); **three live take-offs** via shared
  `components/takeoff/primitive-takeoff.tsx` (`/takeoff/{anchors,guardrail,ladder}`, the
  ladder rewired from static to engine); CSV export; **take-off persistence** (debounced
  autosave via `saveTakeoffAction` → `Repository.saveTakeoff`, denormalized snapshot + MTO).
  (Criteria-driven-defaults *flash* deferred — pairs with editable-criteria/X-picker work.)
- **Brief 03 Materials + Variants CRUD** ✅ — browse + create/edit/delete through the repo
  (`save/deleteMaterial`, `save/deleteVariant` + Server Actions); material editor (cuttable +
  stock_options) and variant common-attributes editor. (Variant version history → Brief 10.)
- **Brief 04 Systems + authoring** ✅ — list (+ **New system**) + detail (+ **Edit** +
  AttachmentsEditor); the **4-step wizard** (`/systems/new`, `/systems/[id]/edit`):
  primitive · modifiers · variants+matrix+criteria · properties (7 archetypes), persisted via
  `saveSystemAction` → `Repository.saveSystem`, with a live `deriveRuleContext` preview. New
  `PropertyInstance.applies_to_variants` gates properties per variant (engine-respected).
- **Brief 09 Sub-assemblies + attachments** ✅ — sub-assembly inlining (`lib/engine/emit.ts`,
  bound params + `Rule.cut_length_param`) + the ladder→walkway **attachment**
  (`lib/engine/attachments.ts`: 3-bucket inputs, recursive `resolveModel`, suppressions,
  connection materials, ONE shared cut pool). Ladder take-off attachment section engine-driven;
  `/sub-assemblies` browse + authoring + `AttachmentsEditor` on `/systems/[id]` built. (Authoring
  **mutations/persistence** + version history → Brief 10.) **5 of 6 nav sections real.**

## What's NEXT (priority order)
1. **Brief 02** — Visual identifier editor (paste/drop/emoji/icon/upload), wired into the
   material/variant/system/model editors (they have no visual picker yet — `Visual` is display-only).
2. **Brief 07** — full segmentation/spans/placement editors (engine + UI): multi-segment runs,
   junctions, spans, `place_supports` placement-rules editor.
3. **Brief 10 (v2)** — authoring **version history** (incl. deferred Brief 09 persistence + the
   take-off criteria-driven-defaults flash), greedy→ILP solver swap.
4. **Brief 11 (v3)** scale/collab, then **Brief 12** (testing/CI/deploy/RLS/PDF/perf — incl. the
   deferred golden engine unit tests).

## How to verify
```
npm run build && npm run typecheck      # must stay green
npm run start -- -p 3300 &              # then curl routes
curl -s localhost:3300/takeoff/ladder | grep -c "Cage hoop"
```
Golden oracle for the engine: the prototype `engine.jsx computeGuardrail` output (re-fetch
the bundle if needed). Keep solvers deterministic so output never flickers.

**Suggested kickoff:** "Read `docs/plan/NEXT-SESSION.md` and `docs/plan/README.md`, then
continue the build starting with Brief 09 (sub-assemblies + attachments). Work on branch
`claude/trusting-meitner-VEsKg`, commit per increment, verify with build+typecheck+curl."
