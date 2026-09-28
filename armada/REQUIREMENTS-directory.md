# Contract: apor-family-directory

Status: DRAFT
Commodore: opencode/deepseek-v4-flash-free
Stack: frontend: nextjs | lang: typescript (target file: static HTML in /public)

## Goal

Add a searchable member directory to the family tree page `public/apor-family.html`
(already shipped with the real 128-member tree). The directory is a panel opened
from the page toolbar: all 128 members grouped by branch, alphabetized within each
branch, each row showing name, generation, and living/deceased badge; a search box
filters by name/nick as you type; clicking a row opens the existing detail panel.
Page stays a standalone static file.

## Assumptions (recorded)

- Same single file `public/apor-family.html`; reuse existing MEMBERS data, branch
  palette, i18n keys, and detail panel (showDetail). No new data fields.
- New i18n keys added minimally (en/tl/ceb): directory label + search placeholder
  (and search-clear if needed). Existing keys reused where possible.
- Directory opens via a toolbar button (new small button next to legend/filters,
  styled consistently with existing toolbar controls) and closes via the existing
  close pattern. Search is instant client-side filter (no fetch).
- Out of scope: contact info, sorting options beyond branch grouping, backend/API
  changes, print layout of the directory.

## Phases (single file; serialized writer)

### Phase 1 -- Directory panel UI + data render (no deps)
- [ ] Add toolbar button to open/close the directory panel.
- [ ] Render directory grouped by 5 branches, alphabetized within branch
      (sort by name), rows: name, gen badge, living/deceased indicator.
- [ ] Row click opens the existing detail panel for that member.
- **Success criteria:** directory opens/closes from toolbar; 128 members listed,
      5 branch groups, alphabetical within branch; clicking a row opens detail
      with the right member; zero console errors; screenshot evidence.

### Phase 2 -- Search + i18n (depends on Phase 1)
- [ ] Search box filters rows by name/nick as you type (case-insensitive,
      instant re-render of visible rows; branch groups with no matches hidden).
- [ ] Empty-state text when no matches ("No results" style key).
- [ ] New i18n keys added for en/tl/ceb; language switch re-renders directory
      labels.
- **Success criteria:** typing filters correctly (name and nick match), empty
      state shows when nothing matches, labels switch with language; zero console
      errors; screenshots: directory open, filtered state, tl/ceb labels.

### Phase 3 -- Responsive + smoke (depends on Phase 2)
- [ ] Directory panel fits desktop and mobile widths (scrolls internally if
      needed; no page overflow).
- [ ] `npm run dev` smoke: page loads with directory, zero console errors.
- **Success criteria:** no horizontal overflow at 1440 and 390; dev smoke 200;
      screenshots desktop + mobile.

## Final success criteria

1. Toolbar button opens/closes the directory; all 128 members listed in 5 branch
   groups, alphabetical within branch.
2. Search filters by name/nick instantly; empty state when no match.
3. Row click opens the existing detail panel for the correct member.
4. Labels work in en/tl/ceb (new keys minimal).
5. Directory responsive at desktop + mobile; dev smoke passes; zero console
   errors throughout.

Do not modify anything else. Report: Status, Files (path), Evidence (file exists, first line + last line), Result, Risks, Next.