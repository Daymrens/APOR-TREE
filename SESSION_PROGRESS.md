# Family Reunion WEB — Session Progress

**Date:** 2026-08-13  
**Branch:** `master`  
**Primary Target:** `public/apor-family.html` (standalone tree page in `/public`)

---

## ✅ DONE

| Task | Details |
|------|---------|
| **Fix motto spelling** | `Herbacio` → `Gerbacio` in header (line 203) |
| **Generate real tree data** | `scripts/gen-tree-data.js` transforms `seed-roots.js` → `scripts/_tree-data.txt` (128 members, 5 branches, gens 0–3) |
| **Toolbar markup** | New `tree-toolbar` with branch legend, filter chips (`#filterChips`), zoom controls (− / 100% / +), Fit button (lines 330–344) |
| **Tree CSS** | New styles for orthogonal edges, branch-colored node left borders, zoom/drag, legend, chips, zoom controls (lines 140–161) |
| **I18N keys (en/tl/ceb)** | Added `filterLabel`, `filterAll/Apor/Feliciano/Pedro/Presbitero/Lumbab`, `zoomIn/Out/Reset`, `fitBtn`, `branchLbl`, `genLbl`, `spouseLbl`, `parentsLbl`, `nickLbl` (lines 335–406) |
| **Cebuano typo fix** | Patched `I18N.ceb.copyFirst` (line 409/448) |

---

## 🔄 ONGOING (Next Edit)

| Task | Target Lines | Status |
|------|--------------|--------|
| **Replace demo `MEMBERS`/`RELS`** | ~539–560 | Ready — real data from `_tree-data.txt` |
| **Remove unused `RELS` array** | ~591–599 | Pending |
| **Replace `buildLayout()`** | ~601–619 | Tidy-tree algorithm designed |
| **Replace `renderTree()`** | ~621–653 | Orthogonal connectors, branch colors, zoom/pan |
| **Replace `showDetail()`** | ~655–666 | New schema: name, nick, branch, gen, living/deceased, spouse name, parent names, notes |
| **Wire toolbar controls** | — | Filter chips → `setFilter(branch)`, zoom buttons → `zoomTree(delta)`, Fit → `fitTree()`, drag-to-pan on `#treeScroll` |
| **Update print media query** | ~170 | Hide new toolbar classes if needed |

---

## ⏳ PENDING

| Task | Notes |
|------|-------|
| **Delete temp files** | `_tree-data.txt`, `_tree-summary.txt`, `gen-tree-data.js` (decide keep vs delete) |
| **Admin decline test docs** | Two pending contributions: `GL79TVZ5AqO03lOXFrFq` ("Test Juan Apor"), `qeksc16BmnSnYwyEnn9Z` ("UITest Maria Cruz Apor") — decline in dashboard |
| **Verify responsive tree** | Test on desktop & mobile after rewrite |
| **Run dev server smoke test** | `npm run dev` → open `/apor-family.html` |

---

## Tidy-Tree Algorithm Design (Ready to Implement)

```
Constants:
  BOX_W = 132, BOX_H = 52
  H_GAP = 22, COUPLE_GAP = 12, ROW_H = 128

Branch palette:
  Apor:#2f6df6, Feliciano:#16b364, Pedro:#e8a63d,
  Presbitero:#8b5cf6, Lumbab:#ef4565

Layout:
1. isParent0 Set = all members where they appear as parents[0] of someone
2. Anchor = (parents.length===0) || !isParent0.has(id)  ← blood root OR married-in spouse
3. post-order subtreeWidth(node):
   - if no children: BOX_W
   - else: sum(childWidths) + (n-1)*H_GAP
4. place(node, left):
   - position children block centered under node
   - if spouse: couple box at marriage midpoint cx
5. Render:
   - Nodes: rect (branch left border), name, nick, gen badge
   - Edges: orthogonal (marriage horizontal, parent→busY, sibling bus horizontal, drops to children)
6. Branch filter = visible-set reflow (computeVisible(filter), default 'all')
7. Zoom 0.4–1.6, drag-to-pan on #treeScroll, fitTree()
```

---

## Key Files

- `public/apor-family.html` — Primary edit target
- `scripts/_tree-data.txt` — 128-member compact schema (source of truth)
- `scripts/gen-tree-data.js` — Transform script (dev helper)
- `scripts/seed-roots.js` — Original seeded data (Firestore)
- `scripts/seed-roots-admin.js` — Admin SDK seeder (bypasses rules)

---

## Security Notes

- Service account JSON `apor-tree-firebase-adminsdk-fbsvc-e4eb2dd34f.json` is **gitignored** — never print, never commit
- Two test contributions in admin dashboard need **decline** (not approve)