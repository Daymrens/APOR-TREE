// Phase 2 Playwright browser test — screenshots + DOM verification
// Run: node armada/e2e/c-users-actdr/phase2-playwright-test.mjs

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const screenshotDir = join(process.cwd(), 'armada', 'screenshots', 'apor-family-tree');
mkdirSync(screenshotDir, { recursive: true });

const pageUrl = 'file:///' + join(process.cwd(), 'public', 'apor-family.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to page...');
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  console.log('Page loaded');

  // ─── 1. Switch to tree view ────────────────────────────────
  await page.click('#tab-tree');
  await page.waitForTimeout(300);
  console.log('Switched to tree view');

  // ─── 2. Open directory panel ───────────────────────────────
  await page.click('.dir-btn');
  await page.waitForTimeout(300);

  // Verify directory is visible
  const dirVisible = await page.isVisible('#directory.show');
  console.log(`Directory panel visible: ${dirVisible}`);
  if (!dirVisible) {
    console.error('FAIL: Directory panel did not open');
    await browser.close();
    process.exit(1);
  }

  // Count initial rows
  const initialRowCount = await page.locator('.dir-row').count();
  console.log(`Initial row count: ${initialRowCount}`);
  if (initialRowCount !== 128) {
    console.error(`FAIL: Expected 128 initial rows, got ${initialRowCount}`);
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Directory opened with 128 rows');

  // ─── 3. Screenshot: directory open ─────────────────────────
  const openPath = join(screenshotDir, 'dir-phase2-open.png');
  await page.screenshot({ path: openPath, fullPage: false });
  console.log(`Screenshot saved: ${openPath}`);

  // ─── 4. Type 'apor' — filtered state ───────────────────────
  await page.fill('#dirSearch', 'apor');
  await page.waitForTimeout(200);

  const filteredRowCount = await page.locator('.dir-row').count();
  console.log(`Filtered row count (apor): ${filteredRowCount}`);
  if (filteredRowCount === 0 || filteredRowCount >= 128) {
    console.error(`FAIL: Filter did not work, row count: ${filteredRowCount}`);
    await browser.close();
    process.exit(1);
  }

  // Verify every visible row contains 'apor' in name or nick
  const rows = await page.locator('.dir-row').all();
  let allMatch = true;
  for (const row of rows) {
    const text = await row.textContent();
    if (!text.toLowerCase().includes('apor')) {
      console.error(`FAIL: Row text "${text}" does not contain "apor"`);
      allMatch = false;
    }
  }
  if (!allMatch) {
    await browser.close();
    process.exit(1);
  }
  console.log(`PASS: Filtered to ${filteredRowCount} rows, all contain "apor"`);

  // Verify branch groups with no matches are hidden (count .dir-group)
  const visibleGroups = await page.locator('.dir-group').count();
  console.log(`Visible branch groups for "apor": ${visibleGroups}`);
  // Note: "apor" matches members in all 5 branches (Apor, Feliciano, Pedro, Presbitero, Lumbab)
  // so all 5 groups are visible. This is correct behavior.
  console.log('PASS: Filtered rows are correct');

  // Screenshot: filtered state
  const filteredPath = join(screenshotDir, 'dir-phase2-filtered.png');
  await page.screenshot({ path: filteredPath, fullPage: false });
  console.log(`Screenshot saved: ${filteredPath}`);

  // ─── 5a. Verify branch groups ARE hidden for a narrow query ─
  await page.fill('#dirSearch', 'purificasion');
  await page.waitForTimeout(200);
  const narrowGroups = await page.locator('.dir-group').count();
  const narrowRows = await page.locator('.dir-row').count();
  console.log(`Query "purificasion": ${narrowRows} rows, ${narrowGroups} branch groups`);
  if (narrowGroups < 5 && narrowRows > 0) {
    console.log(`PASS: ${5 - narrowGroups} branch groups hidden for narrow query`);
  } else {
    console.error(`FAIL: Expected hidden branches for "purificasion", got ${narrowGroups} groups`);
    await browser.close();
    process.exit(1);
  }

  // ─── 5b. Type 'zzzz' — empty state ──────────────────────────
  await page.fill('#dirSearch', 'zzzz');
  await page.waitForTimeout(200);

  const emptyRowCount = await page.locator('.dir-row').count();
  const emptyStateVisible = await page.locator('.dir-empty').count() > 0;
  console.log(`Empty state rows: ${emptyRowCount}, empty state visible: ${emptyStateVisible}`);
  if (emptyRowCount !== 0 || !emptyStateVisible) {
    console.error('FAIL: Empty state not shown for "zzzz"');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Empty state shown for "zzzz" query');

  // Screenshot: empty state
  const emptyPath = join(screenshotDir, 'dir-phase2-empty.png');
  await page.screenshot({ path: emptyPath, fullPage: false });
  console.log(`Screenshot saved: ${emptyPath}`);

  // ─── 6. Clear search — 128 rows restored ───────────────────
  await page.fill('#dirSearch', '');
  await page.waitForTimeout(200);

  const clearedRowCount = await page.locator('.dir-row').count();
  console.log(`Cleared row count: ${clearedRowCount}`);
  if (clearedRowCount !== 128) {
    console.error(`FAIL: Expected 128 rows after clear, got ${clearedRowCount}`);
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Clearing search restores all 128 rows');

  // ─── 7. Nick-only query 'lolo' ─────────────────────────────
  // Note: nicks are not rendered in directory rows (only name, gen, badge).
  // The search filters by nick even though it's not displayed.
  await page.fill('#dirSearch', 'lolo');
  await page.waitForTimeout(200);

  const loloRowCount = await page.locator('.dir-row').count();
  console.log(`Nick-only "lolo": ${loloRowCount} rows`);
  // "lolo" matches Gerbacio Apor (nick "Lolo Gerbacio") and Panfilo Apor (nick "Lolo Panfilo")
  if (loloRowCount === 2) {
    console.log('PASS: Nick-only query "lolo" matches 2 members via nick');
  } else {
    console.error(`FAIL: Nick-only "lolo" expected 2 rows, got ${loloRowCount}`);
    await browser.close();
    process.exit(1);
  }

  // ─── 8. Language switch — Cebuano ──────────────────────────
  await page.fill('#dirSearch', '');
  await page.waitForTimeout(100);

  // Switch to Cebuano
  await page.click('[data-lang="ceb"]');
  await page.waitForTimeout(300);

  // Verify heading changed
  const dirHeading = await page.locator('#directory h3').textContent();
  console.log(`Directory heading (ceb): "${dirHeading}"`);
  if (dirHeading !== 'Direktorya') {
    console.error(`FAIL: Expected heading "Direktorya", got "${dirHeading}"`);
    await browser.close();
    process.exit(1);
  }

  // Verify placeholder changed
  const placeholder = await page.locator('#dirSearch').getAttribute('placeholder');
  console.log(`Search placeholder (ceb): "${placeholder}"`);
  if (!placeholder || placeholder.length === 0) {
    console.error('FAIL: Placeholder not set for Cebuano');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: setLang(ceb) updated heading and placeholder');

  // Screenshot: Cebuano labels
  const cebPath = join(screenshotDir, 'dir-phase2-ceb.png');
  await page.screenshot({ path: cebPath, fullPage: false });
  console.log(`Screenshot saved: ${cebPath}`);

  // ─── 9. Language switch — Tagalog ──────────────────────────
  await page.click('[data-lang="tl"]');
  await page.waitForTimeout(300);

  const tlHeading = await page.locator('#directory h3').textContent();
  const tlPlaceholder = await page.locator('#dirSearch').getAttribute('placeholder');
  console.log(`Tagalog heading: "${tlHeading}", placeholder: "${tlPlaceholder}"`);
  if (tlHeading === 'Direktoryo' && tlPlaceholder) {
    console.log('PASS: setLang(tl) updated heading and placeholder');
  } else {
    console.error('FAIL: Tagalog labels not updated');
    await browser.close();
    process.exit(1);
  }

  // ─── 10. Verify input value persists after language switch ──
  await page.fill('#dirSearch', 'apor');
  await page.waitForTimeout(100);
  const valBeforeSwitch = await page.locator('#dirSearch').inputValue();
  await page.click('[data-lang="ceb"]');
  await page.waitForTimeout(200);
  const valAfterSwitch = await page.locator('#dirSearch').inputValue();
  console.log(`Input value before lang switch: "${valBeforeSwitch}", after: "${valAfterSwitch}"`);
  if (valBeforeSwitch === valAfterSwitch) {
    console.log('PASS: Input value persists across language switch');
  } else {
    console.error('FAIL: Input value lost after language switch');
    await browser.close();
    process.exit(1);
  }

  // ─── 11. Zero console errors ───────────────────────────────
  if (consoleErrors.length > 0) {
    console.error(`FAIL: ${consoleErrors.length} console error(s):`, consoleErrors);
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Zero console errors');

  // ─── Switch back to English for clean state ─────────────────
  await page.click('[data-lang="en"]');
  await page.waitForTimeout(200);

  await browser.close();

  console.log('\n========================================');
  console.log('ALL PHASE 2 PLAYWRIGHT TESTS PASSED');
  console.log('========================================');
})();
