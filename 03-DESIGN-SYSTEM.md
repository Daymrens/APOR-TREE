# Design System — [FAMILY_NAME] Reunion

## Concept
The family tree isn't a page you visit — it's the spine the whole site is built on. On the homepage, a single branching line grows down the center of the screen; each generation is a node on that line, and the RSVP, schedule, gallery, location, and games sections are leaves branching off it. Navigating the site *feels* like tracing the family line. Numbering/generation markers earn their place here because the content genuinely is sequential — real generations, in real order.

This also solves a real UX problem, not just a decorative one: people scanning for "when do I need to show up" and people who want to linger on the family history are served by the same layout, at different scroll depths.

## Self-check against generic AI defaults
Before locking this in — checked against the three clustering looks: not cream+terracotta (palette below uses green/magenta/gold, no clay-orange), not near-black+neon accent, not hairline-rule broadsheet columns. The branching spine is also not a generic numbered-list treatment (01/02/03) — it's a literal tree, not decorative numbering standing in for one.

## Design tokens

**Color**
| Token | Hex | Use |
|---|---|---|
| `--balete-deep` | `#1E3B2C` | Dark anchor — header, footer, tree trunk line |
| `--parchment` | `#F1E8D6` | Primary light background — evokes an old family album page |
| `--hibiscus` | `#C23B6E` | Primary accent — CTAs, active states, "you are here" marker |
| `--mango` | `#E8A63D` | Secondary accent — generation markers, highlights, badges |
| `--rattan` | `#C9A876` | Tertiary — branch lines, dividers, muted borders |
| `--ink` | `#2B2620` | Body text |
| `--ink-soft` | `#5C5445` | Secondary text, captions |

**Type**
| Role | Face | Notes |
|---|---|---|
| Display | Fraunces (variable, high optical size) | Warm, high-contrast serif — headlines, family name, generation labels. Use its ornate italic sparingly for emphasis, not body copy. |
| Body | Inter | Clean, legible at small sizes for forms and long RSVP lists |
| Utility/data | IBM Plex Mono | RSVP counts, timestamps, schedule times — gives numbers a "ledger" feel that matches the heirloom concept |

Type scale: `display-xl` 56/60 (hero name), `display-lg` 36/40 (section titles), `body` 16/24, `caption` 13/18, `mono-data` 15/20 tabular-nums.

**Layout**
- Desktop: centered tree spine, max content width 1100px, sections alternate left/right off the spine.
- Mobile: spine collapses to a left-aligned vertical line (like a timeline rail), sections stack full-width to its right. Same structural idea, honest reflow — not a shrunk desktop layout.
- Radius: 12px on cards, 999px (full) on pills/badges/nodes — nodes should read as organic, not boxy.
- Spacing scale: 4/8/12/16/24/32/48/64.

**Signature element — the Tree Spine**
- SVG bezier curves (not straight lines/right angles) connecting generation nodes, hand-drawn feel via slight curve variance.
- Each node: a circular photo (or initial monogram if no photo yet) ringed in `--mango`, with name in `display` face beneath.
- Active/current generation pulses subtly on load, then settles — one orchestrated moment, not continuous animation.
- Branch color-coding: when a branch filter is active, unselected branches drop to 30% opacity rather than disappearing, so the shape of the whole tree stays visible.

## Wireframe (desktop, homepage)
```
┌─────────────────────────────────────────────┐
│  [FAMILY_NAME] Reunion   [EVENT_DATE]        │  ← header, balete-deep bg
├─────────────────────────────────────────────┤
│                                               │
│         ●  Lolo & Lola  (Gen 0)              │  ← hero node, largest
│         │                                     │
│      ┌──┴──┐                                 │
│      ●     ●   Gen 1 branches                │
│    ╱ │     │ ╲                               │
│  RSVP │  Gallery                              │ ← leaf cards branch off nodes
│       │                                       │
│    Schedule   Location   Games                │
│                                               │
│   "142 confirmed · 187 expected" (mono)      │
└─────────────────────────────────────────────┘
```
Mobile: same content, spine moves to left rail, everything stacks vertically beneath it.

## Components
- **Node** — circular photo/monogram + name label, three sizes (hero/generation/leaf).
- **Leaf card** — the RSVP/Gallery/Schedule/etc. entry points, rounded 12px, parchment bg, hibiscus accent border on hover/focus.
- **Counter** — mono numerals, animates count-up once on load (not on every re-render).
- **Form fields** — parchment fill, rattan border, hibiscus focus ring, generous 16px padding (this will mostly be used on phones at a family gathering — big touch targets).
- **Empty states** — e.g. gallery with no photos yet: "No photos yet — be the first to add one from the reunion." Direct, inviting, no filler.

## Motion
- One orchestrated load sequence on the homepage: trunk draws in first (stroke-dashoffset animation), then nodes fade/scale in generation by generation, top to bottom. ~1.2s total, respects `prefers-reduced-motion` (skip straight to end state).
- Elsewhere: quiet. Hover states are simple opacity/border shifts, no bouncing or parallax — the tree draw is the one moment of boldness; everything else stays disciplined.

## Copy voice
- Plain, warm, direct — written like a family member organizing this, not a corporate event platform.
- Buttons say what they do: "Confirm my RSVP," not "Submit." A submitted RSVP confirmation says "You're confirmed!" — same vocabulary carried through.
- Errors are specific and helpful: "That passcode didn't match — check with [contact person] for the right one," not "Invalid input."
- No fiesta clip-art tone, no exclamation-point overload — warmth comes from directness, not decoration.

## Accessibility floor
- All node/card interactions reachable and operable by keyboard, visible focus rings in `--hibiscus`.
- Color is never the only signal for branch filtering — filtered-out branches also reduce in scale slightly, not just opacity.
- Contrast: `--ink` on `--parchment` and `--parchment` on `--balete-deep` both pass WCAG AA for body text.
