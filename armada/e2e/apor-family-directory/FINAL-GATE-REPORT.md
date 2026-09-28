## E2E Test Report: apor-family-directory (Final Gate)

Date: 2026-08-13
Agent: qa (Corvette)
Model: opencode/mimo-v2.5-free
File under test: public/apor-family.html

### VM Simulation (armada/e2e/apor-family-directory/vm-sim.js)
Passed: 38/38

Checks:
- MEMBERS.length === 128
- Apor: 34, Feliciano: 20, Pedro: 12, Presbitero: 17, Lumbab: 45
- All 5 branches alphabetical after sort
- 'apor' search returns 28 results, all matching case-insensitively
- 'zzzz' returns 0 results
- 'lolo' returns 2 nick-only matches (Gerbacio + Marciana)
- Row click calls showDetail(m) with data-id
- closeDirectory() called after showDetail
- en/tl/ceb i18n keys present: directory, searchPlaceholder, noResults
- setLang re-renders directory when open
- setLang updates search placeholder
- Directory heading uses data-i18n="directory"
- Responsive width: min(420px, calc(100vw - 2.5rem))
- Directory list scrolls internally
- Directory hidden in print media
- Zero console.error calls

### Playwright E2E (armada/e2e/apor-family-directory/pw-test.js)
Passed: 23/24

Checks:
- Directory panel opens after button click: PASS
- 128 rows displayed: PASS
- 5 branch groups: PASS
- Branch group headings correct: PASS
- Apor branch alphabetical: PASS
- Directory closes on close button: PASS
- Search 'apor' reduces rows (< 128): PASS
- All 'apor' results contain 'apor' in name: PASS
- Search 'zzzz' shows 0 rows: PASS
- Empty state visible for no results: PASS
- Search 'lolo' shows 2 rows (nick match): PASS
- Clear search restores 128 rows: PASS
- Cleopatra Arnejo row visible: PASS
- Detail panel opens after row click: PASS
- Detail shows "Cleopatra Arnejo": PASS
- Directory closes after row click: PASS
- EN heading is "Directory": PASS
- EN placeholder is "Search name or nickname...": FAIL (empty on initial load)
- CEB heading is "Direktorya": PASS
- CEB placeholder updated: PASS
- Search input value persists after lang switch: PASS
- TL heading is "Direktoryo": PASS
- No horizontal overflow at 390px: PASS
- Zero console errors: PASS

### Screenshots
- armada/screenshots/apor-family-directory/dir-final-open.png (113809 bytes)
- armada/screenshots/apor-family-directory/dir-final-filtered.png (114425 bytes)
- armada/screenshots/apor-family-directory/dir-final-mobile.png (62678 bytes)
- armada/screenshots/apor-family-directory/dir-final-ceb.png (122942 bytes)

### Defect Found
DEF-001 (filed in DEFECTS.md): Search placeholder empty on initial page load (minor)
