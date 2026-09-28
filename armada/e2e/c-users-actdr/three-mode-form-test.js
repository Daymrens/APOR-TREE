// Standalone Playwright test - Three-Mode Form (v4 - final)
// Run: node armada/e2e/c-users-actdr/three-mode-form-test.js

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FILE_URL = 'file:///D:/PROJECTS/FamilyReunion/public/apor-family.html';
const SS_DIR = 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree';

const results = [];
function log(id, v, d) { const l = `${id}: ${v} -- ${d||''}`; console.log(l); results.push({id,v,d}); }

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(4000);

  const cerr = [];
  page.on('console', m => { if (m.type() === 'error') cerr.push(m.text()); });

  await page.goto(FILE_URL, { timeout: 8000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // ---- helpers ----
  async function goForm() {
    await page.click('#tab-form');
    await page.waitForTimeout(200);
  }

  // Ensure we're in add mode
  async function ensureAddMode() {
    await page.evaluate(() => setFormMode('add'));
    await page.waitForTimeout(100);
  }

  async function pickSDD(listId, itemId) {
    await page.evaluate(({ listId, itemId }) => {
      const list = document.getElementById(listId);
      if (list) list.classList.add('open');
      const row = list.querySelector(`.sdd-row[data-id="${itemId}"]`);
      if (row) row.click();
    }, { listId, itemId });
    await page.waitForTimeout(250);
  }

  async function openAndPick(sddInputId, listId, itemId) {
    await page.evaluate(({ sddInputId, listId }) => {
      if (typeof renderSdd === 'function') renderSdd(sddInputId);
      const list = document.getElementById(listId);
      if (list) list.classList.add('open');
    }, { sddInputId, listId });
    await page.waitForTimeout(100);
    await pickSDD(listId, itemId);
  }

  async function selectBranchPanfilo() {
    await openAndPick('branchSearch', 'branchList', 'panfilo-apor');
  }

  async function selectTarget(itemId) {
    await openAndPick('targetSearch', 'targetList', itemId);
  }

  async function resetForm() {
    await page.evaluate(() => {
      if (typeof clearPicks === 'function') clearPicks();
      document.getElementById('memberForm').reset();
    });
    await page.waitForTimeout(100);
  }

  // Set SDD target directly (for items not in branch list)
  async function setTargetDirect(memberId) {
    await page.evaluate((memberId) => {
      const m = MEMBERS.find(x => x.id === memberId);
      if (!m) return;
      const st = SDD['targetSearch'];
      if (!st) return;
      const opt = st.options.find(o => o.id === memberId);
      if (opt) {
        st.selected = opt;
        document.getElementById('targetSearch').value = opt.label;
      } else {
        // Create a synthetic option if not in list
        const synthetic = { id: m.id, label: m.name, m: m };
        st.selected = synthetic;
        document.getElementById('targetSearch').value = m.name;
      }
    }, memberId);
    await page.waitForTimeout(100);
  }

  // ======================== T1 ========================
  try {
    await goForm();
    const data = await page.evaluate(() => ({
      formActive: document.getElementById('view-form').classList.contains('active'),
      tabCount: document.querySelectorAll('.mode-tab').length,
      addActive: document.querySelector('.mode-tab[data-mode="add"]').classList.contains('active'),
      texts: [...document.querySelectorAll('.mode-tab')].map(e => e.textContent.trim()),
    }));
    const ok = data.formActive && data.tabCount === 3 && data.addActive
      && data.texts[0] === 'Add Family Member' && data.texts[1] === 'Correction' && data.texts[2] === 'Suggestion'
      && cerr.length === 0;
    log('T1', ok ? 'PASS' : 'FAIL', `tabs=${JSON.stringify(data.texts)} active=${data.addActive} errors=${cerr.length}`);
  } catch (e) { log('T1', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T2 ========================
  try {
    await goForm();
    await ensureAddMode();
    await selectBranchPanfilo();
    const info = await page.$eval('#branchInfo', el => el.textContent);
    const has = n => info.includes(n);
    const expect = ['Panfilo Apor', 'Ricardenel', 'Charlita', 'Merlyn', 'Yelbe', 'Lonifredo', 'Marlibeth', 'Demelito', 'Jofersel'];
    const missing = expect.filter(n => !has(n));
    const hasAntonia = has('Antonia');
    const g2 = (info.match(/G2/g) || []).length;
    // Antonia is NOT in branchPeople() output -- this is a defect (DEF-001)
    log('T2', missing.length === 0 ? 'PASS' : 'FAIL',
      `missing=[${missing}] antonia=${hasAntonia} g2=${g2}`);
  } catch (e) { log('T2', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T3 ========================
  // Verify auto-fill matches code's own hint text:
  //   Sibling: parents of target (Panfilo & Antonia for Demelito)
  //   Child: target + spouse (Demelito & Reina for Demelito)
  //   Spouse: empty
  try {
    await goForm();
    await ensureAddMode();
    await selectBranchPanfilo();
    await selectTarget('demelito-apor');

    await page.click('input[value="sibling"]');
    await page.waitForTimeout(200);
    const sib = await page.$eval('#parentName', el => el.value);

    await page.click('input[value="child"]');
    await page.waitForTimeout(200);
    const ch = await page.$eval('#parentName', el => el.value);

    await page.click('input[value="spouse"]');
    await page.waitForTimeout(200);
    const sp = await page.$eval('#parentName', el => el.value);

    // Sibling of Demelito: parents = Panfilo Apor & Antonia Montecalvo
    const sibOK = sib.includes('Panfilo') && sib.includes('Antonia');
    // Child of Demelito: target + spouse = Demelito Apor & Reina Bajo
    const chOK = ch.includes('Demelito') && ch.includes('Reina');
    // Spouse: empty
    const spOK = sp === '';

    log('T3', (sibOK && chOK && spOK) ? 'PASS' : 'FAIL',
      `sib="${sib}" child="${ch}" spouse="${sp}"`);
  } catch (e) { log('T3', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T4: Guards ========================
  // 4a: Panfilo target (has spouse Antonia) + Spouse -> "already has a spouse"
  try {
    await goForm();
    await ensureAddMode();
    await resetForm();
    await selectBranchPanfilo();
    await selectTarget('panfilo-apor');
    await page.click('input[value="spouse"]');
    await page.waitForTimeout(100);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
    const b4a = await page.$eval('#form-banner', el => el.textContent.toLowerCase());
    var ok4a = b4a.includes('already has a spouse');
  } catch (e) { var ok4a = false; var b4a = e.message.split('\n')[0]; }

  // 4b: Gerbacio (gen 0, root) + Spouse -> root-couple banner
  // Gerbacio is not in branch target list, so inject via evaluate
  try {
    await resetForm();
    await ensureAddMode();
    await selectBranchPanfilo();
    await setTargetDirect('gerbacio-apor');
    await page.click('input[value="spouse"]');
    await page.waitForTimeout(100);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
    const b4b = await page.$eval('#form-banner', el => el.textContent.toLowerCase());
    var ok4b = b4b.includes('root');
  } catch (e) { var ok4b = false; var b4b = e.message.split('\n')[0]; }

  // 4c: Gerbacio + Sibling -> "no parents" banner
  try {
    await resetForm();
    await ensureAddMode();
    await selectBranchPanfilo();
    await setTargetDirect('gerbacio-apor');
    await page.click('input[value="sibling"]');
    await page.waitForTimeout(100);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
    const b4c = await page.$eval('#form-banner', el => el.textContent.toLowerCase());
    var ok4c = b4c.includes('no parents');
  } catch (e) { var ok4c = false; var b4c = e.message.split('\n')[0]; }

  // 4d: empty picks -> errPickAll
  try {
    await resetForm();
    await ensureAddMode();
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
    const b4d = await page.$eval('#form-banner', el => el.textContent.toLowerCase());
    var ok4d = b4d.includes('pick');
  } catch (e) { var ok4d = false; var b4d = e.message.split('\n')[0]; }

  log('T4', (ok4a && ok4b && ok4c && ok4d) ? 'PASS' : 'FAIL',
    `4a:${ok4a?'ok':'FAIL'} 4b:${ok4b?'ok':'FAIL('+b4b.substring(0,50)+')'} 4c:${ok4c?'ok':'FAIL('+b4c.substring(0,50)+')'} 4d:${ok4d?'ok':'FAIL'}`);

  // ======================== T5: ADD payload intercept ========================
  try {
    let captured = null;
    await page.unroute('https://apor-tree.vercel.app/api/contributions').catch(() => {});
    await page.route('https://apor-tree.vercel.app/api/contributions', async route => {
      captured = JSON.parse(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await goForm();
    await ensureAddMode();
    await resetForm();
    await selectBranchPanfilo();
    await selectTarget('demelito-apor');
    await page.click('input[value="child"]');
    await page.waitForTimeout(100);
    await page.fill('#firstName', 'QA Test');
    await page.fill('#lastName', 'Apor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    console.log('  ADD PAYLOAD:\n' + JSON.stringify(captured, null, 2));

    // Verify: type=add_member, relation=child (lowercase per code), targetId=demelito-apor, title contains "QA Test", branch
    const t = captured && captured.type === 'add_member';
    const r = captured && captured.data && captured.data.relation === 'child';
    const tid = captured && captured.data && captured.data.targetId === 'demelito-apor';
    const title = captured && captured.title && captured.title.includes('QA Test');
    log('T5', (t && r && tid && title) ? 'PASS' : 'FAIL',
      `type=${t} rel=${r} targetId=${tid} title=${title}`);
  } catch (e) { log('T5', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T6: CORRECTION payload intercept ========================
  try {
    let captured = null;
    await page.unroute('https://apor-tree.vercel.app/api/contributions').catch(() => {});
    await page.route('https://apor-tree.vercel.app/api/contributions', async route => {
      captured = JSON.parse(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await goForm();
    await page.click('.mode-tab[data-mode="correct"]');
    await page.waitForTimeout(250);

    await openAndPick('personSearch', 'personList', 'purificasion-apor');

    const cardVis = await page.$eval('#corrCard', el => !el.classList.contains('hide'));
    const cardText = await page.$eval('#corrCard', el => el.textContent);
    const hasName = cardText.includes('Purificasion');
    const hasGen = cardText.includes('G1');
    const hasBranch = cardText.includes('Presbitero');

    await page.selectOption('#corrField', 'birth_date');
    await page.waitForTimeout(150);
    await page.fill('#corrValue', '1950-01-01');
    await page.waitForTimeout(100);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    console.log('  CORRECTION PAYLOAD:\n' + JSON.stringify(captured, null, 2));

    const ok = captured && captured.type === 'correction'
      && captured.data.personId === 'purificasion-apor'
      && captured.data.field === 'birth_date'
      && captured.data.correctedValue === '1950-01-01';

    log('T6', (cardVis && hasName && ok) ? 'PASS' : 'FAIL',
      `card=${cardVis && hasName} gen=${hasGen} branch=${hasBranch} payload=${ok}`);
  } catch (e) { log('T6', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T7: SUGGESTION payload + empty validation ========================
  try {
    let captured = null;
    await page.unroute('https://apor-tree.vercel.app/api/contributions').catch(() => {});
    await page.route('https://apor-tree.vercel.app/api/contributions', async route => {
      captured = JSON.parse(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await goForm();
    await page.click('.mode-tab[data-mode="suggest"]');
    await page.waitForTimeout(250);

    const catVal = await page.$eval('#suggCat', el => el.value);

    await page.fill('#suggText', 'QA test suggestion');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    console.log('  SUGGESTION PAYLOAD:\n' + JSON.stringify(captured, null, 2));

    const ok = captured && captured.type === 'suggestion'
      && captured.category === 'reunion'
      && captured.description && captured.description.includes('QA test suggestion');

    captured = null;
    await page.fill('#suggText', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(400);
    const bEmpty = await page.$eval('#form-banner', el => el.textContent);
    const emptyBlocked = captured === null && bEmpty.length > 0;

    log('T7', (ok && emptyBlocked) ? 'PASS' : 'FAIL',
      `payload=${ok} catVal=${catVal} emptyBlocked=${emptyBlocked}`);
  } catch (e) { log('T7', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T8: i18n ========================
  try {
    await goForm();
    await ensureAddMode();

    const en = await page.evaluate(() => ({
      add: document.querySelector('.mode-tab[data-mode="add"]').textContent.trim(),
      corr: document.querySelector('.mode-tab[data-mode="correct"]').textContent.trim(),
      sugg: document.querySelector('.mode-tab[data-mode="suggest"]').textContent.trim(),
      branch: document.querySelector('[data-i18n="branchLbl"]').textContent.trim(),
    }));

    await page.evaluate(() => setLang('tl'));
    await page.waitForTimeout(250);

    const tl = await page.evaluate(() => ({
      add: document.querySelector('.mode-tab[data-mode="add"]').textContent.trim(),
      corr: document.querySelector('.mode-tab[data-mode="correct"]').textContent.trim(),
      sugg: document.querySelector('.mode-tab[data-mode="suggest"]').textContent.trim(),
      branch: document.querySelector('[data-i18n="branchLbl"]').textContent.trim(),
      rel: document.querySelector('[data-i18n="relationLbl"]').textContent.trim(),
    }));

    await page.evaluate(() => setLang('en'));
    await page.waitForTimeout(250);

    const en2 = await page.evaluate(() => ({
      add: document.querySelector('.mode-tab[data-mode="add"]').textContent.trim(),
      branch: document.querySelector('[data-i18n="branchLbl"]').textContent.trim(),
    }));

    const tlOK = tl.add.includes('Miyembro') && tl.corr.includes('wasto') && tl.sugg.includes('kahi')
      && tl.branch === 'Sanga' && tl.rel === 'Ugnayan';
    const enOK = en2.add === 'Add Family Member' && en2.branch === 'Branch';

    log('T8', (tlOK && enOK) ? 'PASS' : 'FAIL',
      `tl=[${tl.add}|${tl.corr}|${tl.sugg}|${tl.branch}|${tl.rel}] en=[${en2.add}|${en2.branch}]`);
  } catch (e) { log('T8', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T9: Screenshot ========================
  try {
    await goForm();
    await ensureAddMode();
    await resetForm();
    await selectBranchPanfilo();
    await selectTarget('demelito-apor');
    await page.click('input[value="child"]');
    await page.waitForTimeout(200);

    const ssPath = path.join(SS_DIR, 'qa-three-mode-form.png');
    await page.screenshot({ path: ssPath, fullPage: true });
    const sz = fs.existsSync(ssPath) ? fs.statSync(ssPath).size : 0;
    log('T9', sz > 0 ? 'PASS' : 'FAIL', `path=${ssPath} size=${sz}`);
  } catch (e) { log('T9', 'FAIL', e.message.split('\n')[0]); }

  // ======================== T10: SDD open-class bug ========================
  try {
    await goForm();
    await ensureAddMode();
    await resetForm();

    await page.evaluate(() => {
      const input = document.getElementById('branchSearch');
      input.focus();
      input.click();
    });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => ({
      hasOpen: document.getElementById('branchList').classList.contains('open'),
      items: document.querySelectorAll('#branchList .sdd-row').length,
      listDisplay: getComputedStyle(document.getElementById('branchList')).display,
    }));

    // The dropdown list NEVER gets 'open' class -- this is a real bug
    log('T10', !data.hasOpen ? 'FAIL' : 'PASS',
      `open=${data.hasOpen} items=${data.items} display=${data.listDisplay} -- SDD never opens via user interaction`);
  } catch (e) { log('T10', 'FAIL', e.message.split('\n')[0]); }

  await browser.close();

  // ======================== SUMMARY ========================
  console.log('\n========== SUMMARY ==========');
  const p = results.filter(r => r.v === 'PASS').length;
  const f = results.filter(r => r.v === 'FAIL').length;
  results.forEach(r => console.log(`  ${r.id}: ${r.v}`));
  console.log(`\n  PASS: ${p}/${results.length}  FAIL: ${f}/${results.length}`);
  console.log(`  OVERALL: ${f === 0 ? 'PASS' : 'FAIL'}`);
})();
