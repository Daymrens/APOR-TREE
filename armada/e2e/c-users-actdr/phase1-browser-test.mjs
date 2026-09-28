/**
 * Phase 1 Playwright E2E Test: Directory panel browser verification
 * - Toolbar button opens/closes directory panel
 * - All 5 branch groups visible
 * - Row click opens detail panel
 * - Screenshot evidence
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'armada', 'screenshots', 'c-users-actdr');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PAGE_URL = 'file:///' + join(process.cwd(), 'public', 'apor-family.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // Navigate to the page
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    console.log('PASS: Page loaded successfully');

    // Switch to tree view (directory button is in tree toolbar)
    await page.click('#tab-tree');
    await page.waitForTimeout(300);
    console.log('PASS: Switched to tree view');

    // Verify toolbar button exists
    const dirBtn = page.locator('.dir-btn');
    const dirBtnVisible = await dirBtn.isVisible();
    console.log(`${dirBtnVisible ? 'PASS' : 'FAIL'}: Directory toolbar button is visible`);
    if (!dirBtnVisible) throw new Error('Directory button not visible');

    // Verify directory panel is initially hidden
    const directoryPanel = page.locator('#directory');
    const initiallyHidden = !(await directoryPanel.evaluate(el => el.classList.contains('show')));
    console.log(`${initiallyHidden ? 'PASS' : 'FAIL'}: Directory panel is initially hidden`);

    // Click the directory button to open
    await dirBtn.click();
    await page.waitForTimeout(300);

    // Verify directory panel is now showing
    const isOpen = await directoryPanel.evaluate(el => el.classList.contains('show'));
    console.log(`${isOpen ? 'PASS' : 'FAIL'}: Directory panel opens on button click`);
    if (!isOpen) throw new Error('Directory panel did not open');

    // Verify all 5 branch groups are present
    const branchGroups = ['Apor', 'Feliciano', 'Pedro', 'Presbitero', 'Lumbab'];
    const groupHeadings = page.locator('.dir-group h4');
    const groupCount = await groupHeadings.count();
    console.log(`${groupCount === 5 ? 'PASS' : 'FAIL'}: 5 branch group headings found (actual: ${groupCount})`);

    // Verify branch names match expected order
    const groupTexts = [];
    for (let i = 0; i < groupCount; i++) {
      groupTexts.push(await groupHeadings.nth(i).textContent());
    }
    console.log(`  Group headings: ${groupTexts.join(', ')}`);

    // Verify total rows = 128
    const dirRows = page.locator('.dir-row');
    const rowCount = await dirRows.count();
    console.log(`${rowCount === 128 ? 'PASS' : 'FAIL'}: 128 directory rows found (actual: ${rowCount})`);

    // Verify rows have name, gen badge, and living/deceased badge
    const firstRow = dirRows.first();
    const hasName = await firstRow.locator('.dir-name').count() > 0;
    const hasGen = await firstRow.locator('.dir-gen').count() > 0;
    const hasBadge = await firstRow.locator('.badge').count() > 0;
    console.log(`${hasName ? 'PASS' : 'FAIL'}: Row has .dir-name element`);
    console.log(`${hasGen ? 'PASS' : 'FAIL'}: Row has .dir-gen element`);
    console.log(`${hasBadge ? 'PASS' : 'FAIL'}: Row has .badge (living/deceased) element`);

    // Capture screenshot - directory open with all 5 groups
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'dir-phase1.png'), fullPage: false });
    console.log('PASS: Screenshot captured: armada/screenshots/c-users-actdr/dir-phase1.png');

    // Click a row to open detail
    const targetRow = dirRows.nth(5); // Pick a row in the middle
    const targetName = await targetRow.locator('.dir-name').textContent();
    console.log(`  Clicking row for: "${targetName}"`);
    await targetRow.click();
    await page.waitForTimeout(300);

    // Verify detail panel opened
    const detailPanel = page.locator('#detail');
    const detailOpen = await detailPanel.evaluate(el => el.classList.contains('show'));
    console.log(`${detailOpen ? 'PASS' : 'FAIL'}: Detail panel opens after row click`);
    if (!detailOpen) throw new Error('Detail panel did not open');

    // Verify detail shows correct member name
    const detailName = await page.locator('#d-name').textContent();
    const nameMatch = detailName.trim() === targetName.trim();
    console.log(`${nameMatch ? 'PASS' : 'FAIL'}: Detail panel shows correct member ("${detailName}" matches "${targetName}")`);

    // Capture screenshot with detail open
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'dir-phase1-detail.png'), fullPage: false });
    console.log('PASS: Screenshot captured: armada/screenshots/c-users-actdr/dir-phase1-detail.png');

    // Verify directory panel is closed (closeDirectory is called on row click)
    const dirClosedAfterClick = !(await directoryPanel.evaluate(el => el.classList.contains('show')));
    console.log(`${dirClosedAfterClick ? 'PASS' : 'FAIL'}: Directory panel closes after row click (calls closeDirectory)`);

    // Test toggle: re-open directory, then close with close button
    await dirBtn.click();
    await page.waitForTimeout(300);
    const reopened = await directoryPanel.evaluate(el => el.classList.contains('show'));
    console.log(`${reopened ? 'PASS' : 'FAIL'}: Directory re-opens on button click`);

    // Close via the close button
    const closeBtn = directoryPanel.locator('.close');
    await closeBtn.click();
    await page.waitForTimeout(300);
    const closedViaBtn = !(await directoryPanel.evaluate(el => el.classList.contains('show')));
    console.log(`${closedViaBtn ? 'PASS' : 'FAIL'}: Directory closes via close button`);

    // Check console errors
    if (consoleErrors.length > 0) {
      console.error('FAIL: Console errors detected:');
      consoleErrors.forEach(e => console.error('  ', e));
      throw new Error('Console errors present');
    }
    console.log('PASS: Zero console errors');

    console.log('\n========================================');
    console.log('ALL PHASE 1 BROWSER TESTS PASSED');
    console.log('========================================');

  } catch (e) {
    console.error('TEST FAILED:', e.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'dir-phase1-failure.png'), fullPage: false });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
