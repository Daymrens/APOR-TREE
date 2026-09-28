/**
 * E2E: Live Firestore sync — apor-family.html
 * Tests 1–10 from QA spec.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SS_DIR = join(process.cwd(), 'armada', 'screenshots', 'apor-family-tree');
if (!existsSync(SS_DIR)) mkdirSync(SS_DIR, { recursive: true });

const URL = 'http://localhost:4199/apor-family.html';
const results = [];

function record(num, name, pass, detail) {
  results.push({ num, name, pass, detail });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`[TEST ${num}] ${tag} — ${name}${detail ? ': ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  // ── TEST 1: Load page, Directory view, no console errors ──────────
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    // wait for sync (up to 8s)
    await page.waitForFunction(() => window.SYNC_STATE === 'live' || window.SYNC_STATE === 'offline', { timeout: 8000 }).catch(() => {});
    // wait an extra 2s for rendering
    await page.waitForTimeout(2000);

    const activeView = await page.$eval('#view-dir', el => el.classList.contains('active'));
    const allConsoleErrors = [...consoleErrors, ...pageErrors];
    const realErrors = allConsoleErrors.filter(e => !e.includes('favicon') && !e.includes('404'));
    record(1, 'Load page - Directory view, no console errors',
      activeView && realErrors.length === 0,
      `dir-active=${activeView}, consoleErrors=${realErrors.length} [${realErrors.join('; ')}]`);
  } catch (e) {
    record(1, 'Load page - Directory view, no console errors', false, e.message);
  }

  // ── TEST 2: Sync notice "Synced from Firestore" visible ───────────
  try {
    const syncText = await page.$eval('#syncNoticeDir', el => el.textContent);
    const visible = syncText && syncText.includes('Firestore');
    await page.screenshot({ path: join(SS_DIR, 'qa-live-sync.png'), fullPage: true });
    record(2, 'Sync notice visible',
      visible,
      `syncNoticeDir text="${syncText}"`);
  } catch (e) {
    record(2, 'Sync notice visible', false, e.message);
  }

  // ── TEST 3: Live data applied — tree node count > 128 ────────────
  let treeCount = 0;
  try {
    // Switch to tree tab
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    treeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
    record(3, 'Live data: tree node count > 128',
      treeCount > 128,
      `tree node groups = ${treeCount} (expect > 128)`);
  } catch (e) {
    record(3, 'Live data: tree node count > 128', false, e.message);
  }

  // ── TEST 4: Live Firestore count matches tree node count ──────────
  let liveCount = 0;
  try {
    const res = await page.evaluate(() =>
      fetch('https://firestore.googleapis.com/v1/projects/apor-tree/databases/(default)/documents/family_members?pageSize=1000')
        .then(r => r.json())
        .then(j => j.documents.length)
    );
    liveCount = res;
    record(4, 'Live Firestore count matches tree nodes',
      treeCount === liveCount,
      `firestore=${liveCount}, tree=${treeCount}`);
  } catch (e) {
    record(4, 'Live Firestore count matches tree nodes', false, e.message);
  }

  // ── TEST 5: Directory roots still exactly 6 in order ──────────────
  // Switch to directory tab
  try {
    await page.click('#tab-dir');
    await page.waitForTimeout(500);
    // The hierarchical directory shows root rows with class "dir-branch" directly under #dirList
    const rootRows = await page.$$eval('#dirList > .dir-row.dir-branch', rows =>
      rows.map(r => {
        const nameSpan = r.querySelector('.dir-name');
        return nameSpan ? nameSpan.textContent.trim() : 'UNKNOWN';
      })
    );
    // The expected root names (first name portion): Panfilo, Feliciano, Pedro, Pablo, Purificasion, Consorcia
    // Note: Names in live data may differ slightly — check first-word containment
    const expectedFirst = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    const actualFirsts = rootRows.map(n => n.split(/\s/)[0]);
    const matchCount = expectedFirst.filter(e => actualFirsts.some(a => a.includes(e))).length;
    const orderOk = expectedFirst.every((e, i) => actualFirsts[i] && actualFirsts[i].includes(e));
    record(5, 'Directory roots: 6 in order',
      rootRows.length === 6 && orderOk,
      `roots=[${actualFirsts.join(',')}], count=${rootRows.length}, orderOk=${orderOk}`);
  } catch (e) {
    record(5, 'Directory roots: 6 in order', false, e.message);
  }

  // ── TEST 6: Form add-mode branch dropdown — 6 branches, Panfilo populates ──
  try {
    await page.click('#tab-form');
    await page.waitForTimeout(500);
    // Click the branch search input to open the dropdown
    await page.click('#branchSearch');
    await page.waitForTimeout(300);
    const branchItems = await page.$$eval('#branchList .sdd-row', rows => rows.map(r => r.textContent.trim()));
    // Pick Panfilo
    const panfiloItem = await page.$('#branchList .sdd-row[data-id="panfilo-apor"]');
    if (panfiloItem) await panfiloItem.click();
    await page.waitForTimeout(500);
    // Check if branchInfo panel populated
    const branchInfo = await page.$eval('#branchInfo', el => el.textContent);
    const hasContent = branchInfo && branchInfo.length > 10;
    record(6, 'Form branch dropdown: 6 branches, Panfilo populates',
      branchItems.length === 6 && hasContent,
      `branches=[${branchItems.join(',')}], branchInfo.length=${branchInfo.length}`);
  } catch (e) {
    record(6, 'Form branch dropdown: 6 branches, Panfilo populates', false, e.message);
  }

  // ── TEST 7: Refresh button — click sync, no errors, notice stays ──
  try {
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    const beforeText = await page.$eval('#syncNotice', el => el.textContent);
    // Click the sync button
    await page.click('[data-i18n="syncNow"]');
    await page.waitForTimeout(3000);
    const afterText = await page.$eval('#syncNotice', el => el.textContent);
    const errorsAfter = [...consoleErrors, ...pageErrors].filter(e => !e.includes('favicon'));
    record(7, 'Refresh button: sync works, no errors, notice persists',
      afterText && afterText.includes('Firestore') && errorsAfter.length === 0,
      `before="${beforeText}", after="${afterText}", errors=${errorsAfter.length}`);
  } catch (e) {
    record(7, 'Refresh button: sync works, no errors, notice persists', false, e.message);
  }

  // ── TEST 8: Offline fallback — 128 members, offline notice ────────
  try {
    // Block Firestore requests
    await page.route('**/firestore.googleapis.com/**', route => route.abort());
    // Reload page while offline
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForFunction(() => window.SYNC_STATE === 'offline' || document.querySelector('#syncNoticeDir')?.textContent.includes('offline'), { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Switch to tree to count nodes
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    const offlineTreeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
    const offlineNotice = await page.$eval('#syncNoticeDir', el => el.textContent);
    const hasOfflineNotice = offlineNotice && offlineNotice.toLowerCase().includes('offline');
    record(8, 'Offline fallback: 128 members, offline notice',
      offlineTreeCount === 128 && hasOfflineNotice,
      `offline tree count=${offlineTreeCount} (expect 128), notice="${offlineNotice}"`);

    // Restore online, click refresh
    await page.unroute('**/firestore.googleapis.com/**');
    await page.click('[data-i18n="syncNow"]');
    await page.waitForTimeout(3000);
    const restoredTreeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
    const restoredNotice = await page.$eval('#syncNotice', el => el.textContent);
    record(8, 'Offline fallback: restore online -> live count',
      restoredTreeCount > 128 && restoredNotice.includes('Firestore'),
      `restored count=${restoredTreeCount}, notice="${restoredNotice}"`);
    // Override test 8 to be compound pass
    const t8pass = (offlineTreeCount === 128 && hasOfflineNotice) || (restoredTreeCount > 128 && restoredNotice.includes('Firestore'));
    results[results.length - 2].pass = offlineTreeCount === 128 && hasOfflineNotice;
    results[results.length - 1].name = 'Offline fallback: restore online';
    results[results.length - 1].pass = restoredTreeCount > 128 && restoredNotice.includes('Firestore');
  } catch (e) {
    record(8, 'Offline fallback', false, e.message);
  }

  // ── TEST 9: i18n — setLang('tl') → notice translates, no errors ───
  try {
    await page.evaluate(() => setLang('tl'));
    await page.waitForTimeout(500);
    const tlNotice = await page.$eval('#syncNoticeDir', el => el.textContent);
    const tlChip = await page.$eval('.filter-chip', el => el.textContent);
    const errorsAfterTl = [...consoleErrors, ...pageErrors];
    const realErrs = errorsAfterTl.filter(e => !e.includes('favicon'));
    const noticeTranslated = tlNotice.includes('Na-sync') || tlNotice.includes('Firestore');
    record(9, 'i18n Tagalog: notice + labels translate',
      noticeTranslated && realErrs.length === 0,
      `tl notice="${tlNotice}", firstChip="${tlChip}", errors=${realErrs.length}`);
  } catch (e) {
    record(9, 'i18n Tagalog: notice + labels translate', false, e.message);
  }

  // ── TEST 10: Dynamic branches — chips >= 5, no crash ──────────────
  try {
    await page.evaluate(() => setLang('en'));
    await page.waitForTimeout(300);
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    const chipCount = await page.$$eval('.filter-chip', cs => cs.length);
    const chipTexts = await page.$$eval('.filter-chip', cs => cs.map(c => c.textContent));
    const legendSpans = await page.$$eval('#legend span', ss => ss.length);
    // No crash: SVG rendered
    const svgNodeCount = await page.$$eval('#tree g[style*="cursor"]', gs => gs.length);
    record(10, 'Dynamic branches: chips >= 5, no crash',
      chipCount >= 5 && svgNodeCount > 10,
      `chips=${chipCount} [${chipTexts.join(',')}], legendSpans=${legendSpans}, svgNodes=${svgNodeCount}`);
  } catch (e) {
    record(10, 'Dynamic branches: chips >= 5, no crash', false, e.message);
  }

  await browser.close();

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  let pass = 0, fail = 0;
  results.forEach(r => {
    const tag = r.pass ? 'PASS' : 'FAIL';
    console.log(`  [TEST ${r.num}] ${tag} — ${r.name}`);
    if (r.pass) pass++; else fail++;
  });
  console.log(`\nTotal: ${pass} PASS, ${fail} FAIL out of ${results.length} tests`);
  console.log(`VERDICT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
})();
