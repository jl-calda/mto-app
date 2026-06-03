# Handoff — MTO app (state at 2026-06-03)

**Branch:** `claude/awesome-carson-jmyxN` — open in **PR #6** → `claude/trusting-meitner-VEsKg` (production branch). **Not merged yet** → production still serves a *build-time snapshot* until #6 lands.
**Health:** `npm run typecheck` + `npm run build` (all 22 routes `ƒ` dynamic) + `npm test` → **58 tests** green.

## Shipped this session
| Area | Commit | Note |
|---|---|---|
| Live-DB rendering (`force-dynamic`) + real env badge | `0b00483` | the change that flips prod onto per-request DB reads |
| Editable property inputs in the take-off screen | `eeb92fe` | properties only — **not modifiers** |
| Per-segment placement + corner-forcing | `037e6f4` | `PlacementRules.per_segment` |
| Wind-zone counterweight scaling (2/3/4) | `dad0ff1` | three gated rules |
| Rest-platform handedness (L/R) | `9352e07` | whole-ladder, via `landing_side` modifier |
| a11y touch-up + unit tests | `56860bb` | partial a11y; pure-function tests only |

DB: the live Supabase project (`kzprzimqdhqnttkvdxpb`) is seeded (10 tables). Production env has the Supabase keys; **preview deployments do not** (scoped to production).

---

## ⚠️ Critical gap — modifiers/criteria are not editable in the take-off UI
`components/takeoff/primitive-takeoff.tsx` edits **properties** but **not modifiers**, and criteria are read-only (Section 02). So `landing_side`, `wall_offset`, `substrate`, `upright_angle`, `base_type`, `support_grid`, and **`wind_zone`** apply via **defaults only**. The wind-zone scaling, rest-platform handedness, and bracket-SKU-by-band therefore **can't be exercised from the UI** even though the engine/data support them. **Build this first.**

## Bounded / incomplete logic (by area)

### Force-dynamic — `app/layout.tsx`
- Blunt global `dynamic = 'force-dynamic'`; makes *every* route dynamic and adds **no caching** (every request hits the DB under Supabase). Wants per-route `dynamic`/`revalidate` or `cache()` on read-heavy pages.

### Property inputs — `primitive-takeoff.tsx` (`eeb92fe`)
- `variant`-kind inputs are filtered out (`i.type.kind !== 'variant'`) — sub_inputs unrendered.
- No `applies_to_variants` gating in the UI: properties show editable even when they won't fire for the selected variant.
- `enum` control is typecheck-only (no seeded product uses it).
- New editing logic (state seed / `setPropInput` / `renderPropControl`) has **no render test**.

### Per-segment / corner-forcing — `lib/engine/algorithms/place-supports.ts`, `lib/types/property.ts` (`037e6f4`)
- `placeSegmented` uses **even** distribution (`evenSpan`); whole-run uses **greedy** `place()`. Counts align for single segments but the two modes place posts differently — latent inconsistency.
- `min_count_in_region` / `forbidden_zones` / `support_grid` with `per_segment` are **untested** (no product combines them).
- **"Per-flight for the ladder" is NOT done.** Height = one segment, so `per_segment` is a no-op for the Vectaladder; splitting a climb at rest-platform junctions was never implemented. `docs/worked-examples.md` slightly overstates this — fix the note.
- Posts land at exact segment ends (0 and L), ignoring `end_clearance` for *position*.

### Wind-zone scaling — `lib/repo/seed/examples.ts` (`dad0ff1`)
- Implemented as **three duplicated rules** (`em-cw` / `em-cw-z2` / `em-cw-z3`) gated on `wind_zone` `'1'/'2'/'3'`. **No fallback** → `wind_zone: '4'` silently yields **zero** counterweights.
- The intended mechanism `criteria_driven_defaults` is still **declared-but-unused** (`lib/types/model.ts:36`).
- Only counterweights scale; spacing/anchors don't.

### Rest-platform handedness — `examples.ts` (`9352e07`)
- Whole-ladder single side via `landing_side` modifier. **Not** per-junction *alternation* (switchbacks). Needs a `junction_attr` SKU key + per-junction emission.

### a11y + tests — (`56860bb`)
- a11y is a **touch-up, not an audit**: only `Visual`, take-off toggles, two editor ✕ buttons. **Not** done: list pages (`/systems`, `/projects`, `/inventory`, `/materials`), `anchors-takeoff`, `area-takeoff`, system-wizard, modal focus traps, keyboard nav, **color contrast (never checked)**, heading order, form-error announcement. No `axe`/automated pass.
- Tests are **pure-function only**. React components (incl. the new property editing) have **zero** render tests. No e2e/component framework (Playwright + jsdom is a separate setup).

## Untouched / backlog
- **PR #6 open, not merged** — merge to flip production to live per-request DB.
- 🔴 deploy-gated: auth/RLS, transactional inventory reservations, realtime, Vercel Storage. (Code parts — RLS policies, reservation logic, realtime layer — are writable here; the wiring is dashboard-side.)
- 🟡 criteria-driven-defaults "flash"; `criteria_driven_defaults` is dead code.
- 🔵 v3 stretch: multi-grid solver, property templates, bulk upgrades, complex-shape editor.

## Suggested next-session order
1. **Modifiers + editable criteria in the take-off UI** — unblocks wind-zone, handedness, bracket bands.
2. Implement `criteria_driven_defaults` → collapse the 3 wind-zone rules + add a zone fallback.
3. Per-flight placement for the **ladder** (split height at rest-platform junctions).
4. Component/e2e harness + a real a11y audit (axe).

## Architecture guardrails (unchanged — keep these)
- Engine in `lib/engine` is **pure & data-driven** (no per-system branching; one core for resolve + evaluate).
- Repo abstraction: `memory-repo` (seed) ↔ `supabase-repo` behind one interface; selected by `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` at runtime.
- Workflow per increment: `npm run typecheck` + `npm run build` + `npm test`, then commit and push to the branch. Don't open a PR unless asked.
