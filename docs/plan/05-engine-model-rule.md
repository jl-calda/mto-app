# Brief 05 — Engine core + Model & rule authoring  ⟵ make-or-break, critical path

**Milestone:** v1 (items 6, 7) · **Depends on:** 04 · **Status:** ✅ done

> Engine core implemented & verified (`lib/engine`): generic dimension chain
> (length/height/count), property archetypes (spacing/count/rate/threshold),
> the 5 quantity patterns, `applies_when` (variant ∧ criteria), SKU = referenced
> material, consolidation, `deriveRuleContext`, and `evaluateRuleAgainstSample`
> — all pure, no per-system branching. Proven via the live take-offs.
> Model/rule editor live at `/models/[id]`: editable material list (add/remove) +
> **editable three-knob rule** (qty_kind radio, the X-picker constrained to the
> system context, applies_when variant chips + criteria) + a **live-evaluation pane**
> that reacts to the draft rule via the SAME `evaluateRuleAgainstSample`. Persists
> via `saveModelAction` → `Repository.saveModel`.

## Goal
The **working single-primitive interpreter** (length + count; no segmentation/algorithms/
attachments yet) AND `model-edit.html` + `material-rule.html` driven by it. One evaluator, two
entry points.

## Create
- `lib/engine/rules/{evaluate,resolve-x,quantity,sku,scope,english}.ts`
- `lib/engine/context.ts` (buildContext for a single segment)
- `lib/engine/geometry/dimension-chain.ts` (length + count roles)
- `lib/engine/index.ts` real `resolveTakeoff` (single-primitive path) + `evaluateRuleAgainstSample`
- `lib/engine/deriveRuleContext.ts`
- `app/.../model/edit` — material cards, 3 knobs (variant/criteria scope; quantity radio with 5
  patterns; SKU literal/lookup), sub-assemblies tab stubbed, dry-run slide-over.
- `app/.../material/[id]/rule` — 5 knob sections, X-picker constrained to system context, sticky
  live-eval pane with the 4-step trace (variant → criteria → quantity → SKU).

## Tasks
- [x] 5 quantity patterns (`fixed|per|per_length|cut|algorithm`) + `applies_when` + SKU resolution.
- [x] `resolveX` for property/derived/chain/primitive_input (algorithm_output → Brief 08).
- [x] `englishify(rule)` plain-language preview.
- [x] Model editor list ↔ rule editor; live-eval pane = `evaluateRuleAgainstSample`; **rule editable
      via the X-picker** (constrained to `deriveRuleContext`) + add/remove materials + persist.
- [ ] **Engine unit tests** — golden `computeGuardrail` reproduction. *(deferred to Brief 12
      testing/CI — verified by hand against the live take-offs in the meantime.)*

## Definition of Done
- [x] Live pane reacts to sample edits (fires/qty/sku/formula + skip reason) — and to rule edits.
- [x] Model dry-run matches the prototype guardrail output (minus algorithm lines).
- [x] Anchors (count) model correct with input-only chain.
- [x] **Zero per-system branching in `lib/engine`.**

## Status notes (live)
- Rule X-picker in `components/model/model-editor.tsx`: per-target options built from
  `deriveRuleContext` (properties + derived + primitive_input + per-metre); algorithm rules pick a
  solver; applies_when via variant chips + per-criterion allowed values. The draft rule feeds the
  live-eval pane in real time.
- `Repository.saveModel` (memory + Supabase, syncs the parent system payload) + `app/models/actions.ts`.
- `deriveRuleContext` exposes `flights`/`rest_platforms` for height systems.
- Golden unit tests are the one open item, folded into Brief 12 (CI).
