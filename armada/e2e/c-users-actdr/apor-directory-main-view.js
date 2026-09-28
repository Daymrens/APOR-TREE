/**
 * E2E Tests: apor-family.html - Directory as MAIN view (revised)
 * Tests 1-10 from QA spec
 * 
 * Run: node armada/e2e/c-users-actdr/apor-directory-main-view.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:4199/apor-family.html';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/apor-family-tree');

const results = [];
let browser, page;

function log(test, pass, detail) {
  const status = pass ? 'PASS' : 'FAIL';
  results.push({ test, status, detail });
  console.log(`  [${status}] ${test}: ${detail}`);
}

async function screenshot(name) {
  const fp = path.join(SCREENSHOT_DIR, name);
  await page.screenshot({ path: fp, fullPage: true });
  console.log(`  Screenshot: ${fp}`);
  return fp;
}

async function run() {
  console.log('\n=== QA E2E: apor-family.html Directory Main View ===\n');

  browser = await chromium.launch({ headless: true, timeout: 15000 });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(4000);

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // ─── Test 1: Load page, directory active by default ───
  console.log('--- Test 1: Page load & default directory view ---');
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(500);

    const viewDirVisible = await page.$eval('#view-dir', el => {
      return el.style.display !== 'none' && el.classList.contains('active');
    });
    const tabDirActive = await page.$eval('#tab-dir', el => el.classList.contains('active'));
    const viewFormHidden = await page.$eval('#view-form', el => !el.classList.contains('active'));
    const viewTreeHidden = await page.$eval('#view-tree', el => !el.classList.contains('active'));

    const noConsoleErrors = consoleErrors.length === 0;
    log('T1-default-view', viewDirVisible && tabDirActive && viewFormHidden && viewTreeHidden,
      `view-dir visible=${viewDirVisible}, tab-dir active=${tabDirActive}, form hidden=${viewFormHidden}, tree hidden=${viewTreeHidden}`);
    log('T1-no-console-errors', noConsoleErrors,
      noConsoleErrors ? 'No console errors' : `Errors: ${consoleErrors.join('; ')}`);
  } catch (e) {
    log('T1-default-view', false, e.message);
    log('T1-no-console-errors', false, e.message);
  }

  // ─── Test 2: Six top-level branch rows in order ───
  console.log('--- Test 2: Six top-level branch rows ---');
  try {
    const roots = await page.$$eval('#dirList > .dir-row', rows =>
      rows.map(r => {
        const nameEl = r.querySelector('.dir-name');
        return nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
      })
    );
    const count = roots.length === 6;
    const firstNames = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    const namesFound = roots.map(r => {
      for (const fn of firstNames) {
        if (r.includes(fn)) return fn;
      }
      return null;
    });
    const correctOrder = namesFound.join(',') === firstNames.join(',');

    log('T2-six-rows', count, `Found ${roots.length} rows`);
    log('T2-correct-order', correctOrder, `Order: [${namesFound.join(', ')}]`);
    
    // Log each row text for evidence
    roots.forEach((r, i) => console.log(`    Row ${i}: ${r.substring(0, 80)}`));
  } catch (e) {
    log('T2-six-rows', false, e.message);
    log('T2-correct-order', false, e.message);
  }

  // ─── Test 3: Click PANFILO row -> expands to Gen 2 kids ───
  console.log('--- Test 3: Click PANFILO row - expand Gen 2 ---');
  try {
    // NOTE: Clicking the row center lands on .dir-info (name span) which opens
    // detail via stopPropagation instead of expanding. This is a known behavior
    // (see DEF-001). We click the chevron to verify expand functionality works.
    const chevSelector = '#dirList > .dir-row[data-id="panfilo-apor"] .dir-chev';
    await page.click(chevSelector);
    await page.waitForTimeout(300);

    // Check chevron changed to open
    const chevron = await page.$eval(chevSelector, el => el.textContent);
    const chevronOpen = chevron === '\u25BE'; // ▾

    // Check Gen 2 kids appear
    const kidsContainer = await page.$('#dirList > .dir-row[data-id="panfilo-apor"] + .dir-kids');
    const kidsExist = kidsContainer !== null;

    let kidNames = [];
    if (kidsExist) {
      kidNames = await kidsContainer.$$eval('.dir-row', rows =>
        rows.map(r => {
          const nameEl = r.querySelector('.dir-name');
          return nameEl ? nameEl.textContent.trim().split(/\s/)[0] : '';
        })
      );
    }
    const expectedKids = ['Ricardenel', 'Charlita', 'Merlyn', 'Yelbe', 'Lonifredo', 'Marlibeth', 'Demelito', 'Jofersel'];
    const kidsMatch = expectedKids.every(k => kidNames.some(n => n.includes(k)));

    log('T3-chevron-toggles', chevronOpen, `Chevron text: "${chevron}"`);
    log('T3-kids-visible', kidsExist, `Kids container exists: ${kidsExist}`);
    log('T3-correct-kids', kidsMatch, `Kids: [${kidNames.join(', ')}]`);
  } catch (e) {
    log('T3-chevron-toggles', false, e.message);
    log('T3-kids-visible', false, e.message);
    log('T3-correct-kids', false, e.message);
  }

  // ─── Test 4: DEMELITO row - leaf node, Reina Bajo spouse ───
  console.log('--- Test 4: DEMELITO row - leaf node ---');
  try {
    const demelitoRow = await page.$('#dirList .dir-row[data-id="demelito-apor"]');
    if (!demelitoRow) throw new Error('Demelito row not found in expanded Panfilo branch');

    const rowText = await demelitoRow.$eval('.dir-name', el => el.textContent);
    const hasSpouse = rowText.includes('Reina Bajo');

    const hasKids = await demelitoRow.getAttribute('data-kids');
    const isLeaf = hasKids === '0';

    const chevronHidden = await demelitoRow.$eval('.dir-chev', el => {
      return el.classList.contains('dir-chev-empty');
    });

    log('T4-spouse-shown', hasSpouse, `Row text: "${rowText.trim().substring(0, 80)}"`);
    log('T4-is-leaf', isLeaf, `data-kids="${hasKids}"`);
    log('T4-chevron-hidden', chevronHidden, `Chevron hidden for leaf: ${chevronHidden}`);
  } catch (e) {
    log('T4-spouse-shown', false, e.message);
    log('T4-is-leaf', false, e.message);
    log('T4-chevron-hidden', false, e.message);
  }

  // ─── Test 5: CONSORCIA -> Wilda Tejero -> Gen 3 (recursive) ───
  console.log('--- Test 5: CONSORCIA -> Wilda -> Gen 3 recursion ---');
  try {
    // Expand Consorcia via chevron
    await page.click('#dirList > .dir-row[data-id="consorcia-apor"] .dir-chev');
    await page.waitForTimeout(300);

    // Find Wilda Tejero
    const wildaRow = await page.$('#dirList .dir-row[data-id="wilda-tejero"]');
    if (!wildaRow) throw new Error('Wilda Tejero row not found');

    // Expand Wilda via chevron
    await page.click('#dirList .dir-row[data-id="wilda-tejero"] .dir-chev');
    await page.waitForTimeout(300);

    // Check Gen 3 kids: Limwil, Willy, Jesha
    const wildaKids = await page.$('#dirList .dir-row[data-id="wilda-tejero"] + .dir-kids');
    const gen3Exist = wildaKids !== null;
    let gen3Names = [];
    if (gen3Exist) {
      gen3Names = await wildaKids.$$eval('.dir-row', rows =>
        rows.map(r => {
          const nameEl = r.querySelector('.dir-name');
          return nameEl ? nameEl.textContent.trim().split(/\s/)[0] : '';
        })
      );
    }
    const expectedGen3 = ['Limwil', 'Willy', 'Jesha'];
    const gen3Match = expectedGen3.every(k => gen3Names.some(n => n.includes(k)));

    log('T5-wilda-expanded', gen3Exist, `Wilda kids container: ${gen3Exist}`);
    log('T5-gen3-kids', gen3Match, `Gen 3: [${gen3Names.join(', ')}]`);
  } catch (e) {
    log('T5-wilda-expanded', false, e.message);
    log('T5-gen3-kids', false, e.message);
  }

  // ─── Test 6: Click name -> detail popover opens ───
  console.log('--- Test 6: Click name -> detail popover ---');
  try {
    // Click on a visible name (dir-info) to open detail
    const infoSpan = await page.$('#dirList .dir-row[data-id="limwil-tejero"] .dir-info');
    if (!infoSpan) throw new Error('Limwil info span not found');
    await infoSpan.click();
    await page.waitForTimeout(300);

    const detailVisible = await page.$eval('#detail', el => el.classList.contains('show'));
    const detailName = await page.$eval('#d-name', el => el.textContent);
    const nameCorrect = detailName.includes('Limwil');

    log('T6-detail-opens', detailVisible && nameCorrect, `Detail visible=${detailVisible}, name="${detailName}"`);

    // Close detail
    await page.click('#detail .close');
    await page.waitForTimeout(200);
    const detailClosed = !(await page.$eval('#detail', el => el.classList.contains('show')));
    log('T6-detail-closes', detailClosed, `Detail closed: ${detailClosed}`);
  } catch (e) {
    log('T6-detail-opens', false, e.message);
    log('T6-detail-closes', false, e.message);
  }

  // ─── Test 7: Tree and Form tabs ───
  console.log('--- Test 7: Tab switching ---');
  try {
    // Click Family Tree tab
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    const treeActive = await page.$eval('#view-tree', el => el.classList.contains('active'));
    const dirHidden = await page.$eval('#view-dir', el => !el.classList.contains('active'));
    const nodeCount = await page.$$eval('#tree > g', gs => gs.length);
    const svgRendered = nodeCount > 0;

    log('T7-tree-tab', treeActive && svgRendered, `tree active=${treeActive}, SVG nodes=${nodeCount}`);

    // Click Member Form tab
    await page.click('#tab-form');
    await page.waitForTimeout(300);
    const formActive = await page.$eval('#view-form', el => el.classList.contains('active'));
    log('T7-form-tab', formActive, `form active=${formActive}`);

    // Click Directory tab back
    await page.click('#tab-dir');
    await page.waitForTimeout(300);
    const dirActive = await page.$eval('#view-dir', el => el.classList.contains('active'));

    // Check expansion state preserved (Panfilo should still be expanded, Consorcia too)
    const panfiloKids = await page.$('#dirList .dir-row[data-id="panfilo-apor"] + .dir-kids');
    const consorciaKids = await page.$('#dirList .dir-row[data-id="consorcia-apor"] + .dir-kids');
    const statePreserved = panfiloKids !== null && consorciaKids !== null;

    log('T7-dir-tab-back', dirActive, `dir active=${dirActive}`);
    log('T7-expansion-preserved', statePreserved, `Panfilo expanded: ${panfiloKids !== null}, Consorcia expanded: ${consorciaKids !== null}`);
  } catch (e) {
    log('T7-tree-tab', false, e.message);
    log('T7-form-tab', false, e.message);
    log('T7-dir-tab-back', false, e.message);
    log('T7-expansion-preserved', false, e.message);
  }

  // ─── Test 8: Search ───
  console.log('--- Test 8: Search functionality ---');
  try {
    await page.fill('#dirSearch', 'Wilda');
    await page.waitForTimeout(400);

    const searchResults = await page.$$eval('#dirList .dir-row', rows => rows.length);
    const hasResults = searchResults > 0;

    const resultText = await page.$$eval('#dirList .dir-name', els => els.map(e => e.textContent.trim()));
    const wildaFound = resultText.some(t => t.includes('Wilda'));
    log('T8-search-results', hasResults && wildaFound, `Results: ${searchResults}, texts: [${resultText.join(', ')}]`);

    // Click on Wilda result to open detail
    if (hasResults) {
      const firstResult = await page.$('#dirList .dir-row');
      if (firstResult) {
        await firstResult.click();
        await page.waitForTimeout(300);
        const detailOpen = await page.$eval('#detail', el => el.classList.contains('show'));
        log('T8-click-result-detail', detailOpen, `Detail opened from search: ${detailOpen}`);
        await page.click('#detail .close');
        await page.waitForTimeout(200);
      }
    } else {
      log('T8-click-result-detail', false, 'No search results');
    }

    // Clear search
    await page.fill('#dirSearch', '');
    await page.waitForTimeout(400);

    const hierarchicalRows = await page.$$eval('#dirList > .dir-row', rows => rows.length);
    const backToHierarchy = hierarchicalRows === 6;
    log('T8-clear-restore-hierarchy', backToHierarchy, `Top-level rows after clear: ${hierarchicalRows}`);
  } catch (e) {
    log('T8-search-results', false, e.message);
    log('T8-click-result-detail', false, e.message);
    log('T8-clear-restore-hierarchy', false, e.message);
  }

  // ─── Test 9: i18n ───
  console.log('--- Test 9: i18n setLang ---');
  try {
    // Switch to Tagalog
    await page.evaluate(() => setLang('tl'));
    await page.waitForTimeout(300);

    const dirHeaderTL = await page.$eval('#view-dir h2', el => el.textContent);
    const tagalogOk = dirHeaderTL === 'Direktoryo';

    const badgeTexts = await page.$$eval('#dirList .badge', els => els.map(e => e.textContent));
    const hasBuhay = badgeTexts.some(t => t === 'Buhay');
    const hasPumanaw = badgeTexts.some(t => t === 'Pumanaw');

    log('T9-tl-header', tagalogOk, `Header text: "${dirHeaderTL}"`);
    log('T9-tl-badges', hasBuhay || hasPumanaw, `Badges sample: [${badgeTexts.slice(0, 6).join(', ')}]`);

    // Switch back to English
    await page.evaluate(() => setLang('en'));
    await page.waitForTimeout(300);

    const dirHeaderEN = await page.$eval('#view-dir h2', el => el.textContent);
    const englishOk = dirHeaderEN === 'Directory';

    const noErrors = consoleErrors.length === 0;
    log('T9-en-restore', englishOk, `Header text: "${dirHeaderEN}"`);
    log('T9-no-errors', noErrors, noErrors ? 'No errors' : `Errors: ${consoleErrors.join('; ')}`);
  } catch (e) {
    log('T9-tl-header', false, e.message);
    log('T9-tl-badges', false, e.message);
    log('T9-en-restore', false, e.message);
    log('T9-no-errors', false, e.message);
  }

  // ─── Test 10: Screenshot ───
  console.log('--- Test 10: Screenshot ---');
  try {
    // Ensure PANFILO branch is expanded for screenshot
    const panfiloKids = await page.$('#dirList .dir-row[data-id="panfilo-apor"] + .dir-kids');
    if (!panfiloKids) {
      await page.click('#dirList > .dir-row[data-id="panfilo-apor"] .dir-chev');
      await page.waitForTimeout(300);
    }
    const screenshotPath = await screenshot('qa-directory-main-view.png');
    log('T10-screenshot', fs.existsSync(screenshotPath), `Saved: ${screenshotPath}`);
  } catch (e) {
    log('T10-screenshot', false, e.message);
  }

  // ─── Summary ───
  console.log('\n=== SUMMARY ===\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  for (const r of results) {
    console.log(`  [${r.status}] ${r.test}`);
  }

  console.log(`\n  Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  const overall = failed === 0 ? 'PASS' : 'FAIL';
  console.log(`\n  VERDICT: ${overall}\n`);

  await browser.close();
  return overall;
}

run().then(v => process.exit(v === 'PASS' ? 0 : 1)).catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
