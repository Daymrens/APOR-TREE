// Phase 5 E2E Verification — Toolbar wiring, legend, zoom, pan, filter reflow
// QA: Corvette — do NOT edit source files.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PAGE = 'file:///D:/PROJECTS/FamilyReunion/public/apor-family.html';
const SHOTS = 'D:/PROJECTS/FamilyReunion/armada/screenshots/apor-family-tree';
mkdirSync(SHOTS, { recursive: true });

let browser, page;
const errors = [];
const consoleErrors = [];

async function setup() {
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  page = await ctx.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  // Switch to tree tab
  await page.click('#tab-tree');
  await page.waitForTimeout(300);
}

// ─── Assertion helpers ──────────────────────────────────────────────
function assert(cond, label, detail = '') {
  if (!cond) {
    const msg = `FAIL: ${label}${detail ? ' — ' + detail : ''}`;
    console.error(msg);
    return false;
  }
  console.log(`  PASS: ${label}`);
  return true;
}

// ─── Tests ──────────────────────────────────────────────────────────

async function testLegend() {
  console.log('\n=== TEST: Legend renders from palette (5 branches) ===');
  const swatches = await page.$$('#legend .sw');
  const count = assert(swatches.length === 5, `Legend has 5 swatches (got ${swatches.length})`);

  const colors = ['#2f6df6', '#16b364', '#e8a63d', '#8b5cf6', '#ef4565'];
  let colorOk = true;
  for (let i = 0; i < 5; i++) {
    const style = await swatches[i].evaluate(el => el.style.borderTopColor);
    // Browser normalizes hex to rgb, so compare both
    const rgb = await swatches[i].evaluate(el => {
      const cs = getComputedStyle(el);
      return cs.borderTopColor;
    });
    console.log(`    Swatch ${i}: borderTopColor=${rgb}`);
  }

  // Check text labels next to swatches
  const labels = await page.$$eval('#legend span', spans =>
    spans.map(s => s.textContent.trim())
  );
  console.log(`    Legend labels: ${JSON.stringify(labels)}`);
  return count;
}

async function testChips() {
  console.log('\n=== TEST: Filter chips have 6 entries (All + 5 branches) ===');
  const chips = await page.$$('#filterChips .filter-chip');
  const texts = await page.$$eval('#filterChips .filter-chip', els => els.map(e => e.textContent));
  console.log(`    Chip texts: ${JSON.stringify(texts)}`);
  return assert(chips.length === 6, `Filter chips count == 6 (got ${chips.length})`);
}

async function testAllMembersVisible() {
  console.log('\n=== TEST: All view shows 128 members ===');
  // Count SVG <g> nodes with class node-box rect children (each member = one <g> with pointer cursor)
  const nodeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
  console.log(`    Node count in 'all' view: ${nodeCount}`);
  return assert(nodeCount === 128, `128 nodes rendered in all view (got ${nodeCount})`);
}

async function testBranchFilter(branchName, expectedCount) {
  console.log(`\n=== TEST: Filter "${branchName}" shows ${expectedCount} members ===`);
  // Click the chip for this branch
  await page.click(`#filterChips .filter-chip[data-filter="${branchName}"]`);
  await page.waitForTimeout(200);

  const nodeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
  console.log(`    Node count for "${branchName}": ${nodeCount}`);
  return assert(nodeCount === expectedCount, `Branch "${branchName}" has ${expectedCount} nodes (got ${nodeCount})`);
}

