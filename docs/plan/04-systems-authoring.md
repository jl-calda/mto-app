# Brief 04 — Systems + system authoring

**Milestone:** v1 (item 5) + v1.5 wizard (part of item 23) · **Depends on:** 01 · **Parallel:** with 03 · **Status:** in progress

> Systems list (`/systems`, primitive filter + search) and detail (`/systems/[id]`:
> variants/modifiers/criteria/properties previews + Models section) are live, wired to
> `getRepo()`. Next: the 4-step authoring wizard + properties editor (mutations).

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
- [ ] Systems list + detail (variants/modifiers/criteria/properties previews + Models section).
- [ ] Wizard steps 1–3 author + persist a System.
- [ ] Variant×property gating matrix + sticky inspector.
- [ ] Properties editor covers all 7 archetypes and their inputs.
- [ ] `deriveRuleContext(system)` produces a correct `SYSTEM_CTX` (verified by Brief 05 X-picker).
- [ ] Spans / placement / attachments panels visibly stubbed with "owned by Brief 07/09" notes.

## Definition of Done
- [ ] Author a System end-to-end (primitive, modifiers, criteria, variants+matrix, properties)
      and persist it.
- [ ] `deriveRuleContext` output matches what the rule editor's X-picker expects.
