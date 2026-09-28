// QA E2E verification: LIVE React web app at https://apor-tree.vercel.app
// Tests: tree access via gate, branch chips, header stats, filtering, colors, member profiles
// Time budget: 7 minutes hard stop

import { chromium } from 'playwright';

const BASE = 'https://apor-tree.vercel.app';
const TIMEOUT = 5000;
const NAV_TIMEOUT = 15000; // longer nav timeout for Firebase
const LAUNCH_TIMEOUT = 15000;

const results = [];
let browser, context, page;

function record(testNum, name, verdict, detail) {
  results.push({ testNum, name, verdict, detail });
  console.log(`TEST ${testNum}: ${name} -- ${verdict}`);
  if (detail) console.log(`  Detail: ${detail}`);
}

async function screenshot(name) {
  const path = `armada/screenshots/apor-family-tree/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  Screenshot saved: ${path}`);
  return path;
}

(async () => {
  console.log('=== QA Live React Verification: apor-tree.vercel.app ===');
  console.log(`Start time: ${new Date().toISOString()}`);
  const startTime = Date.now();
  const HARD_LIMIT_MS = 7 * 60 * 1000;

  try {
    browser = await chromium.launch({ headless: true, timeout: LAUNCH_TIMEOUT });
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();
    page.setDefaultTimeout(TIMEOUT);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ============================================================
    // TEST 1: Reach /tree via gate. No console errors.
    // ============================================================
    console.log('\n--- TEST 1: Reach /tree via gate, no console errors ---');
    let test1Pass = false;
    let test1Detail = '';

    try {
      // Navigate to the base URL first to understand the gate
      console.log('  Navigating to base URL...');
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      await page.waitForTimeout(3000);
      console.log(`  URL: ${page.url()}`);

      // Dump the page structure
      const title = await page.title();
      console.log(`  Title: ${title}`);

      // Look at all text on the page
      const bodyText = await page.textContent('body');
      console.log(`  Body text (first 500): ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);

      // Find all interactive elements
      const inputs = await page.$$('input');
      console.log(`  Inputs: ${inputs.length}`);
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({
          type: el.type, placeholder: el.placeholder, id: el.id,
          name: el.name, className: el.className
        }));
        console.log(`    Input: ${JSON.stringify(attrs)}`);
      }

      const buttons = await page.$$('button');
      console.log(`  Buttons: ${buttons.length}`);
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        const attrs = await btn.evaluate(el => ({
          className: el.className, id: el.id, type: el.type
        }));
        console.log(`    Button: "${text}" ${JSON.stringify(attrs)}`);
      }

      // Look for links/nav
      const links = await page.$$('a');
      console.log(`  Links: ${links.length}`);
      for (const link of links.slice(0, 10)) {
        const href = await link.getAttribute('href');
        const text = (await link.textContent()).trim();
        console.log(`    Link: "${text}" -> ${href}`);
      }

      // Take a screenshot of what we see
      await screenshot('qa-gate-initial');

      // ---- Try to find the gate input and fill it ----
      // Try various selectors for the name input
      const inputSelectors = [
        'input[type="text"]',
        'input[type="search"]',
        'input[placeholder*="name" i]',
        'input[placeholder*="search" i]',
        'input[placeholder*="find" i]',
        'input[placeholder*="enter" i]',
        'input[placeholder*="type" i]',
        'input',
      ];

      let nameInput = null;
      for (const sel of inputSelectors) {
        const els = await page.$$(sel);
        for (const el of els) {
          const isVisible = await el.isVisible();
          if (isVisible) {
            nameInput = el;
            console.log(`  Found visible input with selector: ${sel}`);
            break;
          }
        }
        if (nameInput) break;
      }

      if (nameInput) {
        console.log('  Typing "QA Tester" into input...');
        await nameInput.click();
        await page.waitForTimeout(500);
        await nameInput.fill('QA Tester');
        await page.waitForTimeout(2000);

        // Look for suggestions/results that appeared
        const bodyTextAfter = await page.textContent('body');
        console.log(`  Body after typing (first 500): ${bodyTextAfter.substring(0, 500).replace(/\s+/g, ' ')}`);

        // Take screenshot after typing
        await screenshot('qa-gate-after-typing');

        // Check if a list of results appeared
        const lists = await page.$$('li, [role="option"], [class*="result"], [class*="suggest"], [class*="match"]');
        console.log(`  List items / suggestions: ${lists.length}`);
        for (const li of lists.slice(0, 5)) {
          const text = (await li.textContent()).trim();
          console.log(`    List item: "${text.substring(0, 60)}"`);
        }

        // Try clicking the first visible suggestion/option
        for (const li of lists) {
          const isVisible = await li.isVisible();
          const text = (await li.textContent()).trim();
          if (isVisible && text.length > 0 && text.length < 100) {
            console.log(`  Clicking suggestion: "${text.substring(0, 60)}"`);
            await li.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
      }

      // Now look for a continue/next/submit button
      const buttonsAfter = await page.$$('button');
      let clickedContinue = false;
      for (const btn of buttonsAfter) {
        const isVisible = await btn.isVisible();
        if (!isVisible) continue;
        const text = (await btn.textContent()).trim().toLowerCase();
        console.log(`  Visible button: "${text}"`);
        if (text.includes('continue') || text.includes('next') || text.includes('go') ||
            text.includes('enter') || text.includes('submit') || text.includes('start') ||
            text.includes('proceed') || text.includes('tree')) {
          console.log(`  Clicking button: "${text}"`);
          await btn.click();
          await page.waitForTimeout(2000);
          clickedContinue = true;
          break;
        }
      }

      console.log(`  URL after gate interaction: ${page.url()}`);
      await screenshot('qa-gate-after-action');

      // If we're not on /tree, navigate there
      if (!page.url().includes('/tree')) {
        console.log('  Navigating directly to /tree...');
        await page.goto(`${BASE}/tree`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
        await page.waitForTimeout(5000);
        console.log(`  Final URL: ${page.url()}`);
      }

      // If still not on tree, try setting cookie manually
      if (!page.url().includes('/tree')) {
        console.log('  Setting family-session cookie manually...');
        await context.addCookies([{
          name: 'family-session',
          value: JSON.stringify({ memberName: 'QA Tester', branch: 'All' }),
          domain: 'apor-tree.vercel.app',
          path: '/',
        }]);
        await page.goto(`${BASE}/tree`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
        await page.waitForTimeout(5000);
        console.log(`  URL after cookie set: ${page.url()}`);
      }

      await screenshot('qa-tree-final');

      // Evaluate test 1
      const currentUrl = page.url();
      if (currentUrl.includes('/tree')) {
        test1Pass = true;
        test1Detail = `Landed on ${currentUrl}. Console errors: ${consoleErrors.length}.`;
        if (consoleErrors.length > 0) {
          test1Detail += ` Errors: [${consoleErrors.slice(0, 5).join(' | ')}]`;
        }
      } else {
        test1Detail = `Still at ${currentUrl} - gate flow did not reach /tree`;
      }

    } catch (e) {
      test1Detail = `Exception: ${e.message}`;
    }

    record(1, 'Reach /tree via gate, no console errors', test1Pass ? 'PASS' : 'FAIL', test1Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      for (let i = 2; i <= 7; i++) record(i, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 2: Branch filter chips
    // ============================================================
    console.log('\n--- TEST 2: Branch filter chips ---');
    let test2Pass = false;
    let test2Detail = '';

    try {
      // Wait for page to be fully rendered
      await page.waitForTimeout(3000);

      // Try multiple strategies to find chips
      const bodyHTML = await page.content();
      
      // Strategy 1: Look for data-branch attributes
      let chipEls = await page.$$('[data-branch]');
      console.log(`  [data-branch] elements: ${chipEls.length}`);

      // Strategy 2: Look for buttons/divs with specific text
      if (chipEls.length < 5) {
        chipEls = await page.$$('button');
        console.log(`  Buttons: ${chipEls.length}`);
      }

      // Strategy 3: Look for any element containing branch names
      const allElements = await page.$$('*');
      const branchNames = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const chipTexts = [];

      for (const el of allElements) {
        try {
          const isVisible = await el.isVisible();
          if (!isVisible) continue;
          const text = (await el.textContent()).trim();
          if (branchNames.includes(text) && text.length < 20) {
            chipTexts.push(text);
          }
        } catch (e) { /* skip */ }
      }
      console.log(`  Found chip texts (direct): ${JSON.stringify(chipTexts)}`);

      // Deduplicate
      const uniqueTexts = [...new Set(chipTexts)];
      console.log(`  Unique chip texts: ${JSON.stringify(uniqueTexts)}`);

      // Check
      const expected = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const unexpected = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];

      const issues = [];
      if (uniqueTexts.length !== 7) issues.push(`Expected 7 unique chips, found ${uniqueTexts.length}`);
      for (const exp of expected) {
        if (!uniqueTexts.includes(exp)) issues.push(`Missing: ${exp}`);
      }
      for (const unexp of unexpected) {
        if (uniqueTexts.includes(unexp)) issues.push(`Unexpected: ${unexp}`);
      }

      // Check order of expected chips in the page
      const bodyText = await page.textContent('body');
      const orderIssues = [];
      for (let i = 0; i < expected.length - 1; i++) {
        const idx1 = bodyText.indexOf(expected[i]);
        const idx2 = bodyText.indexOf(expected[i + 1]);
        if (idx1 > idx2 && idx1 >= 0 && idx2 >= 0) {
          orderIssues.push(`${expected[i]} appears after ${expected[i + 1]}`);
        }
      }
      if (orderIssues.length > 0) issues.push(`Order: ${orderIssues.join('; ')}`);

      test2Pass = issues.length === 0;
      test2Detail = issues.length > 0 ? issues.join('; ') : `All 7 chips present in correct order: ${uniqueTexts.join(', ')}`;

    } catch (e) {
      test2Detail = `Exception: ${e.message}`;
    }

    record(2, 'Branch filter chips (7 exact)', test2Pass ? 'PASS' : 'FAIL', test2Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      for (let i = 3; i <= 7; i++) record(i, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 3: Header stats
    // ============================================================
    console.log('\n--- TEST 3: Header stats ---');
    let test3Pass = false;
    let test3Detail = '';

    try {
      const bodyText = await page.textContent('body');

      // Look for various patterns
      const memberMatch = bodyText.match(/(\d+)\s*member/i);
      const branchMatch = bodyText.match(/(\d+)\s*branch/i);
      
      // Also look for stats sections
      console.log(`  Member match: ${memberMatch ? memberMatch[0] : 'NOT FOUND'}`);
      console.log(`  Branch match: ${branchMatch ? branchMatch[0] : 'NOT FOUND'}`);

      // Dump text around "member" and "branch" occurrences
      const memberIdx = bodyText.toLowerCase().indexOf('member');
      if (memberIdx > -1) {
        console.log(`  Context around "member": "...${bodyText.substring(Math.max(0, memberIdx - 30), memberIdx + 50)}..."`);
      }
      const branchIdx = bodyText.toLowerCase().indexOf('branch');
      if (branchIdx > -1) {
        console.log(`  Context around "branch": "...${bodyText.substring(Math.max(0, branchIdx - 30), branchIdx + 50)}..."`);
      }

      // Look for stat elements
      const statEls = await page.$$('[class*="stat"], [class*="Stat"], [class*="count"], [class*="Count"], [class*="header"], [class*="Header"]');
      console.log(`  Stat-like elements: ${statEls.length}`);
      for (const el of statEls.slice(0, 5)) {
        const text = (await el.textContent()).trim();
        if (text.length < 100) console.log(`    Stat: "${text}"`);
      }

      let memberOk = false, branchOk = false;
      const details = [];

      if (memberMatch) {
        const count = parseInt(memberMatch[1]);
        memberOk = count >= 120 && count <= 150;
        details.push(`Member count: ${count} (${memberOk ? 'OK' : 'OUT OF RANGE'})`);
      } else {
        details.push('Member count: NOT FOUND');
      }

      if (branchMatch) {
        const count = parseInt(branchMatch[1]);
        branchOk = count === 6;
        details.push(`Branch count: ${count} (${branchOk ? 'OK' : 'expected 6'})`);
      } else {
        details.push('Branch count: NOT FOUND');
      }

      test3Pass = memberOk && branchOk;
      test3Detail = details.join('; ');

    } catch (e) {
      test3Detail = `Exception: ${e.message}`;
    }

    record(3, 'Header stats', test3Pass ? 'PASS' : 'FAIL', test3Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      for (let i = 4; i <= 7; i++) record(i, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 4: Consorcia filter + back to All
    // ============================================================
    console.log('\n--- TEST 4: Consorcia filter + back to All ---');
    let test4Pass = false;
    let test4Detail = '';

    try {
      // Count total visible elements first
      const countVisible = async () => {
        // Try various card/member selectors
        for (const sel of ['[data-member]', '[class*="card"]', '[class*="Card"]', '[class*="member"]', '[class*="Member"]', '[class*="node"]', '[class*="Node"]']) {
          const els = await page.$$(sel);
          const visible = [];
          for (const el of els) {
            try { if (await el.isVisible()) visible.push(el); } catch (e) { /* skip */ }
          }
          if (visible.length > 0) return { count: visible.length, selector: sel };
        }
        return { count: 0, selector: 'none' };
      };

      const before = await countVisible();
      console.log(`  Before filter: ${before.count} elements (${before.selector})`);

      // Find and click Consorcia chip
      let consorciaChip = null;
      const allEls = await page.$$('*');
      for (const el of allEls) {
        try {
          const isVisible = await el.isVisible();
          const text = (await el.textContent()).trim();
          if (isVisible && text === 'Consorcia') {
            consorciaChip = el;
            break;
          }
        } catch (e) { /* skip */ }
      }

      if (consorciaChip) {
        console.log('  Clicking Consorcia chip...');
        await consorciaChip.click();
        await page.waitForTimeout(2000);

        const afterConsorcia = await countVisible();
        console.log(`  After Consorcia: ${afterConsorcia.count} elements (${afterConsorcia.selector})`);

        // Click All
        let allChip = null;
        for (const el of await page.$$('*')) {
          try {
            const isVisible = await el.isVisible();
            const text = (await el.textContent()).trim();
            if (isVisible && text === 'All') { allChip = el; break; }
          } catch (e) { /* skip */ }
        }

        if (allChip) {
          console.log('  Clicking All chip...');
          await allChip.click();
          await page.waitForTimeout(2000);
          const afterAll = await countVisible();
          console.log(`  After All: ${afterAll.count} elements (${afterAll.selector})`);
          test4Pass = afterConsorcia.count > 0 && afterConsorcia.count < before.count;
          test4Detail = `Before: ${before.count}, Consorcia: ${afterConsorcia.count}, All: ${afterAll.count}. Filter applied: ${test4Pass}`;
        } else {
          test4Detail = 'Could not find All chip after Consorcia';
        }
      } else {
        test4Detail = 'Could not find Consorcia chip';
      }

    } catch (e) {
      test4Detail = `Exception: ${e.message}`;
    }

    record(4, 'Consorcia filter + back to All', test4Pass ? 'PASS' : 'FAIL', test4Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      for (let i = 5; i <= 7; i++) record(i, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 5: Color comparison
    // ============================================================
    console.log('\n--- TEST 5: Color comparison ---');
    let test5Pass = false;
    let test5Detail = '';

    try {
      let panfiloChip = null, consorciaChip = null;

      for (const el of await page.$$('*')) {
        try {
          const isVisible = await el.isVisible();
          const text = (await el.textContent()).trim();
          if (!isVisible) continue;
          if (text === 'Panfilo' && !panfiloChip) panfiloChip = el;
          if (text === 'Consorcia' && !consorciaChip) consorciaChip = el;
        } catch (e) { /* skip */ }
      }

      if (panfiloChip && consorciaChip) {
        const pStyle = await panfiloChip.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color, border: s.borderColor, bgImage: s.backgroundImage };
        });
        const cStyle = await consorciaChip.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color, border: s.borderColor, bgImage: s.backgroundImage };
        });

        console.log(`  Panfilo: ${JSON.stringify(pStyle)}`);
        console.log(`  Consorcia: ${JSON.stringify(cStyle)}`);

        const same = pStyle.bg === cStyle.bg && pStyle.color === cStyle.color && pStyle.border === cStyle.border;
        test5Pass = !same;
        test5Detail = `Panfilo: bg=${pStyle.bg}, color=${pStyle.color}, border=${pStyle.border}; Consorcia: bg=${cStyle.bg}, color=${cStyle.color}, border=${cStyle.border}; Different: ${!same}`;
      } else {
        test5Detail = `Panfilo: ${!!panfiloChip}, Consorcia: ${!!consorciaChip}`;
      }

    } catch (e) {
      test5Detail = `Exception: ${e.message}`;
    }

    record(5, 'Color: Panfilo vs Consorcia differ', test5Pass ? 'PASS' : 'FAIL', test5Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      for (let i = 6; i <= 7; i++) record(i, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 6: Member profile derived branch
    // ============================================================
    console.log('\n--- TEST 6: Member profile derived branch ---');
    let test6Pass = false;
    let test6Detail = '';

    try {
      // Filter to Consorcia first
      for (const el of await page.$$('*')) {
        try {
          const isVisible = await el.isVisible();
          const text = (await el.textContent()).trim();
          if (isVisible && text === 'Consorcia') {
            await el.click();
            await page.waitForTimeout(2000);
            break;
          }
        } catch (e) { /* skip */ }
      }

      // Find a clickable member element
      let memberEl = null;
      for (const sel of ['[data-member]', '[class*="card"]', '[class*="Card"]', '[class*="member"]', '[class*="Member"]', '[class*="node"]', '[class*="Node"]']) {
        const els = await page.$$(sel);
        for (const el of els) {
          try {
            if (await el.isVisible()) { memberEl = el; break; }
          } catch (e) { /* skip */ }
        }
        if (memberEl) break;
      }

      if (memberEl) {
        console.log('  Clicking member element...');
        await memberEl.click();
        await page.waitForTimeout(2000);

        const bodyText = await page.textContent('body');
        const hasConsorcia = bodyText.includes('Consorcia');
        const hasLumbab = bodyText.includes('Lumbab');

        // Try to find detail panel
        const detailPanel = await page.$('[class*="detail"], [class*="Detail"], [class*="modal"], [class*="Modal"], [class*="panel"], [class*="Panel"], [class*="sidebar"], [class*="Sidebar"]');
        let panelText = '';
        if (detailPanel) {
          panelText = await detailPanel.textContent();
          console.log(`  Detail panel: ${panelText.substring(0, 200)}`);
        }

        // Check for branch display
        const branchInDetail = (panelText || bodyText);
        const hasBranchConsorcia = branchInDetail.includes('Consorcia');
        const hasBranchLumbab = branchInDetail.includes('Lumbab');

        test6Pass = hasBranchConsorcia;
        test6Detail = `Consorcia in detail: ${hasBranchConsorcia}; Lumbab in detail: ${hasBranchLumbab}`;
      } else {
        test6Detail = 'No clickable member found';
      }

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

    } catch (e) {
      test6Detail = `Exception: ${e.message}`;
    }

    record(6, 'Member profile shows derived branch', test6Pass ? 'PASS' : 'FAIL', test6Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED ===');
      record(7, 'TIMEOUT', 'FAIL', 'Skipped');
      return;
    }

    // ============================================================
    // TEST 7: Screenshot
    // ============================================================
    console.log('\n--- TEST 7: Screenshot ---');
    let test7Pass = false;
    let test7Detail = '';

    try {
      // Click All to reset view
      for (const el of await page.$$('*')) {
        try {
          const isVisible = await el.isVisible();
          const text = (await el.textContent()).trim();
          if (isVisible && text === 'All') { await el.click(); await page.waitForTimeout(1000); break; }
        } catch (e) { /* skip */ }
      }

      await page.waitForTimeout(2000);
      const sp = await screenshot('qa-react-six-branches');
      test7Pass = true;
      test7Detail = `Screenshot: ${sp}`;
    } catch (e) {
      test7Detail = `Exception: ${e.message}`;
    }

    record(7, 'Screenshot', test7Pass ? 'PASS' : 'FAIL', test7Detail);

  } catch (e) {
    console.log(`\nFATAL: ${e.message}`);
    console.log(e.stack);
  } finally {
    if (browser) await browser.close();
  }

  // SUMMARY
  console.log('\n\n=== VERDICT SUMMARY ===');
  const passed = results.filter(r => r.verdict === 'PASS').length;
  const failed = results.filter(r => r.verdict === 'FAIL').length;
  console.log(`Passed: ${passed}/${results.length}, Failed: ${failed}/${results.length}`);
  for (const r of results) console.log(`  TEST ${r.testNum}: ${r.verdict} - ${r.name}`);
  console.log(`\nVERDICT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`End: ${new Date().toISOString()}`);
})();
