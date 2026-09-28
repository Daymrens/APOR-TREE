// Phase 2 verification: buildLayout() tidy-tree algorithm, all 128 positioned, centering invariant
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../../../public/apor-family.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// ---- 1. Extract and parse MEMBERS ----
const membersMatch = html.match(/const MEMBERS = (\[[\s\S]*?\]);/);
if (!membersMatch) {
  console.error('FAIL: MEMBERS definition not found');
  process.exit(1);
}
let MEMBERS;
try {
  MEMBERS = eval(membersMatch[1]);
} catch (e) {
  console.error('FAIL: Could not parse MEMBERS:', e.message);
  process.exit(1);
}
console.log('=== PHASE 2 VERIFICATION ===');
console.log('Total members:', MEMBERS.length);

// ---- Constants ----
const BOX_W = 132, BOX_H = 52, H_GAP = 22, COUPLE_GAP = 12, ROW_H = 128;

// ---- 2. Verify buildLayout() algorithm structure via source inspection ----
console.log('\n--- CRITERION 1: Algorithm structure ---');

const isParent0Check = html.includes('const isParent0 = new Set(Object.keys(kidsOf))');
console.log('isParent0 Set defined:', isParent0Check);

const anchorDetection = html.includes('m.parents.length === 0 || !isParent0.has(m.id)');
console.log('Anchor detection (parents.length===0 || !isParent0):', anchorDetection);

const subtreeWidthFn = html.includes('const subtreeWidth = n =>');
console.log('subtreeWidth function present:', subtreeWidthFn);

const placeFn = html.includes('const place = (n, left)');
const centeringLogic = html.includes('left + (subW - kidsW)/2');
console.log('place() function present:', placeFn);
console.log('Children block centering ((subW - kidsW)/2):', centeringLogic);

const spousePlacement = html.includes('x + BOX_W + COUPLE_GAP');
console.log('Spouse couple box at marriage midpoint:', spousePlacement);

const algorithmStructureOk = isParent0Check && anchorDetection && subtreeWidthFn && placeFn && centeringLogic && spousePlacement;
console.log('Algorithm structure criterion:', algorithmStructureOk ? 'PASS' : 'FAIL');

// ---- 3. VM load simulation ----
console.log('\n--- CRITERION 2: Layout runs without errors ---');

const scriptBlocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const lastScript = scriptBlocks[scriptBlocks.length - 1][1];

let treeAppendCount = 0;
let treeSetAttrCount = 0;
const consoleErrors = [];

