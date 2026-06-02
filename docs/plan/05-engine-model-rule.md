# Brief 05 — Engine core + Model & rule authoring  ⟵ make-or-break, critical path

**Milestone:** v1 (items 6, 7) · **Depends on:** 04 · **Status:** in progress

> Engine core implemented & verified (`lib/engine`): generic dimension chain
> (length/height/count), property archetypes (spacing/count/rate/threshold),
> the 5 quantity patterns, `applies_when` (variant ∧ criteria), SKU = referenced
> material, consolidation, `deriveRuleContext`, and `evaluateRuleAgainstSample`
> — all pure, no per-system branching. Proven via the live take-offs.
> Model/rule editor live at `/models/[id]`: material list (English rule summaries) +
> three-knob rule display + a **live-evaluation pane** (editable sample inputs →
> fires/skip badge, resolved qty/SKU, 4-step trace) that calls the SAME
> `evaluateRuleAgainstSample`. Next: make the rule itself editable (X-picker) + persist.

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
- [ ] 5 quantity patterns (`fixed|per|per_length|cut|algorithm`) + `applies_when` + SKU resolution.
- [ ] `resolveX` for property/derived/chain/primitive_input (algorithm_output **stubbed** till 08).
- [ ] `englishify(rule)` plain-language preview.
- [ ] Model editor list ↔ rule editor; live-eval pane = `evaluateRuleAgainstSample`.
- [ ] **Engine unit tests** — golden: reproduce `computeGuardrail` MTO for a fixed input (minus
      algorithm-driven lines, deferred to 08). Prototype is the oracle.

## Definition of Done
- [ ] Live pane reacts to sample edits (fires/qty/sku/formula + skip reason).
- [ ] Model dry-run matches the prototype guardrail output (minus algorithm lines).
- [ ] Anchors (count) model correct with input-only chain.
- [ ] **Zero per-system branching in `lib/engine`.**