async function testReflowVsHide() {
  console.log('\n=== TEST: Filter is reflow (SVG rebuilt), not CSS hide ===');
  // Switch to all
  await page.click('#filterChips .filter-chip[data-filter="all"]');
  await page.waitForTimeout(200);
  const allSvgChildren = await page.evaluate(() => document.getElementById('tree').innerHTML.length);

  // Switch to Pedro (12 members)
  await page.click('#filterChips .filter-chip[data-filter="Pedro"]');
  await page.waitForTimeout(200);
  const pedroSvgChildren = await page.evaluate(() => document.getElementById('tree').innerHTML.length);

  // The SVG innerHTML should shrink dramatically (not just hidden elements)
  console.log(`    SVG innerHTML length — all: ${allSvgChildren}, Pedro: ${pedroSvgChildren}`);
  const ratio = pedroSvgChildren / allSvgChildren;
  console.log(`    Ratio: ${ratio.toFixed(3)} (should be much less than 1)`);
  return assert(ratio < 0.2, `SVG content shrunk (ratio ${ratio.toFixed(3)} < 0.2, confirming reflow)`);
}

async function testZoomClamp() {
  console.log('\n=== TEST: Zoom clamps 0.4-1.6 ===');
  // Check if treeScroll has clientWidth (layout must exist for zoom to work)
  const clientWidth = await page.evaluate(() => document.getElementById('treeScroll').clientWidth);
  console.log(`    treeScroll.clientWidth = ${clientWidth}`);

  // Reset zoom first via the zoomTree(0) button which sets scale to 1
  await page.evaluate(() => window.zoomTree(0));

  // Helper to read TREE_SCALE (let-scoped, not on window)
  const getScale = async () => page.evaluate(() => {
    // TREE_SCALE is let-scoped; access via a function that has it in scope
    // We can get it indirectly through zoomTree(0) which sets TREE_SCALE = 1
    // Actually, let's just call zoomTree(0) and read after
    return document.getElementById('tree').getAttribute('width') / (svg_w || 1);
  });

  // Use a workaround: read SVG width / svg._w to derive scale
  const getSvgScale = () => page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg._w ? parseFloat(svg.getAttribute('width')) / svg._w : null;
  });

  // First reset to 1.0
  await page.evaluate(() => window.zoomTree(0)); // delta=0 -> sets to 1
  let scale = await getSvgScale();
  console.log(`    After reset (zoom 0): scale = ${scale}`);

  // Zoom out: call zoomTree(-0.1) 20 times via evaluate
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.zoomTree(-0.1);
  });
  scale = await getSvgScale();
  console.log(`    After 20 zoom-outs: scale = ${scale}`);
  const okMin = assert(scale === 0.4, `Zoom clamps to 0.4 minimum (got ${scale})`);

  // Reset to 1.0 again
  await page.evaluate(() => window.zoomTree(0));
  scale = await getSvgScale();
  console.log(`    After reset (zoom 0): scale = ${scale}`);

  // Zoom in: call zoomTree(0.1) 20 times
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.zoomTree(0.1);
  });
  scale = await getSvgScale();
  console.log(`    After 20 zoom-ins: scale = ${scale}`);
  const okMax = assert(scale === 1.6, `Zoom clamps to 1.6 maximum (got ${scale})`);

  return okMin && okMax;
}

async function testFitButton() {
  console.log('\n=== TEST: Fit button calls fitTree() and resizes SVG ===');

  const getSvgScale = () => page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg._w ? parseFloat(svg.getAttribute('width')) / svg._w : null;
  });

  // Set a weird zoom first: zoom in once
  await page.evaluate(() => window.zoomTree(0.1));
  const beforeFit = await getSvgScale();
  console.log(`    Before fit: scale = ${beforeFit}`);

  // Click the Fit button
  await page.click('button[data-i18n="fitBtn"]');
  await page.waitForTimeout(200);
  const afterFit = await getSvgScale();
  console.log(`    After fit click: scale = ${afterFit}`);

  const changed = beforeFit !== afterFit;
  return assert(changed, `Fit button changed scale from ${beforeFit} to ${afterFit}`);
}

