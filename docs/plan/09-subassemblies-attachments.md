# Brief 09 — Sub-assemblies + attachments

**Milestone:** v1.5 (items 21, 22) + v2 (item 25 authoring) · **Depends on:** 08 · **Status:** ✅ done
(engine + screens; authoring mutations/persistence + version history deferred to Brief 10 by design)

## Goal
Sub-assembly library + authoring + uses in models, AND the full attachments feature (the
ladder + top-walkway case): the `system-edit.html` attachments editor, connection materials as
model rules, suppressions, recursive resolution, and one shared cut pool.

## Create
- `app/sub-assemblies/page.tsx` (browse: category filter, params, material cards, used-in) +
  "Open editor" authoring view (Materials / Parameters / SKU-lookups tabs, parameter table,
  three-knob material cards).
- `lib/engine/emit.ts` — sub-assembly inlining (bind params → run same `evaluateRule`).
- `lib/engine/attachments.ts` — 3-bucket inputs (derived/preset/open) → recursive `resolveTakeoff`
  → connection constraints → suppressions → connection materials → host cut pool.
- `components/system-wizard/AttachmentsEditor.tsx` (interface: connection points, model policy,
  presets locked/editable, derived bindings, suppressions, optional/default-included).

## Tasks
- [x] Sub-assembly = mini-model inlined via the shared evaluator with bound parameters.
      (`lib/engine/emit.ts`; params bind literal/modifier/criterion/variant-attr/chain/property/
      algorithm-output/expression; new `Rule.cut_length_param` for parametric cut lengths.)
- [x] Model `sub_assembly_uses` with parameter bindings + pin policy. (ladder model routes its
      bracket mounting through `sa-wall-bracket`, `count` ← mounting_brackets, bracket_length pinned.)
- [x] Attachment recursive resolution; connection materials (model-level rules); suppressions.
      (`lib/engine/attachments.ts` + `resolveModel` recursion in `index.ts`; ONE shared cut pool.)
- [x] The ladder screen's attachment section becomes engine-driven (no mock data).
      (toggle + open run-length, derived deck-height chip, locked-preset chip, +N lines, provenance tags.)

## Definition of Done
- [x] A model using `wall_bracket_assembly` inlines its materials at take-off.
      (ladder MTO: 7 brackets, 14 bolts, 7×800 mm L-bar cuts.)
- [x] A ladder→walkway attachment resolves recursively, adds connection materials + suppressions,
      with one combined cut pool. (cage hoops 24→23, walkway posts 4→3, gate added; the L-bar pool
      packs 7+3+2 = 12 cuts into 2 stocks, not 3.)
- [~] Sub-assembly authoring persists (version history → Brief 10). Browse + authoring **screen**
      built (`/sub-assemblies`: category filter, parameter table, three-knob material cards, used-in)
      and an **AttachmentsEditor** on `/systems/[id]`; mutations/persistence + version history are
      deferred to Brief 10 **by design** (the DoD scopes persistence there).

## Status notes (live)
- Engine is still pure + data-driven: no per-system branching; `resolveTakeoff` and
  `evaluateRuleAgainstSample` share `evaluate.ts`; the attached system runs through the same
  `resolveModel` core recursively.
- New engine modules: `lib/engine/emit.ts`, `lib/engine/attachments.ts`, `lib/engine/internal.ts`
  (shared types, breaks the index↔emit/attachments import cycle).
- New screens/components: `app/sub-assemblies/page.tsx` + `components/subassemblies/`,
  `components/system-wizard/AttachmentsEditor.tsx`; ladder take-off wired in
  `components/takeoff/primitive-takeoff.tsx`.
- Verified green: `npm run build` + `npm run typecheck`; curl checks on `/takeoff/ladder`,
  `/sub-assemblies`, `/systems/sys-ladder` (+ no regressions on guardrail/anchors).
