# DEFECTS.md -- apor-family-directory

## DEF-001: Search placeholder empty on initial page load

- Status: CLOSED
- Severity: LOW
- Found by: qa (FINAL-001)
- Phase: Final Gate

Steps to reproduce:
1. Navigate to http://localhost:8765/apor-family.html (fresh load, no prior language switch).
2. Click "Family Tree" tab.
3. Click "Directory" button in the toolbar.
4. Observe the search input placeholder.

Expected: Placeholder reads "Search name or nickname..." (the en.searchPlaceholder value).
Actual: Placeholder is empty (the HTML attribute is `placeholder=""`). The placeholder is only set when `setLang()` is called, which is not invoked on initial page load. Switching to any language and back fixes it.

Root cause: The HTML has `placeholder=""` and there is no `setLang('en')` call at script initialization. The `openDirectory()` function clears `input.value` and calls `renderDirectory()`, but neither sets the placeholder attribute.

History:
- qa: opened (FINAL-001, 2026-08-13)
- qa: CLOSED -- retest passed: initDirSearch IIFE sets placeholder from I18N[CUR].searchPlaceholder at init; Playwright confirmed placeholder='Search name or nickname...' on fresh load without setLang; regression: 128 rows, search 'apor' -> 28 rows. Evidence: armada/screenshots/apor-family-directory/def-001-retest.png