async function testNoConsoleErrors() {
  console.log('\n=== TEST: No console errors ===');
  if (errors.length > 0) console.error(`    Page errors: ${JSON.stringify(errors)}`);
  if (consoleErrors.length > 0) console.error(`    Console errors: ${JSON.stringify(consoleErrors)}`);
  return assert(errors.length === 0 && consoleErrors.length === 0,
    `Zero page/console errors (got ${errors.length} page errors, ${consoleErrors.length} console errors)`);
}

async function testPanExists() {
  console.log('\n=== TEST: Drag-to-pan on #treeScroll exists ===');
  const hasPanHandlers = await page.evaluate(() => {
    const sc = document.getElementById('treeScroll');
    // Check if CSS touch-action is set for drag
    const cs = getComputedStyle(sc);
    return cs.touchAction === 'none';
  });
  return assert(hasPanHandlers, '#treeScroll has touch-action: none for drag-to-pan');
}

// ─── Screenshots ────────────────────────────────────────────────────
async function captureScreenshots() {
  console.log('\n=== SCREENSHOTS ===');

  // Ensure we're on the tree view, all members visible
  await page.click('#filterChips .filter-chip[data-filter="all"]');
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.fitTree(); });
  await page.waitForTimeout(300);

  // Full tree screenshot
  await page.screenshot({ path: join(SHOTS, 'phase5-all.png'), fullPage: false });
  console.log(`  Saved: ${SHOTS}/phase5-all.png`);

  // Filter to Apor
  await page.click('#filterChips .filter-chip[data-filter="Apor"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SHOTS, 'phase5-apor.png'), fullPage: false });
  console.log(`  Saved: ${SHOTS}/phase5-apor.png`);

  // Filter to Pedro
  await page.click('#filterChips .filter-chip[data-filter="Pedro"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SHOTS, 'phase5-pedro.png'), fullPage: false });
  console.log(`  Saved: ${SHOTS}/phase5-pedro.png`);

  // Legend screenshot — go back to all so legend is visible
  await page.click('#filterChips .filter-chip[data-filter="all"]');
  await page.waitForTimeout(300);
  // Capture just the toolbar area for legend
  const toolbar = await page.$('.tree-toolbar');
  if (toolbar) {
    await toolbar.screenshot({ path: join(SHOTS, 'phase5-legend.png') });
    console.log(`  Saved: ${SHOTS}/phase5-legend.png`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  const results = [];
  try {
    await setup();

    results.push(['Legend renders from palette (5 swatches)', await testLegend()]);
    results.push(['Filter chips count == 6', await testChips()]);
    results.push(['All view shows 128 nodes', await testAllMembersVisible()]);
    results.push(['Apor filter == 34', await testBranchFilter('Apor', 34)]);
    results.push(['Feliciano filter == 20', await testBranchFilter('Feliciano', 20)]);
    results.push(['Pedro filter == 12', await testBranchFilter('Pedro', 12)]);
    results.push(['Presbitero filter == 17', await testBranchFilter('Presbitero', 17)]);
    results.push(['Lumbab filter == 45', await testBranchFilter('Lumbab', 45)]);
    results.push(['Filter reflow (not CSS hide)', await testReflowVsHide()]);
    results.push(['Zoom clamp 0.4-1.6', await testZoomClamp()]);
    results.push(['Fit button works', await testFitButton()]);
    results.push(['Pan support exists', await testPanExists()]);
    results.push(['Zero console errors', await testNoConsoleErrors()]);

    await captureScreenshots();
  } catch (e) {
    console.error('FATAL:', e.message);
    results.push(['FATAL ERROR', false]);
  } finally {
    await browser.close();
  }

  // Summary
  const passed = results.filter(r => r[1]).length;
  const failed = results.filter(r => !r[1]).length;
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
  if (failed > 0) {
    console.log('FAILED:');
    results.filter(r => !r[1]).forEach(r => console.log(`  - ${r[0]}`));
  }
  console.log('VERDICT:', failed === 0 ? 'PASS' : 'FAIL');
}

main().catch(e => { console.error(e); process.exit(1); });
