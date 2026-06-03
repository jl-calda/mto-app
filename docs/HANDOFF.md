# Handoff — MTO app (state at 2026-06-03)

## ⮕ Session handoff (branch `claude/takeoff-modifiers-criteria-fPnTV`, latest)
**Repo:** `/home/user/mto-app` · Next.js (App Router), TS, Tailwind v4 + CSS tokens. **Backend:** in‑memory seed by default (`lib/repo/memory-repo.ts`); Supabase when `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY` set. **Repo interface is symmetric** — add every method to BOTH memory + supabase impls (`lib/repo/*`). **Engine `lib/engine/*` is pure & data‑driven — don't change its semantics.**
**Health:** `npm run typecheck && npm run build && npm test` → **88 tests green**. Branch pushed; **no PR opened** (open only if asked).

**Shipped this session (newest first):**
1. **Guide → realtime dependency graph.** `lib/help/tree.ts` (`buildSystemTree`, `GENERIC_TREE`) → an **Inputs**(Measurement/Variants/Modifiers/Criteria/Properties, with property→variant gating chips) **→ Outputs**(Models→MTO) columned node‑link in `components/help/dependency-graph.tsx`. Panel is **tabbed**: `Tree` (default) | `Glossary`. Help context gained `subject`/`setSubject` + `view`/`setView`; pages publish via `components/help/help-subject.tsx` (system detail page) and a live `useEffect` in `SystemWizard`. **Deferred:** live take‑off tree (take‑off screens use the generic fallback; engine already exposes `trace`/`chain`/`mto` sources to build it).
2. **System wizard reorder.** Steps now `Primitive → Variants & criteria → Modifiers → Properties`; the **variant×property matrix moved into the Properties step** (was stranded in Variants). Files: `components/system-wizard/{SystemWizard,Step3Variants,PropertiesEditor}.tsx`. Presentational only.
3. **Type‑driven inputs.** `components/inputs/` (`resolve-control.ts` pure resolver + `controls.tsx` `TypedField`/Select/Chips/Token/Number/**Band**/Toggle/Text/Advanced). Adopted in take‑off (`primitive-takeoff.tsx`, `area-takeoff.tsx`) and authoring (`model-editor`, `subassemblies-browser`, `variant-editor`). **Fixed:** `banded_distance` now shows bands (was an unbounded box) — shared pure `lib/engine/bands.ts` `activeBandIndex`; `support_grid`/`discrete_set` now visible as "advanced"; criteria show "list" vs "free text"; CSV pick‑lists → chips.
4. **In‑app Guide** (`components/help/*`, `lib/help/content.ts`) + persistent TopBar **Guide** button focused per active tab (`topicForNav`).
5. **Button/logic audit:** delete actions for Project/System/Model/Take‑off (+ guards `lib/repo/guards.ts`; fixed supabase `saveTakeoff`/`deleteTakeoff` project‑payload sync); full **sub‑assembly** + **attachment** authoring; area/volume sidebar links fixed.

**Conventions:** new pure logic → `lib/**` with a co‑located `*.test.ts` (vitest). UI reuses CSS tokens (`bg-panel`, `border-line`, `var(--accent)`, `.tag`, `.uc`) and `Icon.*` from `components/chrome.tsx`. Server actions return `{ok,id?,error?}` and `revalidatePath`. **Gotcha:** don't `pkill -f next` to free the dev port (it matches your own shell) — use `fuser -k 3000/tcp`. Verify UI via `npm run start` + curl (the panel/tree render client‑side once opened).

**Open ideas / next:** live take‑off resolution tree; widen Guide panel (currently 360px, columns scroll horizontally); a11y/render tests; sub‑assembly SKU‑lookup table authoring.

---

**Branch:** `claude/awesome-carson-jmyxN` — open in **PR #6** → `claude/trusting-meitner-VEsKg` (production branch). **Not merged yet** → production still serves a *build-time snapshot* until #6 lands.
**Health:** `npm run typecheck` + `npm run build` (all 22 routes `ƒ` dynamic) + `npm test` → **58 tests** green.

## Button/logic audit (branch `claude/takeoff-modifiers-criteria-fPnTV`)
A full audit of every interactive control found the app ~96% wired; the dead/broken set was small and is now resolved (**75 tests** green):
- **Area/volume take-off links** — `shell.tsx takeoffHref()` no longer returns `#`; points at `/takeoff/area`. Removed the now-unused `ResourcePlaceholder`.
- **Delete actions** — Projects / Systems / Models / Take-offs are now deletable (repo methods in both memory + supabase, server actions, confirm-guarded `DeleteButton`). Referential-integrity guards (`lib/repo/guards.ts`) block deleting a system/model still used by a take-off; nested models cascade with their system. Also fixed a latent supabase bug: `saveTakeoff`/`deleteTakeoff` now keep `project.payload.takeoffs` in sync.
- **Sub-assembly authoring** — the editor is now a controlled draft: `+ Add material`/`+ Add parameter` work, the three rule knobs are editable (applies-when gating, quantity incl. `cut_length_param` + per-target over the sub-assembly's params), with draft Save + Publish. Pure helpers in `lib/subassembly-authoring.ts`.
- **Attachment authoring** — `AttachmentsEditor` on the system detail page is fully editable (`+ Add attachment` + connection/constraints/presets/derived/suppressions/model-policy), persisted via `saveSystemAttachmentsAction`. Pure builders in `lib/attachment-authoring.ts`.
- Still UI-only / out of scope: sub-assembly SKU-lookup *table* authoring (direct SKUs shown), and a real a11y/render-test pass.

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

## ✅ Resolved — modifiers/criteria are now editable in the take-off UI
`components/takeoff/primitive-takeoff.tsx` now renders an editable **Modifiers** section (03) — one control per enabled system modifier, typed by `ModifierType` (enum/enum_with_attributes → select, bool → switch, distance/number/percentage/banded_distance → number; `support_grid`/`discrete_set` listed but skipped for now). **Criteria** (Section 02) are editable too: a select where the gating rules enumerate allowed values (e.g. EVO `wind_zone` → 1/2/3), free text otherwise. Both feed `resolveTakeoff`'s `modifier_values`/`criteria_values` (were hardcoded `{}`/read-only) and persist via `buildTakeoff` + the save signature. Seeding mirrors the engine's resolution order (system default → `model.modifier_defaults` → saved `takeoff.modifier_values`) through new pure helpers `deriveModifierValues` / `deriveCriteriaOptions` in `lib/takeoff-init.ts` (unit-tested). `app/takeoff/[id]/page.tsx` (and the static ladder/guardrail routes) thread saved `modifier_values` like `initialProps`. Verified: EVO `wind_zone` 2 → **38** counterweights, Vectaladder `landing_side` right → **REST-PLATFORM-R** are reachable from the UI-seeded values (tests in `lib/takeoff-init.test.ts`).

Remaining UI gaps: `support_grid`/`discrete_set` modifier editing; no React render test (helpers are pure-tested only); `applies_to_variants`/variant-kind property inputs still unrendered (see below).

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
