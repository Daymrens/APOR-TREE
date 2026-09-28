# Contract: apor-family-ui-redesign

Status: DRAFT
Commodore: opencode/deepseek-v4-flash-free
Stack: frontend: nextjs | lang: typescript (target file: static HTML in /public)

## Goal

Redesign the UI of the standalone page `public/apor-family.html` (family reunion site:
member contribution form, interactive family tree with directory/search, i18n en/tl/ceb).
Visual + interaction polish only, applied across the whole page as one coherent design
system. LIGHT MODE is the design direction (user decision). All existing behavior stays
functionally identical: 128-member tree engine, tidy-tree layout, orthogonal branch-colored
edges, zoom 0.4-1.6 / drag-pan / Fit, branch filter chips with reflow, legend, directory
panel with search + empty state, 8-field detail panel, language switcher.

## Design direction (recorded)

- Light-mode-first: cool neutral palette (not the overused warm cream #F4F1EA + serif +
  terracotta #D97757 combo, not acid-green-on-near-black). Backgrounds in cool off-white /
  blue-grey range; ink near-charcoal blue; branch palette stays the source of color accent.
- Typography: one display face used with restraint (oversized page/hero title) + one body
  face + keep the existing data/utility styling. No new font files unless already present;
  the page is a standalone static file with no build step — system font stacks or the
  existing fonts only. No external font downloads if that breaks standalone/offline use.
- Signature element: the family tree itself as the visual centerpiece on a clean light
  canvas, with an oversized typographic page title above it. Everything else stays quiet
  and disciplined.
- Tokens: single named token set in :root (color roles, type, spacing scale, radius,
  shadows) applied to every surface. Current CSS variables (--ink, --line, --surface-3,
  --accent, etc.) get reorganized/renamed where needed, keeping one vocabulary.
- Motion: subtle, respectful (family site): hover states, focus rings, light reveal on
  tab open / panel open. prefers-reduced-motion honored (no motion when set). No scroll-
  driven gimmicks on a data page; no new JS animation libraries.
- Accessibility-first: contrast AA on all text, keyboard nav, visible focus states.
- Anti-pattern self-check against the 2026 skill list: no cream+serif+clay default, no
  acid accent, no default-Tailwind look, hero is not "big number + small label + blob".

## Phases (single file; serialized writer)

### Phase 1 -- Design tokens + header/hero + tabs (no deps)
- [ ] Define the full token set in :root (light palette with named roles, type scale,
      spacing scale, radius, shadows) and apply to the page shell.
- [ ] Redesign header (brand block + motto + language switcher) and page title into an
      oversized typographic hero consistent with the token set.
- [ ] Restyle the tab row (Member Form / Family Tree / Directory buttons) to the new
      system; keep all ids/onclick handlers intact.
- **Success criteria:** tokens defined and used across shell; header/tabs visibly
  redesigned; no console errors; all tabs still switch views; screenshot evidence.

### Phase 2 -- Member form tab restyle (depends on Phase 1)
- [ ] Restyle the contribution form (fields, labels, select/date inputs, submit button,
      banners, copy-json) with the new tokens; layout stays usable on desktop + mobile.
- **Success criteria:** form renders with new styling; all fields functional (submission
  still posts to the same endpoint); no console errors; screenshot evidence.

### Phase 3 -- Tree tab restyle (depends on Phase 2)
- [ ] Restyle tree toolbar (legend, filter chips, directory-adjacent controls, zoom
      buttons, Fit), tree surface/scroll container, node boxes (branch borders, badges,
      deceased styling), edges, directory panel, and detail panel with the new tokens.
- **Success criteria:** tree renders with new styling; filters/zoom/pan/fit/search/
      detail all still work; branch palette colors unchanged; no console errors;
      screenshots: full tree, filtered state, directory open, detail open.

### Phase 4 -- Motion, a11y, print, responsive, smoke (depends on Phase 3)
- [ ] Add subtle motion (hover/focus/panel transitions) with prefers-reduced-motion
      honored; verify visible focus states and AA contrast on key text.
- [ ] Print media query hides chrome (lang bar, tabs, toolbar, directory, detail) and
      prints the tree cleanly with the new styles.
- [ ] Verify responsive at 1440 and 390 (no horizontal overflow; toolbar/panels usable).
- [ ] `npm run dev` smoke: page loads, zero console errors.
- **Success criteria:** reduced-motion honored; focus visible; contrast AA on main text;
  print hides chrome; no overflow at 1440/390; dev smoke 200; screenshots desktop +
  mobile + print preview.

## Final success criteria

1. One coherent light-mode design system (named tokens) applied across the whole page;
   no warm-cream+serif+clay default, no acid-accent default.
2. Oversized typographic header/title as the signature; tree is the visual centerpiece.
3. Form tab fully restyled and still functional (same endpoint/behavior).
4. Tree, toolbar, filters, legend, directory, detail all restyled; all interactions
   unchanged and working (zoom 0.4-1.6, pan, fit, chips reflow, search, detail, i18n).
5. Branch palette colors unchanged; en/tl/ceb keys intact (no new keys unless a gap,
   then minimal with a note).
6. prefers-reduced-motion honored; visible focus states; AA contrast on main text.
7. Print CSS hides chrome and prints the tree; responsive at 1440/390; dev smoke 200;
   zero console errors.
8. No new JS dependencies; page remains a standalone static file.

Do not modify anything else. Report: Status, Files (path), Evidence (file exists, first line + last line), Result, Risks, Next.
