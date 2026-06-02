# Brief 04 — Systems + system authoring

**Milestone:** v1 (item 5) + v1.5 wizard (part of item 23) · **Depends on:** 01 · **Parallel:** with 03 · **Status:** ✅ done
(wizard authors + persists; version history → Brief 10)

> Systems list (`/systems`, primitive filter + search, **New system**) and detail
> (`/systems/[id]`: previews + Models + **Edit** + the Brief 09 AttachmentsEditor) are live.
> The **4-step authoring wizard** (`/systems/new`, `/systems/[id]/edit`) authors primitive,
> modifiers, variants+matrix, criteria, and properties, then persists via `saveSystemAction`
> → `Repository.saveSystem`. A live `deriveRuleContext` preview shows the SYSTEM_CTX the
> model/rule X-picker will consume.

## Owns
`systems.html` (list + detail with Models section) and `system-edit.html` **wizard steps 1–3 +
properties editor**. **Stubs (owned elsewhere):** spans + placement-rules editors → Brief 07;
attachments editor → Brief 09.

## Create
- `app/systems/page.tsx`, `app/systems/[id]/page.tsx`, `app/systems/[id]/edit/page.tsx`.
- `components/system-wizard/*`: `Step1Primitive` (primitive grid length/height/count + area/volume
  disabled v3, + "Allow segmentation" checkbox for length), `Step2Modifiers` (grouped editor incl.
  `banded_distance`/`support_grid` types), `Step3Variants` (attribute-columns bar +
  variant×property validity matrix + sticky variant inspector), criteria picker, `PropertiesEditor`
  (7 archetypes: spacing|count|rate|stock|variant|threshold|junction, archetype-specific inputs).

## Tasks
- [x] Systems list + detail (variants/modifiers/criteria/properties previews + Models section).
- [x] Wizard steps 1–3 author + persist a System. (4 steps: primitive, modifiers, variants &
      criteria, properties; `saveSystemAction` → `Repository.saveSystem`.)
- [x] Variant×property gating matrix + sticky inspector. (new `PropertyInstance.applies_to_variants`;
      the engine skips a property for variants where it's gated off.)
- [x] Properties editor covers all 7 archetypes and their inputs.
- [x] `deriveRuleContext(system)` produces a correct `SYSTEM_CTX` — surfaced live in the wizard.
- [x] Spans / placement / attachments panels visibly stubbed with "owned by Brief 07/09" notes.

## Definition of Done
- [x] Author a System end-to-end (primitive, modifiers, criteria, variants+matrix, properties)
      and persist it.
- [x] `deriveRuleContext` output matches what the rule editor's X-picker expects.

## Status notes (live)
- `components/system-wizard/`: `SystemWizard` (orchestrator + live rule-context preview),
  `Step1Primitive`, `Step2Modifiers`, `Step3Variants` (cols + rows + criteria + matrix +
  inspector), `PropertiesEditor`, `parts.tsx`. Attachments editor already exists (Brief 09).
- `Repository.saveSystem` (memory + Supabase) + `app/systems/actions.ts`.
- Routes: `/systems/new`, `/systems/[id]/edit`; entry points on the list ("New system") and
  detail ("Edit"). Version history + the rule **X-picker** mutations → Brief 05/10.
- Verified: build + typecheck green; `saveSystem` round-trips (4→5, matrix gating persisted);
  rule-context preview reflects the ladder; ladder MTO unchanged; all routes 200.
