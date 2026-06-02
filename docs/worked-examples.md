# Worked examples — Securope · Vectaladder · EVO

The three products from the *Worked Examples Guide* are seeded into the app
(`lib/repo/seed/examples.ts`) and pinned by golden tests
(`lib/repo/seed/examples.test.ts`, run via `npm test`). They are browsable under
`/systems`, their model rules are editable in the model editor, and the engine
reproduces the worked take-offs.

## Engine features added to support them

The guide exposed real gaps; these were implemented (see
`docs/plan/*` and the engine):

- **SKU lookups** — `Rule.sku_lookup` resolves a line's SKU from a model
  `SkuLookup` table by keys: `literal` / `modifier` / `modifier_band`
  (banded_distance → band's `sku_key`) / `criterion` / `property_input` /
  `variant_attr`. Used by: ladder bracket (`BRK-205-CON` by wall-offset band +
  substrate), exit landing (`02662` by width), guardrail base (`BASE-FS` by type).
- **`place_supports`** now honours `min_count_in_region` and snaps to a regular
  `support_grid` (purlins).
- **`applies_when.modifiers`** — rules gate on modifier equality (substrate,
  upright_angle, …); sub-assembly materials too.
- **loop / end-role derived counts** — `is_loop`, `free_ends_count` (0 for loops),
  `free_foot_count`, `free_head_count` (end anchors, foot/head details, turnbuckle).

## Verified take-offs (engine's exact output)

| Product | Inputs | Key lines (golden) |
|---|---|---|
| **Securope** §1D | fall-arrest, 12+8+10 m (2 corners), metal-deck, 2 users | cable **30 m**, NEO **2**, end anchor **2**, tensioner **2**, crimp **6**, corner **2**, traveller **2**, deck bracket **2** + EPDM **2** (sub-assembly), id-plate 1 |
| **Vectaladder** §2D | cage, 14 m, wall-offset 210, concrete, landing 800 | **2 flights** + 1 rest platform, rungs **51**, stile 3 + splice **4**, bracket **8 × BRK-205-CON**, cage hoop 27, band 10, exit **02662**, gate, plate |
| **EVO** §3D | freestanding, 10+6 m (1 corner), wind zone 1, toeboard + gate | upright **12**, handrail **6** + knee **6**, base **12 × BASE-FS**, counterweight **26** (2/upright + 1/free-end), corner 1, cap 4, toeboard 6 + corner + 12 brackets, gate 1 |
| **Securope loop** | closed loop | turnbuckle **1**, end anchors **0** |
| **Ladder → EVO** | walkway attachment | joint kit **03008 ×1** + EVO walkway lines, one cut pool |

## Concept → mechanism (all exercised)

segmentable length + corner junctions · height auto-flights · `count` · tight/
spaced `pack_stock` · threshold cage over a `per_span` · `place_supports`
(max-spacing, clearances, `min_count_in_region`, grid snap, forbidden/required) ·
`algorithm_output` X-refs · per-`free_ends`/`free_foot`/`free_head` · cuttable +
shared cut pool + offcut reuse · sub-assemblies (param bindings incl. substrate) ·
attachments (3-bucket, suppressions, connection materials) · variant SKU swaps ·
**SKU lookups** (banded / width / type) · one system → N models (EVO).

## Honest fidelity notes (vs the guide's "~" estimates)

The engine is faithful to the *stated* rules, so a few counts are slightly under
the guide's hand-rounded figures — these are correct, not bugs:

- **Intermediate / upright counts** come straight from `place_supports` at the
  stated `max_spacing` (Securope 10 m → 2 NEO; EVO 1.5 m → 12 uprights). The guide
  rounds these up.
- **Corners aren't force-injected into placement** yet — corner *kits* are counted
  per junction, but `place_supports` doesn't add a forced support at each corner
  (would need geometry→placer wiring). Follow-up.
- **Brackets place over the whole run**, not per flight (the `algorithm` quantity
  resolves on the run chain). Per-segment placement is a follow-up.
- **Wind-zone counterweight scaling** is fixed at 2/leg (zone 1) via the rule; the
  2/3/4 scaling by `wind_zone` wants `criteria_driven_defaults`. Follow-up.
- **Rest-platform L/R** uses one SKU; handedness-by-junction needs a `junction_attr`
  SKU key. Follow-up.

## Not yet built (browsable systems, but no bespoke take-off screen)

The three systems list + their models are editable, and the golden tests drive the
engine directly. Dedicated take-off **screens** for them (with the `users` /
`landing_width` / toeboard property inputs) are a follow-up — the shared
`PrimitiveTakeoff` covers length/height but doesn't yet expose arbitrary property
inputs.