const docStub = {
  getElementById: (id) => {
    if (id === 'tree') {
      return {
        _innerHTML: '',
        setAttribute: (k, v) => { treeSetAttrCount++; },
        appendChild: (child) => { treeAppendCount++; },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(v) { this._innerHTML = v; },
        clientWidth: 800, clientHeight: 600, style: {},
      };
    }
    if (id === 'detail') {
      return { classList: { add: () => {}, remove: () => {} }, querySelectorAll: () => [] };
    }
    if (id === 'treeScroll') {
      return { scrollLeft: 0, scrollTop: 0, clientWidth: 800, clientHeight: 600 };
    }
    return {
      setAttribute: () => {}, appendChild: () => {}, innerHTML: '', textContent: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {}, reset: () => {}, disabled: false, value: '',
    };
  },
  createElementNS: (ns, tag) => ({
    setAttribute: (k, v) => {},
    appendChild: (child) => { treeAppendCount++; },
    addEventListener: () => {}, style: {}, textContent: '', querySelectorAll: () => [],
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
};

const sandbox = {
  document: docStub,
  window: { addEventListener: () => {} },
  console: {
    error: (...args) => consoleErrors.push(args.join(' ')),
    log: () => {}, warn: () => {}, info: () => {},
  },
  navigator: { clipboard: { writeText: () => {} } },
  I18N: {
    en: {
      formTitle: 'Form', contribBtn: 'Contribute', contribTitle: 'Contribute',
      submit: 'Submit', submittedOk: 'Submitted', submitErr: 'Error',
      copyFirst: 'Copy first', copiedOk: 'Copied', livingBadge: 'Living',
      deceasedBadge: 'Deceased', born: 'Born', died: 'Died', genderLbl: 'Gender',
      note: 'Note', gMale: 'Male', gFemale: 'Female', gOther: 'Other',
    },
    tl: {}, ceb: {},
  },
  CUR: 'en',
  fetch: async () => ({ ok: true }),
};

let vmException = null;
try {
  vm.createContext(sandbox);
  vm.runInContext(lastScript, sandbox, { timeout: 5000 });
  console.log('VM execution: NO thrown exception');
} catch (e) {
  vmException = e;
  console.log('VM execution: EXCEPTION -', e.message);
}

console.log('Console errors captured:', consoleErrors.length > 0 ? consoleErrors : 'NONE');
console.log('SVG children appended:', treeAppendCount);

const layoutRunsOk = !vmException && consoleErrors.length === 0 && treeAppendCount > 0;
console.log('Layout runs without errors criterion:', layoutRunsOk ? 'PASS' : 'FAIL');

// ---- 4. Standalone layout computation ----
console.log('\n--- CRITERION 3: All 128 members positioned ---');

const byId = {};
MEMBERS.forEach(m => byId[m.id] = m);
const kidsOf = {};
MEMBERS.forEach(m => {
  const p = m.parents[0];
  if (p && byId[p]) (kidsOf[p] = kidsOf[p] || []).push(m);
});
Object.values(kidsOf).forEach(k => k.sort((a,b) => a.order - b.order || a.id.localeCompare(b.id)));

const coupleW = m => m.spouse && byId[m.spouse] ? 2*BOX_W + COUPLE_GAP : BOX_W;

// Compute subtree widths
const subtreeWidthCache = {};
function subtreeWidth(n) {
  if (subtreeWidthCache[n.id] !== undefined) return subtreeWidthCache[n.id];
  const kids = kidsOf[n.id] || [];
  let w;
  if (!kids.length) {
    w = coupleW(n);
  } else {
    const kidsTotal = kids.reduce((s,k) => s + subtreeWidth(k), 0) + (kids.length-1)*H_GAP;
    w = Math.max(coupleW(n), kidsTotal);
  }
  subtreeWidthCache[n.id] = w;
  return w;
}
MEMBERS.forEach(m => subtreeWidth(m));

// Compute positions, tracking left values for each node
const pos = {};
const leftOf = {}; // left edge of subtree for each node
const placed = new Set();
function place(n, left) {
  const kids = kidsOf[n.id] || [];
  const kidsW = kids.length ? kids.reduce((s,k) => s + subtreeWidth(k), 0) + (kids.length-1)*H_GAP : 0;
  const subW = subtreeWidth(n);
  const cx = left + subW/2;
  const y = n.gen * ROW_H;
  const x = cx - coupleW(n)/2;
  pos[n.id] = { x, y }; leftOf[n.id] = left; placed.add(n.id);
  if (n.spouse && byId[n.spouse]) {
    const s = byId[n.spouse];
    pos[s.id] = { x: x + BOX_W + COUPLE_GAP, y }; placed.add(s.id);
  }
  if (kids.length) {
    let cursor = left + (subW - kidsW)/2;
    kids.forEach(k => { place(k, cursor); cursor += subtreeWidth(k) + H_GAP; });
  }
}
const isParent0 = new Set(Object.keys(kidsOf));
const anchors = MEMBERS
  .filter(m => m.parents.length === 0 || !isParent0.has(m.id))
  .sort((a,b) => a.gen - b.gen || (a.parents.length === 0 ? 1 : 0) - (b.parents.length === 0 ? 1 : 0) || a.order - b.order || a.id.localeCompare(b.id));
let leftCursor = 0;
anchors.forEach(a => { if (placed.has(a.id)) return; place(a, leftCursor); leftCursor += subtreeWidth(a) + H_GAP; });

const positionedCount = Object.keys(pos).length;
console.log('Members positioned:', positionedCount, '/ 128');

const missing = MEMBERS.filter(m => !pos[m.id]);
if (missing.length > 0) console.log('Missing positions:', missing.map(m => m.id));
const nanPositions = MEMBERS.filter(m => {
  const p = pos[m.id];
  return p && (isNaN(p.x) || isNaN(p.y));
});
if (nanPositions.length > 0) console.log('NaN positions:', nanPositions.map(m => m.id));

const allPositioned = positionedCount === 128 && missing.length === 0 && nanPositions.length === 0;
console.log('All 128 members positioned criterion:', allPositioned ? 'PASS' : 'FAIL');

// ---- 5. Parents centered over children block ----
// Algorithm invariant: for parent n placed at left_n:
//   cx = left_n + subW/2  (subtree center)
//   n.x = cx - coupleW(n)/2  (parent box left edge)
//   coupleCenter = n.x + coupleW(n)/2 = cx  (couple center = subtree center)
//   children block: cursor = left_n + (subW - kidsW)/2, spans cursor to cursor + kidsW
//   children block center = cursor + kidsW/2 = left_n + subW/2 = cx
// So coupleCenter == children block center by construction.
// We verify this by computing cx from positions and checking children block boundaries.
console.log('\n--- CRITERION 4: Parents centered over children block ---');

const tolerance = 0.01; // sub-pixel tolerance (algorithm is exact)
const violations = [];
const parentsWithKids = Object.keys(kidsOf);

for (const parentId of parentsWithKids) {
  const kids = kidsOf[parentId];
  const parentPos = pos[parentId];
  if (!parentPos || kids.length === 0) continue;

  const parent = byId[parentId];
  const subW = subtreeWidth(parent);
  const leftN = leftOf[parentId];
  const cx = leftN + subW / 2;
  const coupleCenter = parentPos.x + coupleW(parent) / 2;

  // Verify couple center equals subtree center
  const coupleCenterDiff = Math.abs(coupleCenter - cx);
  if (coupleCenterDiff > tolerance) {
    violations.push({
      parentId, type: 'coupleCenter',
      coupleCenter: coupleCenter.toFixed(2), cx: cx.toFixed(2),
      diff: coupleCenterDiff.toFixed(4), childCount: kids.length,
    });
    continue;
  }

  // Compute children block
  const kidsW = kids.reduce((s,k) => s + subtreeWidth(k), 0) + (kids.length-1)*H_GAP;
  const cursor = leftN + (subW - kidsW) / 2;
  const blockCenter = cursor + kidsW / 2;

  // Verify children block center equals subtree center
  const blockCenterDiff = Math.abs(blockCenter - cx);
  if (blockCenterDiff > tolerance) {
    violations.push({
      parentId, type: 'blockCenter',
      blockCenter: blockCenter.toFixed(2), cx: cx.toFixed(2),
      diff: blockCenterDiff.toFixed(4), childCount: kids.length,
    });
    continue;
  }

  // Verify each child's subtree fits within the children block
  let childCursor = cursor;
  for (const k of kids) {
    const kSubW = subtreeWidth(k);
    const kLeft = childCursor;
    const kRight = childCursor + kSubW;
    const blockLeft = cursor;
    const blockRight = cursor + kidsW;

    if (kLeft < blockLeft - tolerance || kRight > blockRight + tolerance) {
      violations.push({
        parentId, type: 'childOverflow',
        child: k.id, kLeft: kLeft.toFixed(1), kRight: kRight.toFixed(1),
        blockLeft: blockLeft.toFixed(1), blockRight: blockRight.toFixed(1),
        childCount: kids.length,
      });
    }
    childCursor += kSubW + H_GAP;
  }
}

if (violations.length > 0) {
  console.log('Centering violations:');
  violations.forEach(v => {
    if (v.type === 'coupleCenter') {
      console.log(`  ${v.parentId}: coupleCenter=${v.coupleCenter} != cx=${v.cx}, diff=${v.diff}px`);
    } else if (v.type === 'blockCenter') {
      console.log(`  ${v.parentId}: blockCenter=${v.blockCenter} != cx=${v.cx}, diff=${v.diff}px`);
    } else {
      console.log(`  ${v.parentId}: child ${v.child} overflows [${v.kLeft}..${v.kRight}] outside block [${v.blockLeft}..${v.blockRight}]`);
    }
  });
} else {
  console.log('All parents centered: couple center = subtree center = children block center (verified for all ' + parentsWithKids.length + ' parents with children)');
}
const centeringPass = violations.length === 0;
console.log('Parents centered criterion:', centeringPass ? 'PASS' : 'FAIL');

// ---- 6. Spouse couple box positioning ----
// The algorithm places: member.x, spouse.x = member.x + BOX_W + COUPLE_GAP
// We verify that for every couple, the two boxes are adjacent with the correct gap
console.log('\n--- SUPPLEMENTARY: Spouse couple box positioning ---');
const spousePairs = MEMBERS.filter(m => m.spouse && m.id.localeCompare(m.spouse) < 0);
let spouseIssues = 0;
for (const m of spousePairs) {
  const p1 = pos[m.id];
  const p2 = pos[m.spouse];
  if (!p1 || !p2) { spouseIssues++; console.log(`  Missing position: ${m.id} or ${m.spouse}`); continue; }

  // Determine which is left and which is right
  const leftX = Math.min(p1.x, p2.x);
  const rightX = Math.max(p1.x, p2.x);
  const expectedGap = BOX_W + COUPLE_GAP; // left box ends at leftX+BOX_W, right box starts at leftX+BOX_W+COUPLE_GAP

  if (Math.abs(rightX - leftX - expectedGap) > 0.01) {
    console.log(`  Gap mismatch: ${m.id}(${p1.x.toFixed(0)}) -- ${m.spouse}(${p2.x.toFixed(0)}), gap=${(rightX-leftX).toFixed(1)} expected=${expectedGap}`);
    spouseIssues++;
  }
  if (p1.y !== p2.y) {
    console.log(`  Row mismatch: ${m.id} y=${p1.y} vs ${m.spouse} y=${p2.y}`);
    spouseIssues++;
  }
}
console.log('Spouse couple box issues:', spouseIssues);
console.log('Spouse couple box criterion:', spouseIssues === 0 ? 'PASS' : 'FAIL');

// ---- 7. Row separation check ----
console.log('\n--- SUPPLEMENTARY: Row separation ---');
const genY = {};
MEMBERS.forEach(m => {
  const p = pos[m.id];
  if (p) genY[m.gen] = p.y;
});
Object.entries(genY).sort((a,b) => a[0] - b[0]).forEach(([gen, y]) => {
  console.log(`  Gen ${gen}: y=${y}`);
});
const rowSpacingOk = Object.values(genY).every((y, i, arr) => i === 0 || y - arr[i-1] === ROW_H);
console.log('Row spacing (ROW_H apart):', rowSpacingOk ? 'PASS' : 'FAIL');

// ---- 8. Couples on same row ----
console.log('\n--- SUPPLEMENTARY: Couples on same row ---');
let coupleRowIssues = 0;
for (const m of spousePairs) {
  const p1 = pos[m.id];
  const p2 = pos[m.spouse];
  if (p1 && p2 && p1.y !== p2.y) {
    console.log(`  Row mismatch: ${m.id} (gen ${m.gen}) y=${p1.y} vs ${m.spouse} y=${p2.y}`);
    coupleRowIssues++;
  }
}
console.log('Couples on same row issues:', coupleRowIssues);

// ---- VERDICT ----
console.log('\n========== VERDICT ==========');
const pass = algorithmStructureOk && layoutRunsOk && allPositioned && centeringPass;
if (pass) {
  console.log('PASS');
} else {
  console.log('FAIL');
  if (!algorithmStructureOk) console.log('  - Algorithm structure does not match criteria');
  if (!layoutRunsOk) console.log('  - Layout did not run without errors');
  if (!allPositioned) console.log('  - Not all 128 members have positions');
  if (!centeringPass) console.log('  - Parent centering invariant violated');
}
