// Playwright E2E test for apor-family.html directory
// Bounded timeouts: page 5s, nav 10s, launch 15s, each waitFor 5s max
const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/apor-family-directory');
const URL = 'http://localhost:8765/apor-family.html';

(async () => {
  let browser;
  let failures = [];
  let passes = [];
  
  function check(name, cond, detail) {
    if (cond) { passes.push(name); console.log('  PASS: ' + name); }
    else { failures.push(name); console.log('  FAIL: ' + name + (detail ? ' -- ' + detail : '')); }
  }

  try {
    browser = await chromium.launch({ headless: true, timeout: 15000 });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(10000);

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    // Navigate
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    // Wait for MEMBERS to be parsed
    await page.waitForFunction(() => typeof MEMBERS !== 'undefined' && MEMBERS.length > 0, { timeout: 5000 }).catch(() => {});

    // Switch to tree tab (directory button is in the tree toolbar)
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(500);

    // --- Criterion 1: Toolbar button opens/closes directory; 128 members in 5 groups ---
    console.log('\n--- Playwright Criterion 1: Toolbar button + 128 members ---');

    // Find and click directory button
    const dirBtn = page.locator('button.dir-btn').first();
    await dirBtn.click();
    await page.waitForTimeout(500);

    // Panel should be visible
    const panelVisible = await page.locator('#directory.show').isVisible();
    check('Directory panel opens after button click', panelVisible);

    // Count rows
    const rowCount = await page.locator('.dir-row').count();
    check('128 rows displayed', rowCount === 128, 'got ' + rowCount);

    // Count branch groups
    const groupCount = await page.locator('.dir-group h4').count();
    check('5 branch groups', groupCount === 5, 'got ' + groupCount);

    // Verify branch names in group headings
    const groupTexts = await page.locator('.dir-group h4').allTextContents();
    const expectedBranches = ['Apor', 'Feliciano', 'Pedro', 'Presbitero', 'Lumbab'];
    check('Branch group headings correct', JSON.stringify(groupTexts) === JSON.stringify(expectedBranches),
      'got: ' + groupTexts.join(', '));

    // Verify alphabetical within first branch (Apor)
    const aporRows = await page.locator('.dir-group').first().locator('.dir-row .dir-name').allTextContents();
    const aporSorted = [...aporRows].sort((a, b) => a.localeCompare(b));
    const aporAlpha = aporRows.every((n, i) => n === aporSorted[i]);
    check('Apor branch alphabetical', aporAlpha);

    // Screenshot: directory open
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dir-final-open.png'), fullPage: false });
    console.log('  Screenshot: armada/screenshots/apor-family-directory/dir-final-open.png');

    // Toggle close
    await page.locator('#directory .close').click();
    await page.waitForTimeout(300);
    const panelHidden = !(await page.locator('#directory.show').isVisible().catch(() => false));
    check('Directory closes on close button', panelHidden);

    // Toggle open again
    await dirBtn.click();
    await page.waitForTimeout(500);

    // --- Criterion 2: Search filters by name/nick ---
    console.log('\n--- Playwright Criterion 2: Search filter ---');

    // Type 'apor' in search
    await page.locator('#dirSearch').fill('apor');
    await page.waitForTimeout(300);
    const filteredCount = await page.locator('.dir-row').count();
    check("Search 'apor' reduces rows (less than 128)", filteredCount < 128, 'got ' + filteredCount);

    // Verify all filtered rows contain 'apor' in name or nick
    const filteredNames = await page.locator('.dir-row .dir-name').allTextContents();
    const allContainApor = filteredNames.every(n => n.toLowerCase().includes('apor'));
    check("All 'apor' results contain 'apor' in name", allContainApor,
      'mismatches: ' + filteredNames.filter(n => !n.toLowerCase().includes('apor')).join(', '));

    // Screenshot: filtered state
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dir-final-filtered.png'), fullPage: false });
    console.log('  Screenshot: armada/screenshots/apor-family-directory/dir-final-filtered.png');

    // Search 'zzzz' -> empty state
    await page.locator('#dirSearch').fill('zzzz');
    await page.waitForTimeout(300);
    const zzzzRows = await page.locator('.dir-row').count();
    check("Search 'zzzz' shows 0 rows", zzzzRows === 0, 'got ' + zzzzRows);
    const emptyVisible = await page.locator('.dir-empty').isVisible().catch(() => false);
    check("Empty state visible for no results", emptyVisible);

    // Search 'lolo' -> 2 nick matches
    await page.locator('#dirSearch').fill('lolo');
    await page.waitForTimeout(300);
    const loloRows = await page.locator('.dir-row').count();
    check("Search 'lolo' shows 2 rows (nick match)", loloRows === 2, 'got ' + loloRows);

    // Clear search -> back to 128
    await page.locator('#dirSearch').fill('');
    await page.waitForTimeout(300);
    const clearedRows = await page.locator('.dir-row').count();
    check('Clear search restores 128 rows', clearedRows === 128, 'got ' + clearedRows);

    // --- Criterion 3: Row click opens detail ---
    console.log('\n--- Playwright Criterion 3: Row click -> detail ---');

    // Find "Cleopatra Arnejo" row and click it
    const cleopatraRow = page.locator('.dir-row', { hasText: 'Cleopatra Arnejo' });
    const cleopatraVisible = await cleopatraRow.isVisible();
    check('Cleopatra Arnejo row visible', cleopatraVisible);

    if (cleopatraVisible) {
      await cleopatraRow.click();
      await page.waitForTimeout(500);
      const detailVisible = await page.locator('#detail.show').isVisible();
      check('Detail panel opens after row click', detailVisible);

      // Verify detail contains Cleopatra Arnejo name
      const detailText = await page.locator('#detail').textContent();
      check('Detail shows "Cleopatra Arnejo"', detailText.includes('Cleopatra Arnejo'),
        'detail text snippet: ' + detailText.substring(0, 100));

      // Directory should close after row click
      const dirClosedAfterClick = !(await page.locator('#directory.show').isVisible().catch(() => false));
      check('Directory closes after row click', dirClosedAfterClick);

      // Close detail
      await page.locator('#detail .close').click().catch(() => {});
      await page.waitForTimeout(300);
    }

    // --- Criterion 4: Labels in en/tl/ceb ---
    console.log('\n--- Playwright Criterion 4: i18n labels ---');

    // Re-open directory
    await dirBtn.click();
    await page.waitForTimeout(500);

    // Check en heading
    const enHeading = await page.locator('#directory h3').textContent();
    check('EN heading is "Directory"', enHeading === 'Directory', 'got: ' + enHeading);

    // Check en placeholder
    const enPlaceholder = await page.locator('#dirSearch').getAttribute('placeholder');
    check('EN placeholder is "Search name or nickname..."', enPlaceholder === 'Search name or nickname...',
      'got: ' + enPlaceholder);

    // Switch to ceb
    const cebBtn = page.locator('.lang-btn[data-lang="ceb"]');
    await cebBtn.click();
    await page.waitForTimeout(500);

    const cebHeading = await page.locator('#directory h3').textContent();
    check('CEB heading is "Direktorya"', cebHeading === 'Direktorya', 'got: ' + cebHeading);

    const cebPlaceholder = await page.locator('#dirSearch').getAttribute('placeholder');
    check('CEB placeholder updated', cebPlaceholder && cebPlaceholder !== enPlaceholder,
      'got: ' + cebPlaceholder);

    // Screenshot: ceb labels
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dir-final-ceb.png'), fullPage: false });
    console.log('  Screenshot: armada/screenshots/apor-family-directory/dir-final-ceb.png');

    // Search input value persists after language switch
    await page.locator('#dirSearch').fill('apor');
    await page.waitForTimeout(300);
    const searchVal = await page.locator('#dirSearch').inputValue();
    check('Search input value persists after lang switch', searchVal === 'apor', 'got: ' + searchVal);

    // Switch to tl
    const tlBtn = page.locator('.lang-btn[data-lang="tl"]');
    await tlBtn.click();
    await page.waitForTimeout(500);
    const tlHeading = await page.locator('#directory h3').textContent();
    check('TL heading is "Direktoryo"', tlHeading === 'Direktoryo', 'got: ' + tlHeading);

    // Switch back to en
    const enBtn = page.locator('.lang-btn[data-lang="en"]');
    await enBtn.click();
    await page.waitForTimeout(500);

    // Close directory for mobile test
    await page.locator('#directory .close').click();
    await page.waitForTimeout(300);

    // --- Criterion 5: Responsive (mobile) ---
    console.log('\n--- Playwright Criterion 5: Responsive mobile ---');

    // Resize to mobile width
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    // Open directory at mobile width
    await dirBtn.click();
    await page.waitForTimeout(500);

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    check('No horizontal overflow at 390px (scrollWidth <= clientWidth)', scrollWidth <= clientWidth,
      'scrollWidth=' + scrollWidth + ', clientWidth=' + clientWidth);

    // Screenshot: mobile
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dir-final-mobile.png'), fullPage: false });
    console.log('  Screenshot: armada/screenshots/apor-family-directory/dir-final-mobile.png');

    // --- Console errors ---
    console.log('\n--- Console errors check ---');
    check('Zero console errors', consoleErrors.length === 0,
      consoleErrors.length > 0 ? consoleErrors.join('; ') : '');

  } catch (e) {
    console.error('TEST EXCEPTION:', e.message);
    failures.push('EXCEPTION: ' + e.message);
  } finally {
    if (browser) await browser.close();
  }

  // Summary
  console.log('\n=== Playwright E2E Summary ===');
  console.log('Passed: ' + passes.length);
  console.log('Failed: ' + failures.length);
  if (failures.length) {
    console.log('FAILURES:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('ALL PLAYWRIGHT CHECKS PASSED');
})();
