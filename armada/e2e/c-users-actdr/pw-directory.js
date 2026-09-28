// Playwright E2E Test: apor-family-directory FINAL gate
// Tests browser-level behavior: toggle, search, detail, i18n, responsive
const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS = path.resolve(__dirname, '../../screenshots/apor-family-tree');
const URL = 'http://localhost:3000/apor-family.html';

(async () => {
  let pass = 0, fail = 0;
  function assert(label, cond, detail) {
    if (cond) { pass++; console.log('  PASS: ' + label); }
    else { fail++; console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : '')); }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('=== PLAYWRIGHT E2E TESTS ===');
  console.log('');

  // Navigate to the page
  await page.goto(URL, { waitUntil: 'networkidle' });

  // --- Criterion 1: Toolbar button opens/closes directory ---
  console.log('[Criterion 1] Toolbar button toggle');
  const dirBtn = page.locator('button.dir-btn');
  assert('Directory button visible', await dirBtn.isVisible());

  // Click to open
  await dirBtn.click();
  const dirPanel = page.locator('#directory');
  await page.waitForTimeout(300);
  assert('Directory panel opens (has show class)', await dirPanel.evaluate(el => el.classList.contains('show')));
  assert('Directory panel visible', await dirPanel.isVisible());

  // Count rows
  const rowCount = await page.locator('.dir-row').count();
  assert('128 rows in directory', rowCount === 128, 'got ' + rowCount);

  // Count branch groups
  const groupCount = await page.locator('.dir-group').count();
  assert('5 branch groups', groupCount === 5, 'got ' + groupCount);

  // Verify branch group headings
  const headings = await page.locator('.dir-group h4').allTextContents();
  assert('Branch headings present', headings.length === 5, 'got: ' + JSON.stringify(headings));

  // Screenshot: directory open
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dir-final-open.png'), fullPage: false });
  console.log('  Screenshot: dir-final-open.png');

  // Close directory
  await dirPanel.locator('button.close').click();
  await page.waitForTimeout(300);
  assert('Directory closes', !(await dirPanel.evaluate(el => el.classList.contains('show'))));

  // Reopen to test toggle
  await dirBtn.click();
  await page.waitForTimeout(300);
  assert('Directory re-opens', await dirPanel.evaluate(el => el.classList.contains('show')));

  console.log('');

  // --- Criterion 2: Search filtering ---
  console.log('[Criterion 2] Search filtering');
  const searchInput = page.locator('#dirSearch');
  assert('Search input visible', await searchInput.isVisible());

  // Type 'apor'
  await searchInput.fill('apor');
  await page.waitForTimeout(200);
  const aporRows = await page.locator('.dir-row').count();
  assert('Search "apor" shows 28 rows', aporRows === 28, 'got ' + aporRows);

  // Verify all visible rows contain 'apor' case-insensitively
  const aporNames = await page.locator('.dir-name').allTextContents();
  const allApor = aporNames.every(n => n.toLowerCase().includes('apor'));
  assert('All visible rows match "apor"', allApor);

  // Screenshot: filtered
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dir-final-filtered.png'), fullPage: false });
  console.log('  Screenshot: dir-final-filtered.png');

  // Type 'zzzz' (empty state)
  await searchInput.fill('zzzz');
  await page.waitForTimeout(200);
  const emptyVisible = await page.locator('.dir-empty').isVisible();
  assert('Empty state shows for "zzzz"', emptyVisible);
  const emptyText = await page.locator('.dir-empty').textContent();
  assert('Empty state text is "No results"', emptyText.trim() === 'No results');

  // Clear search (all 128 rows back)
  await searchInput.fill('');
  await page.waitForTimeout(200);
  const clearedRows = await page.locator('.dir-row').count();
  assert('Clear search shows 128 rows', clearedRows === 128, 'got ' + clearedRows);

  // Nick-only search: 'lolo'
  await searchInput.fill('lolo');
  await page.waitForTimeout(200);
  const loloRows = await page.locator('.dir-row').count();
  assert('Nick search "lolo" shows 2 rows', loloRows === 2, 'got ' + loloRows);

  console.log('');

  // --- Criterion 3: Row click opens detail ---
  console.log('[Criterion 3] Row click opens detail panel');
  // Clear search first
  await searchInput.fill('');
  await page.waitForTimeout(200);

  // Find and click Cleopatra Arnejo row
  const cleoRow = page.locator('.dir-row', { hasText: 'Cleopatra Arnejo' });
  assert('Cleopatra Arnejo row found', await cleoRow.count() === 1);
  await cleoRow.click();
  await page.waitForTimeout(300);

  // Detail panel should be visible
  const detailPanel = page.locator('#detail');
  assert('Detail panel opens after row click', await detailPanel.evaluate(el => el.classList.contains('show')));

  // Verify the name shown
  const detailName = await page.locator('#d-name').textContent();
  assert('Detail shows Cleopatra Arnejo', detailName === 'Cleopatra Arnejo', 'got: ' + detailName);

  // Directory should be closed after row click
  assert('Directory closes after row click', !(await dirPanel.evaluate(el => el.classList.contains('show'))));

  // Close detail
  await detailPanel.locator('button.close').click();
  await page.waitForTimeout(200);

  console.log('');

  // --- Criterion 4: i18n ---
  console.log('[Criterion 4] Labels in en/tl/ceb');
  // Reopen directory
  await dirBtn.click();
  await page.waitForTimeout(300);

  // English labels (default)
  let dirHeading = await dirPanel.locator('h3').textContent();
  assert('EN heading is "Directory"', dirHeading.trim() === 'Directory');
  let placeholder = await searchInput.getAttribute('placeholder');
  assert('EN placeholder correct', placeholder === 'Search name or nickname...');

  // Switch to Cebuano
  await page.locator('button.lang-btn[data-lang="ceb"]').click();
  await page.waitForTimeout(300);
  dirHeading = await dirPanel.locator('h3').textContent();
  assert('CEB heading is "Direktorya"', dirHeading.trim() === 'Direktorya', 'got: ' + dirHeading);
  placeholder = await searchInput.getAttribute('placeholder');
  assert('CEB placeholder correct', placeholder === 'Pangitaa ngalan o angga...', 'got: ' + placeholder);

  // Screenshot: Cebuano
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dir-final-ceb.png'), fullPage: false });
  console.log('  Screenshot: dir-final-ceb.png');

  // Switch to Tagalog
  await page.locator('button.lang-btn[data-lang="tl"]').click();
  await page.waitForTimeout(300);
  dirHeading = await dirPanel.locator('h3').textContent();
  assert('TL heading is "Direktoryo"', dirHeading.trim() === 'Direktoryo', 'got: ' + dirHeading);
  placeholder = await searchInput.getAttribute('placeholder');
  assert('TL placeholder correct', placeholder === 'Maghanap ng pangalan o palayaw...', 'got: ' + placeholder);

  // Back to English
  await page.locator('button.lang-btn[data-lang="en"]').click();
  await page.waitForTimeout(300);

  console.log('');

  // --- Criterion 5: Responsive ---
  console.log('[Criterion 5] Responsive at mobile (390px)');

  // Close directory and resize
  await dirPanel.locator('button.close').click();
  await page.waitForTimeout(200);

  // Switch to tree view first (directory is in tree toolbar)
  await page.locator('#tab-tree').click();
  await page.waitForTimeout(300);

  // Resize to mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);

  // Open directory at mobile width
  await dirBtn.click();
  await page.waitForTimeout(300);

  // Check no horizontal overflow
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert('No horizontal overflow at 390px', scrollWidth === clientWidth, 'scrollWidth=' + scrollWidth + ' clientWidth=' + clientWidth);

  // Screenshot: mobile
  await page.screenshot({ path: path.join(SCREENSHOTS, 'dir-final-mobile.png'), fullPage: false });
  console.log('  Screenshot: dir-final-mobile.png');

  console.log('');

  // --- Console errors check ---
  console.log('[Console Errors]');
  assert('Zero console errors throughout', consoleErrors.length === 0,
    consoleErrors.length > 0 ? consoleErrors.join('; ') : '');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('  ERROR: ' + e));
  }

  console.log('');
  console.log('=== PLAYWRIGHT SUMMARY ===');
  console.log('PASS: ' + pass);
  console.log('FAIL: ' + fail);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
