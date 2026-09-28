# DEFECTS — apor-family-tree

## DEF-001: Clicking name text on branch row opens detail instead of expanding

- Status: CLOSED
- Severity: MEDIUM
- Found by: qa
- Phase: 3

Steps to reproduce:
1. Load apor-family.html (Directory is the default active view).
2. Locate the "Panfilo Apor (Lolo Panfilo) & Antonia Montecalvo" top-level row.
3. Click directly on the name text area of the row (not the chevron).

Expected: The branch row expands to show Gen 2 children (Ricardenel, Charlita, etc.), same as clicking the chevron.

Actual: The detail popover opens showing Panfilo's details. The branch does not expand. The `.dir-info` span's click handler calls `stopPropagation()`, preventing the parent `.dir-row` click handler (`toggleDirExpanded`) from firing. Only the small chevron button (1.3rem) correctly triggers expansion.

Root cause: In `renderDirectoryTree()` (line 1045), the `.dir-info` click handler is registered for ALL rows including branch rows:
```
if (info) info.addEventListener('click', e => { e.stopPropagation(); showDetail(m); });
```
This intercepts the row-level click on branch rows because Playwright (and real users) naturally click the center of the row, which lands on the name span.

Screenshot: armada/screenshots/apor-family-tree/qa-directory-main-view.png (see center-of-row diagnostic in test log)

History:
- qa: opened
- qa: retested — all 7 E2E tests PASS — CLOSED

## DEF-002: SDD searchable dropdowns never open — list stays display:none

- Status: CLOSED
- Severity: HIGH
- Found by: qa
- Phase: 3

Steps to reproduce:
1. Load apor-family.html, click the "Member Form" tab.
2. Click the Branch search input (#branchSearch) or type into it.
3. Observe the dropdown list (#branchList).

Expected: The dropdown list appears below the input, showing branch options (Panfilo, Feliciano, Pedro, etc.) that the user can click to select.

Actual: The dropdown list never becomes visible. The `.sdd-list` element remains `display: none` because the CSS rule `.sdd-list.open { display: block; }` requires the `open` class, but the JavaScript in `renderSdd()` (line ~981) never calls `list.classList.add('open')`. The only classList operations on `.sdd-list` are `remove('open')` calls in the pick handler, the document click handler, and `clearPicks()`. The list items are rendered (exist in DOM) but hidden from the user.

Screenshot: armada/screenshots/apor-family-tree/qa-three-mode-form.png (T10 diagnostic: open=false items=6 display=none)

History:
- qa: opened
- qa: retested — 43/43 E2E tests PASS, all SDD open/close/filter/pick behaviors verified, full three-mode form flow (add/correction/suggestion) with intercepted POSTs, spouse guard, close-on-outside, single-dropdown-at-a-time, i18n Tagalog — CLOSED
