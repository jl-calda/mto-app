# Brief 09 — Sub-assemblies + attachments

**Milestone:** v1.5 (items 21, 22) + v2 (item 25 authoring) · **Depends on:** 08 · **Status:** not started

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
- [ ] Sub-assembly = mini-model inlined via the shared evaluator with bound parameters.
- [ ] Model `sub_assembly_uses` with parameter bindings + pin policy.
- [ ] Attachment recursive resolution; connection materials (model-level rules); suppressions.
- [ ] The ladder screen's attachment section becomes engine-driven (no mock data).

## Definition of Done
- [ ] A model using `wall_bracket_assembly` inlines its materials at take-off.
- [ ] A ladder→walkway attachment resolves recursively, adds connection materials + suppressions,
      with one combined cut pool.
- [ ] Sub-assembly authoring persists (version history → Brief 10).
