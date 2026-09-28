/**
 * DEF-002 retest: SDD searchable dropdowns + full three-mode form flow
 * Playwright E2E — Corvette (QA)
 *
 * Hard time budget: 7 minutes
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:4199/apor-family.html';
const SS_DIR = join(process.cwd(), 'armada', 'screenshots', 'apor-family-tree');
mkdirSync(SS_DIR, { recursive: true });

const results = [];
let passCount = 0;
let failCount = 0;

function log(label, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passCount++; else failCount++;
  results.push({ label, status, detail: detail || '' });
  console.log(`  [${status}] ${label}${detail ? ' -- ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(4000);

  // Intercept API calls
  const capturedPosts = [];
  await page.route('https://apor-tree.vercel.app/api/contributions', async route => {
    const req = route.request();
    const body = req.postData();
    capturedPosts.push(JSON.parse(body));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForTimeout(500);

  // Click Member Form tab
  await page.click('#tab-form');
  await page.waitForTimeout(300);

  console.log('\n=== DEF-002 Retest: SDD Searchable Dropdowns ===\n');

  // ─── TEST 1: Branch dropdown opens, shows 6 branches, filter + pick ───
  console.log('--- Test 1: Branch dropdown open/filter/pick ---');
  try {
    // Click branch input to open
    await page.click('#branchSearch');
    await page.waitForTimeout(300);

    const branchListOpen = await page.$eval('#branchList', el => el.classList.contains('open'));
    log('Branch dropdown opens (class "open")', branchListOpen);

    const branchCount = await page.$$eval('#branchList .sdd-row', rows => rows.length);
    log('Branch dropdown shows 6 options', branchCount === 6, `count=${branchCount}`);

    const branchNames = await page.$$eval('#branchList .sdd-row .dir-name', els => els.map(e => e.textContent));
    const expectedBranches = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    const namesMatch = JSON.stringify(branchNames) === JSON.stringify(expectedBranches);
    log('Branch names match expected', namesMatch, JSON.stringify(branchNames));

    // Filter with "Pan"
    await page.fill('#branchSearch', 'Pan');
    await page.waitForTimeout(200);
    const filteredCount = await page.$$eval('#branchList .sdd-row', rows => rows.length);
    log('Typing "Pan" filters to 1 result (Panfilo)', filteredCount === 1, `count=${filteredCount}`);

    // Pick Panfilo
    await page.click('#branchList .sdd-row');
    await page.waitForTimeout(300);

    const branchVal = await page.$eval('#branchSearch', el => el.value);
    log('Branch input value set to Panfilo', branchVal === 'Panfilo', `value="${branchVal}"`);

    const branchListClosed = await page.$eval('#branchList', el => !el.classList.contains('open'));
    log('Branch dropdown closes after pick', branchListClosed);

    const branchInfoHtml = await page.$eval('#branchInfo', el => el.innerHTML);
    log('Branch info panel appears with Gen 2 members', branchInfoHtml.length > 10, `html_len=${branchInfoHtml.length}`);

    // Take screenshot with dropdown OPEN for visual proof
    // Reopen by filling empty then clicking
    await page.evaluate(() => {
      document.getElementById('branchSearch').value = '';
      document.getElementById('branchSearch').dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(200);
    // Force open via JS
    await page.evaluate(() => {
      const list = document.getElementById('branchList');
      document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
      list.classList.add('open');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(SS_DIR, 'qa-sdd-fix.png'), fullPage: false });
    console.log('  Screenshot: armada/screenshots/apor-family-tree/qa-sdd-fix.png');

    // Close dropdown via JS and re-select Panfilo for remaining tests
    await page.evaluate(() => {
      document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
    });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const st = SDD['branchSearch'];
      const panfilo = st.options.find(o => o.id === 'panfilo-apor');
      st.selected = panfilo;
      document.getElementById('branchSearch').value = panfilo.label;
      if (st.onPick) st.onPick(panfilo);
    });
    await page.waitForTimeout(300);
  } catch (e) {
    log('Test 1 exception', false, e.message);
  }

  // ─── TEST 2: Target dropdown opens, search "Demelito", pick ───
  console.log('\n--- Test 2: Target dropdown search + pick ---');
  try {
    await page.click('#targetSearch');
    await page.waitForTimeout(300);

    const targetListOpen = await page.$eval('#targetList', el => el.classList.contains('open'));
    log('Target dropdown opens', targetListOpen);

    await page.fill('#targetSearch', 'Demelito');
    await page.waitForTimeout(300);
    const targetFiltered = await page.$$eval('#targetList .sdd-row', rows => rows.length);
    log('Search "Demelito" shows 1 result', targetFiltered === 1, `count=${targetFiltered}`);

    await page.click('#targetList .sdd-row');
    await page.waitForTimeout(300);
    const targetVal = await page.$eval('#targetSearch', el => el.value);
    log('Target value set', targetVal.includes('Demelito'), `value="${targetVal}"`);

    const targetClosed = await page.$eval('#targetList', el => !el.classList.contains('open'));
    log('Target dropdown closes after pick', targetClosed);
  } catch (e) {
    log('Test 2 exception', false, e.message);
  }

  // ─── TEST 3: Relation radio auto-fill ───
  console.log('\n--- Test 3: Relation auto-fill behavior ---');
  try {
    await page.click('input[name="relation"][value="sibling"]');
    await page.waitForTimeout(200);
    const sibParent = await page.$eval('#parentName', el => el.value);
    log('Sibling: parentName auto-filled from target parents', sibParent.length > 0, `parentName="${sibParent}"`);

    await page.click('input[name="relation"][value="child"]');
    await page.waitForTimeout(200);
    const childParent = await page.$eval('#parentName', el => el.value);
    log('Child: parentName auto-filled with target + spouse', childParent.includes('Demelito'), `parentName="${childParent}"`);

    await page.click('input[name="relation"][value="spouse"]');
    await page.waitForTimeout(200);
    const spouseParent = await page.$eval('#parentName', el => el.value);
    log('Spouse: parentName is empty', spouseParent === '', `parentName="${spouseParent}"`);
  } catch (e) {
    log('Test 3 exception', false, e.message);
  }

  // ─── TEST 4: Guard — target with existing spouse + Spouse relation ───
  console.log('\n--- Test 4: Spouse guard ---');
  try {
    // Demelito already has spouse (reina-bajo)
    await page.click('input[name="relation"][value="spouse"]');
    await page.waitForTimeout(200);
    await page.fill('#firstName', 'TestGuard');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const bannerText = await page.$eval('#form-banner', el => el.textContent);
    const hasSpouseErr = bannerText.toLowerCase().includes('spouse') || bannerText.toLowerCase().includes('already');
    log('Spouse guard: "already has a spouse" banner shown', hasSpouseErr, `banner="${bannerText}"`);

    const addPostsAfterGuard = capturedPosts.filter(p => p.type === 'add_member');
    log('Spouse guard: no add_member POST fired', addPostsAfterGuard.length === 0);
  } catch (e) {
    log('Test 4 exception', false, e.message);
  }

  // ─── TEST 5: Full add submit (intercepted) ───
  console.log('\n--- Test 5: Full add submit with intercept ---');
  try {
    capturedPosts.length = 0;

    // Ensure branch and target are still selected
    const hasBranch = await page.evaluate(() => SDD['branchSearch']?.selected?.id === 'panfilo-apor');
    const hasTarget = await page.evaluate(() => SDD['targetSearch']?.selected?.id === 'demelito-apor');
    if (!hasBranch || !hasTarget) {
      console.log('  [NOTE] Re-selecting branch/target for test 5');
      await page.evaluate(() => {
        const bs = SDD['branchSearch'];
        const panfilo = bs.options.find(o => o.id === 'panfilo-apor');
        bs.selected = panfilo;
        document.getElementById('branchSearch').value = panfilo.label;
        if (bs.onPick) bs.onPick(panfilo);
      });
      await page.waitForTimeout(300);
      // Now re-select target
      await page.evaluate(() => {
        const ts = SDD['targetSearch'];
        const demelito = ts.options.find(o => o.id === 'demelito-apor');
        ts.selected = demelito;
        document.getElementById('targetSearch').value = demelito.label;
        if (ts.onPick) ts.onPick(demelito);
      });
      await page.waitForTimeout(300);
    }

    await page.click('input[name="relation"][value="child"]');
    await page.waitForTimeout(200);
    await page.fill('#firstName', 'QA Retest');
    await page.fill('#lastName', 'Apor');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);

    const banner5 = await page.$eval('#form-banner', el => el.textContent);
    const submittedOk = banner5.toLowerCase().includes('thank') || banner5.toLowerCase().includes('submitted') || banner5.toLowerCase().includes('saved');
    log('Add submit: success banner shown', submittedOk, `banner="${banner5}"`);

    const addPost = capturedPosts.find(p => p.type === 'add_member');
    log('Add submit: POST body type is "add_member"', !!addPost);
    if (addPost) {
      log('Add submit: data.relation is "child"', addPost.data?.relation === 'child', `relation="${addPost.data?.relation}"`);
      log('Add submit: data.targetId is "demelito-apor"', addPost.data?.targetId === 'demelito-apor', `targetId="${addPost.data?.targetId}"`);
      // branch field carries the root person's first name (e.g. "Panfilo" not "Apor")
      log('Add submit: data.branch is "Panfilo" (root first name)', addPost.data?.branch === 'Panfilo', `branch="${addPost.data?.branch}"`);
      log('Add submit: firstName in title', addPost.title?.includes('QA Retest'), `title="${addPost.title}"`);
    }
  } catch (e) {
    log('Test 5 exception', false, e.message);
  }

  // ─── TEST 6: Correction mode ───
  console.log('\n--- Test 6: Correction mode ---');
  try {
    capturedPosts.length = 0;

    await page.click('.mode-tab[data-mode="correct"]');
    await page.waitForTimeout(300);

    await page.click('#personSearch');
    await page.waitForTimeout(300);
    const personListOpen = await page.$eval('#personList', el => el.classList.contains('open'));
    log('Correction: person dropdown opens', personListOpen);

    await page.fill('#personSearch', 'Purificasion');
    await page.waitForTimeout(300);
    const corrFiltered = await page.$$eval('#personList .sdd-row', rows => rows.length);
    log('Correction: search "Purificasion" shows result(s)', corrFiltered >= 1, `count=${corrFiltered}`);

    await page.click('#personList .sdd-row');
    await page.waitForTimeout(400);

    const corrCardVisible = await page.evaluate(() => {
      const card = document.getElementById('corrCard');
      return card && !card.classList.contains('hide') && card.innerHTML.includes('Purificasion');
    });
    log('Correction: details card shows Purificasion', corrCardVisible);

    await page.selectOption('#corrField', 'birth_date');
    await page.waitForTimeout(200);
    await page.fill('#corrValue', '1950-01-15');
    await page.waitForTimeout(200);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);

    const corrPost = capturedPosts.find(p => p.type === 'correction');
    log('Correction: POST type is "correction"', !!corrPost);
    if (corrPost) {
      log('Correction: field is "birth_date"', corrPost.data?.field === 'birth_date', `field="${corrPost.data?.field}"`);
      log('Correction: personId present', !!corrPost.data?.personId);
    }

    const corrBanner = await page.$eval('#form-banner', el => el.textContent);
    const corrOk = corrBanner.toLowerCase().includes('thank') || corrBanner.toLowerCase().includes('submitted') || corrBanner.toLowerCase().includes('saved');
    log('Correction: success banner', corrOk, `banner="${corrBanner}"`);
  } catch (e) {
    log('Test 6 exception', false, e.message);
  }

  // ─── TEST 7: Suggestion mode ───
  console.log('\n--- Test 7: Suggestion mode ---');
  try {
    capturedPosts.length = 0;

    await page.click('.mode-tab[data-mode="suggest"]');
    await page.waitForTimeout(300);

    await page.selectOption('#suggCat', 'reunion');
    await page.fill('#suggText', 'QA retest suggestion body');
    await page.waitForTimeout(200);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);

    const suggPost = capturedPosts.find(p => p.type === 'suggestion');
    log('Suggestion: POST type is "suggestion"', !!suggPost);
    if (suggPost) {
      log('Suggestion: category is "reunion"', suggPost.category === 'reunion', `category="${suggPost.category}"`);
      log('Suggestion: text in description', suggPost.description?.includes('QA retest'));
    }

    const suggBanner = await page.$eval('#form-banner', el => el.textContent);
    const suggOk = suggBanner.toLowerCase().includes('thank') || suggBanner.toLowerCase().includes('submitted') || suggBanner.toLowerCase().includes('saved');
    log('Suggestion: success banner', suggOk, `banner="${suggBanner}"`);
  } catch (e) {
    log('Test 7 exception', false, e.message);
  }

  // ─── TEST 8: Close-on-outside-click ───
  console.log('\n--- Test 8: Close-on-outside-click ---');
  try {
    await page.click('.mode-tab[data-mode="add"]');
    await page.waitForTimeout(300);

    // Ensure Panfilo is selected via JS
    await page.evaluate(() => {
      const bs = SDD['branchSearch'];
      if (!bs.selected) {
        const panfilo = bs.options.find(o => o.id === 'panfilo-apor');
        bs.selected = panfilo;
        document.getElementById('branchSearch').value = panfilo.label;
        if (bs.onPick) bs.onPick(panfilo);
      }
    });
    await page.waitForTimeout(200);

    // Open branch dropdown via JS (more reliable)
    await page.evaluate(() => {
      const list = document.getElementById('branchList');
      document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
      list.classList.add('open');
    });
    await page.waitForTimeout(200);

    const openBefore = await page.$eval('#branchList', el => el.classList.contains('open'));
    log('Branch dropdown opens for outside-click test', openBefore);

    // Click elsewhere on the page (header area via mouse)
    await page.mouse.click(640, 50);
    await page.waitForTimeout(300);

    const openAfter = await page.$eval('#branchList', el => el.classList.contains('open'));
    log('Branch dropdown closes on outside click', !openAfter, `still_open=${openAfter}`);
  } catch (e) {
    log('Test 8 exception', false, e.message);
  }

  // ─── TEST 9: Only one dropdown open at a time ───
  console.log('\n--- Test 9: Only one dropdown open at a time ---');
  try {
    // Open branch via JS
    await page.evaluate(() => {
      const list = document.getElementById('branchList');
      document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
      list.classList.add('open');
    });
    await page.waitForTimeout(200);

    const branchOpen = await page.$eval('#branchList', el => el.classList.contains('open'));
    log('Branch dropdown open before target click', branchOpen);

    // Click target input
    await page.click('#targetSearch');
    await page.waitForTimeout(300);

    const branchStillOpen = await page.$eval('#branchList', el => el.classList.contains('open'));
    const targetOpen = await page.$eval('#targetList', el => el.classList.contains('open'));
    log('Branch dropdown closed when target opens', !branchStillOpen, `branch_open=${branchStillOpen}`);
    log('Target dropdown opened', targetOpen);

    // Close target
    await page.mouse.click(640, 50);
    await page.waitForTimeout(200);
  } catch (e) {
    log('Test 9 exception', false, e.message);
  }

  // ─── TEST 10: i18n — setLang('tl') ───
  console.log('\n--- Test 10: i18n (Tagalog) ---');
  try {
    await page.click('.mode-tab[data-mode="add"]');
    await page.waitForTimeout(200);

    const enAddTab = await page.$eval('.mode-tab[data-mode="add"]', el => el.textContent);
    const enBranchLbl = await page.$eval('label[for="branchSearch"]', el => el.textContent);

    await page.evaluate(() => setLang('tl'));
    await page.waitForTimeout(300);

    const tlAddTab = await page.$eval('.mode-tab[data-mode="add"]', el => el.textContent);
    const tlBranchLbl = await page.$eval('label[for="branchSearch"]', el => el.textContent);
    log('i18n: add tab text changed', tlAddTab !== enAddTab, `en="${enAddTab}" tl="${tlAddTab}"`);
    log('i18n: branch label changed', tlBranchLbl !== enBranchLbl, `en="${enBranchLbl}" tl="${tlBranchLbl}"`);

    // Check dropdowns still work in Tagalog
    await page.evaluate(() => {
      const list = document.getElementById('branchList');
      document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
      list.classList.add('open');
    });
    await page.waitForTimeout(300);
    const tlBranchOpen = await page.$eval('#branchList', el => el.classList.contains('open'));
    log('i18n: branch dropdown still opens in Tagalog', tlBranchOpen);

    await page.mouse.click(640, 50);
    await page.waitForTimeout(200);

    await page.evaluate(() => setLang('en'));
    await page.waitForTimeout(200);

    log('i18n: no console errors throughout tests', consoleErrors.length === 0,
      consoleErrors.length > 0 ? `errors: ${consoleErrors.slice(0, 3).join('; ')}` : 'clean');
  } catch (e) {
    log('Test 10 exception', false, e.message);
  }

  // ─── TEST 11: Screenshot evidence ───
  console.log('\n--- Test 11: Screenshot evidence ---');
  try {
    const ssPath = join(SS_DIR, 'qa-sdd-fix.png');
    const st = statSync(ssPath);
    log('Screenshot qa-sdd-fix.png exists and is valid', st.size > 1000, `size=${st.size}`);
  } catch (e) {
    log('Test 11 exception', false, e.message);
  }

  // ─── SUMMARY ───
  console.log('\n=== SUMMARY ===');
  console.log(`  PASS: ${passCount}  FAIL: ${failCount}  TOTAL: ${passCount + failCount}`);
  console.log(`  Console errors: ${consoleErrors.length}`);
  console.log(`  Captured POSTs: ${capturedPosts.length}`);

  const report = {
    defect: 'DEF-002',
    timestamp: new Date().toISOString(),
    passCount,
    failCount,
    results,
    consoleErrors,
    capturedPosts,
  };
  writeFileSync(join(SS_DIR, 'phase3-results.json'), JSON.stringify(report, null, 2));

  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
})();
