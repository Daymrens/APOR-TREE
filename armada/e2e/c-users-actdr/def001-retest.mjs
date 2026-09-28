// DEF-001 retest: Click name text on branch row should expand, not open detail
import { chromium } from 'playwright';

const URL = 'http://localhost:4199/';
const TIMEOUTS = { default: 4000, navigation: 8000, launch: 15000 };
const SCREENSHOT_DIR = 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree';

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' -- ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: TIMEOUTS.launch });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUTS.default);

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // ── TEST 1: Load → directory main view ──
    console.log('\n=== TEST 1: Load -> directory main view ===');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.navigation });
    await page.waitForTimeout(500);
    // Directory view should be active by default
    const dirViewActive = await page.locator('#view-dir.active').count();
    if (dirViewActive > 0) {
      record('T1: Directory main view loads', true);
    } else {
      record('T1: Directory main view loads', false, `dir view active count: ${dirViewActive}`);
    }

    // ── TEST 2: Click NAME TEXT on PANFILO row → branch EXPANDS, no detail ──
    console.log('\n=== TEST 2: Click name text on PANFILO row -> expands ===');
    // Find Panfilo row by data-id
    const panfiloRow = page.locator('.dir-row[data-id="panfilo-apor"]');
    await panfiloRow.waitFor({ state: 'visible', timeout: 4000 });

    // Click the .dir-name span (center of row, on the name)
    const dirName = panfiloRow.locator('.dir-name');
    await dirName.click();
    await page.waitForTimeout(400);

    // Check that detail popover is NOT open
    const detailShown = await page.locator('#detail.show').count();
    // Check that Gen 2 kids are visible (Ricardenel row should now exist)
    const ricardenel = page.locator('.dir-row[data-id="ricardenel-apor"]');
    const ricardenelVisible = await ricardenel.count();

    if (detailShown === 0 && ricardenelVisible > 0) {
      record('T2: Click name text on PANFILO row expands branch', true,
        `detail shown: ${detailShown}, ricardenel visible: ${ricardenelVisible}`);
    } else {
      record('T2: Click name text on PANFILO row expands branch', false,
        `detail shown: ${detailShown} (expected 0), ricardenel visible: ${ricardenelVisible} (expected > 0)`);
    }

    // ── TEST 3: Click row body again → collapses ──
    console.log('\n=== TEST 3: Click row body again -> collapses ===');
    await dirName.click();
    await page.waitForTimeout(400);
    const ricardenelAfterCollapse = await page.locator('.dir-row[data-id="ricardenel-apor"]').count();
    if (ricardenelAfterCollapse === 0) {
      record('T3: Click row body again collapses', true);
    } else {
      record('T3: Click row body again collapses', false,
        `ricardenel still visible: ${ricardenelAfterCollapse}`);
    }

    // ── TEST 4: Click info button on PANFILO row → detail OPENS, no expand/collapse ──
    console.log('\n=== TEST 4: Click info button on PANFILO row -> detail opens ===');
    // Make sure the branch is collapsed first
    const ricardenelCheck = await page.locator('.dir-row[data-id="ricardenel-apor"]').count();
    if (ricardenelCheck > 0) {
      await dirName.click();
      await page.waitForTimeout(300);
    }

    const infoBtn = panfiloRow.locator('.dir-info');
    await infoBtn.click();
    await page.waitForTimeout(400);

    const detailShownAfterInfo = await page.locator('#detail.show').count();
    const dNameText = await page.locator('#d-name').textContent().catch(() => '');
    // Branch should NOT have expanded (Ricardenel should not be visible)
    const ricardenelAfterInfo = await page.locator('.dir-row[data-id="ricardenel-apor"]').count();

    if (detailShownAfterInfo > 0 && dNameText.includes('Panfilo') && ricardenelAfterInfo === 0) {
      record('T4: Info button opens detail, no branch expansion', true,
        `detail: ${detailShownAfterInfo}, name: "${dNameText}", kids: ${ricardenelAfterInfo}`);
    } else {
      record('T4: Info button opens detail, no branch expansion', false,
        `detail: ${detailShownAfterInfo}, name: "${dNameText}", kids: ${ricardenelAfterInfo}`);
    }

    // Close the detail popover
    await page.locator('#detail .close').click();
    await page.waitForTimeout(300);

    // ── TEST 5: Click a leaf row (e.g. Ricardenel) → detail opens ──
    console.log('\n=== TEST 5: Click leaf row -> detail opens ===');
    // First expand Panfilo to make Ricardenel visible
    await dirName.click();
    await page.waitForTimeout(400);

    const ricardenelRow = page.locator('.dir-row[data-id="ricardenel-apor"]');
    await ricardenelRow.waitFor({ state: 'visible', timeout: 4000 });
    await ricardenelRow.click();
    await page.waitForTimeout(400);

    const detailShownForLeaf = await page.locator('#detail.show').count();
    const leafName = await page.locator('#d-name').textContent().catch(() => '');

    if (detailShownForLeaf > 0 && leafName.includes('Ricardenel')) {
      record('T5: Leaf row click opens detail', true,
        `name: "${leafName}"`);
    } else {
      record('T5: Leaf row click opens detail', false,
        `detail shown: ${detailShownForLeaf}, name: "${leafName}"`);
    }

    // Close detail
    await page.locator('#detail .close').click();
    await page.waitForTimeout(300);

    // ── TEST 6: Search "Wilda" -> flat row click -> detail opens ──
    console.log('\n=== TEST 6: Search "Wilda" -> flat row -> detail ===');
    const searchInput = page.locator('#dirSearch');
    await searchInput.fill('Wilda');
    await page.waitForTimeout(400);

    // In search mode, all results are flat rows
    const searchRows = await page.locator('.dir-row').count();
    if (searchRows > 0) {
      const firstRow = page.locator('.dir-row').first();
      const firstName = await firstRow.locator('.dir-name').textContent();
      await firstRow.click();
      await page.waitForTimeout(400);

      const detailShownForSearch = await page.locator('#detail.show').count();
      const searchDetailName = await page.locator('#d-name').textContent().catch(() => '');

      if (detailShownForSearch > 0 && searchDetailName.length > 0) {
        record('T6: Search "Wilda" flat row click opens detail', true,
          `rows: ${searchRows}, detail name: "${searchDetailName}", first row: "${firstName}"`);
      } else {
        record('T6: Search "Wilda" flat row click opens detail', false,
          `rows: ${searchRows}, detail shown: ${detailShownForSearch}, detail name: "${searchDetailName}"`);
      }
    } else {
      record('T6: Search "Wilda" flat row click opens detail', false,
        `no search rows found for "Wilda"`);
    }

    // Close detail
    await page.locator('#detail .close').click().catch(() => {});
    await page.waitForTimeout(200);

    // ── TEST 7: No console errors ──
    console.log('\n=== TEST 7: No console errors ===');
    if (consoleErrors.length === 0) {
      record('T7: No console errors', true);
    } else {
      record('T7: No console errors', false,
        `errors: ${JSON.stringify(consoleErrors)}`);
    }

    // ── SCREENSHOT ──
    // Clear search and go back to tree view for a nice screenshot
    await searchInput.fill('');
    await page.waitForTimeout(300);
    // Expand Panfilo for the screenshot
    await page.locator('.dir-row[data-id="panfilo-apor"] .dir-name').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/qa-dir-expand-fix.png`, fullPage: false });
    console.log(`\nScreenshot saved: ${SCREENSHOT_DIR}/qa-dir-expand-fix.png`);

  } catch (err) {
    console.error(`\nFATAL ERROR: ${err.message}`);
    // Try to take a screenshot on error
    try {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/qa-dir-expand-fix-error.png`, fullPage: false });
      console.log(`Error screenshot saved: ${SCREENSHOT_DIR}/qa-dir-expand-fix-error.png`);
    } catch (_) {}
  } finally {
    await browser.close();
  }

  // ── SUMMARY ──
  console.log('\n========== SUMMARY ==========');
  const allPass = results.every(r => r.pass);
  results.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}: ${r.name}${r.detail ? ' -- ' + r.detail : ''}`));
  console.log(`\nVERDICT: ${allPass ? 'PASS' : 'FAIL'}`);
  process.exit(allPass ? 0 : 1);
})();
