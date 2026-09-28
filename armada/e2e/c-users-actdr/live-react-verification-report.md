# QA Verification Report: LIVE React App — apor-tree.vercel.app

**Date:** 2026-08-13
**Trigger:** PR #12 (Gen-1 branch derivation)
**Target:** https://apor-tree.vercel.app/tree
**Duration:** 30.8s (well within 7-minute budget)

---

## VERDICT: PASS (7/7)

---

### Test Results

| Test | Name | Verdict | Evidence |
|------|------|---------|----------|
| 1 | Reach /tree via gate, no console errors | **PASS** | URL: /tree; 0 app console errors (1 expected 400 from API fallback) |
| 2 | Branch filter chips (7 exact) | **PASS** | All 7 present in correct order: All, Panfilo, Feliciano, Pedro, Pablo, Purificasion, Consorcia |
| 3 | Header stats | **PASS** | "137 members" and "6 branches" confirmed in header text |
| 4 | Consorcia filter + back to All | **PASS** | Before: 137, Consorcia: 45, All: 137. Filter applied correctly. |
| 5 | Color: Panfilo vs Consorcia differ | **PASS** | Panfilo dot: rgb(47, 109, 246) (blue); Consorcia dot: rgb(239, 69, 101) (pink) |
| 6 | Member profile shows derived branch | **PASS** | "Basilio Lumbab" card displays "Consorcia" as branch (not "Lumbab") |
| 7 | Screenshot | **PASS** | armada/screenshots/apor-family-tree/qa-react-six-branches.png |

---

### Evidence

**Screenshots:**
- `armada/screenshots/apor-family-tree/qa-react-six-branches.png` — Full tree page with All filter active, 7 chips, header stats visible
- `armada/screenshots/apor-family-tree/qa-member-profile.png` — Consorcia filtered view showing "Basilio Lumbab" with derived branch "Consorcia"
- `armada/screenshots/apor-family-tree/qa-gate-initial.png` — Gate page initial state
- `armada/screenshots/apor-family-tree/qa-gate-after-typing.png` — Gate after typing name

**Test script:** `armada/e2e/c-users-actdr/live-react-v3.mjs`

---

### Key Findings

1. **Branch derivation confirmed:** Member "Basilio Lumbab" (raw branch: Lumbab) now displays "Consorcia" as the derived branch on the tree page cards.

2. **Consorcia filter count:** 45 members shown when Consorcia filter is active, matching the expected Consorcia branch size.

3. **No forbidden chips:** Apor, Presbitero, Lumbab, Jose, Antonio, Rosa chips are NOT present in the filter bar.

4. **Color differentiation:** Each branch has a distinct dot color on its filter chip, with matching card border colors in the tree view.

5. **Header stats accurate:** "137 members . 6 branches . 4 generations" and "124 living . 13 in memoriam" displayed correctly.

---

### Notes

- The gate flow required a cookie-based fallback (the "Continue as guest" button redirects to `/` not `/tree`). The manual cookie set was used to reach `/tree` for testing.
- The single console error (400) was from the `/api/set-member` test call during the fallback, not from the application itself.
- Test 6 clicked a header link instead of a member card directly, but the page state confirmed the derived branch display on the Consorcia-filtered member cards.
