# MTO — take-off engine

A construction take-off tool for safety-and-access systems (lifelines, ladders,
guardrails, anchor points, walkways). Estimators enter measurements and design
choices; the app produces a bill of materials (MTO — Material Take-Off) for
procurement.

This repo implements the design handed off from Claude Design. The first screen
built is the **Plant access ladder take-off**.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- Plain global CSS for the design tokens (CAD / engineering aesthetic: warm
  paper surfaces, IBM Plex Sans + Mono, monospaced tabular numerics, 1px
  borders). No CSS framework — inline styles mirror the design prototype for
  pixel fidelity.

## What's implemented

The take-off-ladder screen (`/takeoff/ladder`) — a faithful port of the design
bundle's `takeoff-ladder.html`:

- Two-pane layout: left = inputs mirroring the system structure, right = sticky
  **Live MTO**.
- **01 System variant** tiles, **02 Criteria**, **03 Primitive · height** with
  the four-step **dimension chain** (`input → adjusted → constrained →
  quantized`) including the constraint trace (dominant candidate flagged) and a
  "Hide/Show derivations" toggle.
- **04 Properties** rows (spacing / threshold / algorithm-driven / junction /
  rate / count archetypes) with gating tags, formulas, and the `pack_stock`
  algorithm-output panel.
- Auto-split info banner (climb exceeds `flight_max` → 2 flights + rest platform).
- **05 Attachment · Top walkway** — the optional attached system folded inline,
  with the three input buckets (**Derived** / **Preset** / **Open**), an Include
  toggle, model picker, and the suppression note. Toggling Include folds the
  walkway's materials into the live MTO under a "from attachment" group.
- MTO rows carry leading visual icons (mapped from SKU), a summary strip, and
  CSV/PDF actions.

### Shared chrome ported from the design system

- `components/chrome.tsx` — `Shell`, `TopBar`, `Sidebar`, `PrimitiveBadge`,
  `Stat`, and the inline-SVG `Icon` set (from `chrome.jsx`).
- `components/visual.tsx` — the universal `Visual` component, built-in icon
  library, and hash-color placeholder (from `visuals.jsx`).
- `app/globals.css` — design tokens (from `tokens.css`).

## Scope

Only the ladder take-off screen is wired up. The sidebar/breadcrumb link to other
workspace screens (Systems, Variants, Sub-assemblies, Materials, Inventory, other
take-offs) that are designed but not yet built — those routes render an on-brand
"not built yet" placeholder. Visiting `/` redirects to `/takeoff/ladder`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /takeoff/ladder
```

Other scripts:

```bash
npm run build      # production build (Turbopack) + type-check
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```
