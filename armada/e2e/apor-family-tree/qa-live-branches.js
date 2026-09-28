/**
 * QA E2E Test: Live React Surface - Derived Branches Verification (v2)
 * Verifies PR #13 changes on https://apor-tree.vercel.app
 * 
 * Key insight: "Apor" is a surname, not a branch label. Branch labels are shown as
 * "Panfilo · Gen 2" etc. Also, /rsvp /tree /chat redirect to /gate unless user
 * has completed the gate flow.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apor-tree.vercel.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'screenshots', 'apor-family-tree');
const RESULTS_FILE = path.join(__dirname, 'results.json');

const RESULTS = {
  gateSearchDemelito: { status: 'PENDING', details: '' },
  gateSearchWilda: { status: 'PENDING', details: '' },
  rsvpDropdown: { status: 'PENDING', details: '' },
  treeChips: { status: 'PENDING', details: '' },
  chatPage: { status: 'PENDING', details: '' },
  screenshotRsvp: { status: 'PENDING', details: '' }
};

const BRANCH_OPTIONS = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
const INVALID_OPTIONS = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];
const SEARCH_INPUT = 'input[placeholder*="name" i], input[type="text"], input[type="search"]';

const consoleErrors = [];

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, name);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot: ${filePath}`);
  return filePath;
}

async function nav(page, urlPath) {
  const t = Date.now();
  await page.goto(BASE_URL + urlPath, { timeout: 20000, waitUntil: 'domcontentloaded' });
  console.log(`  Nav to ${urlPath} (${Date.now()-t}ms)`);
  await page.waitForTimeout(2500);
}

/** Complete the gate flow: search name, click result, click "Continue as guest" */
async function completeGateFlow(page, name) {
  console.log(`  Completing gate flow for "${name}"...`);
  await nav(page, '/gate');

  const input = page.locator(SEARCH_INPUT).first();
  await input.fill(name);
  await page.waitForTimeout(2000);

  // Click the result row (the clickable card with name + branch)
  const resultRow = page.locator('[class*="cursor-pointer"], [role="button"], a').filter({ hasText: name }).first();
  if (await resultRow.count() > 0) {
    await resultRow.click();
    await page.waitForTimeout(1000);
    console.log(`  Clicked result row for "${name}"`);
  } else {
    // Try clicking anywhere in the result area
    const bodyText = await page.textContent('body');
    const idx = bodyText.indexOf(name);
    console.log(`  No clickable row found. Name at index ${idx} in body.`);
  }

  // Click "Continue as guest" button
  const continueBtn = page.locator('button').filter({ hasText: /continue|guest/i }).first();
  if (await continueBtn.count() > 0) {
    await continueBtn.click();
    console.log('  Clicked "Continue as guest"');
    await page.waitForTimeout(3000);
    // After clicking, we should be on a different page
    console.log(`  Current URL after gate: ${page.url()}`);
  } else {
    console.log('  WARNING: No "Continue as guest" button found');
  }
}

async function runTests() {
  console.log('=== QA E2E: Live React Surface - Derived Branches (v2) ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);

  const startTime = Date.now();
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => {
    consoleErrors.push(`PageError: ${error.message}`);
  });

  try {
    // =========================================
    // TEST 1: Gate Search - "Demelito" -> branch "Panfilo"
    // =========================================
    console.log('\n--- TEST 1: Gate Search - "Demelito" -> branch "Panfilo" ---');
    try {
      await nav(page, '/gate');

      const input = page.locator(SEARCH_INPUT).first();
      await input.fill('Demelito');
      console.log('  Typed "Demelito"');
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');

      // The result card shows: "Demelito Apor" (name) + "Panfilo · Gen 2" (branch label)
      // Check that the branch label "Panfilo" is present as a branch indicator
      const hasPanfilo = bodyText.includes('Panfilo');
      // "Apor" is the surname, which is EXPECTED. Check it's not a branch label.
      // The branch label format is "Panfilo · Gen 2" or similar.
      // We verify "Panfilo" appears as a branch (not just anywhere)

      // More precise: look for the branch label pattern
      const branchLabelPattern = /Panfilo\s*[·•]\s*Gen/i;
      const hasBranchLabel = branchLabelPattern.test(bodyText);

      console.log(`  "Panfilo" in body: ${hasPanfilo}`);
      console.log(`  Branch label "Panfilo · Gen N": ${hasBranchLabel}`);
      console.log(`  "Apor" in body (surname, expected): ${bodyText.includes('Apor')}`);

      await screenshot(page, 'test1-demelito-search.png');

      if (hasPanfilo && hasBranchLabel) {
        RESULTS.gateSearchDemelito = { status: 'PASS', details: 'Branch label "Panfilo · Gen N" present. "Apor" is surname only.' };
        console.log('  RESULT: PASS');
      } else {
        RESULTS.gateSearchDemelito = { status: 'FAIL', details: `Panfilo=${hasPanfilo}, branchLabel=${hasBranchLabel}` };
        console.log('  RESULT: FAIL');
      }
    } catch (err) {
      RESULTS.gateSearchDemelito = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

    // =========================================
    // TEST 1b: Gate Search - "Wilda" -> branch "Consorcia"
    // =========================================
    console.log('\n--- TEST 1b: Gate Search - "Wilda" -> branch "Consorcia" ---');
    try {
      await nav(page, '/gate');

      const input = page.locator(SEARCH_INPUT).first();
      await input.fill('Wilda');
      console.log('  Typed "Wilda"');
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');

      const hasConsorcia = bodyText.includes('Consorcia');
      const branchLabelPattern = /Consorcia\s*[·•]\s*Gen/i;
      const hasBranchLabel = branchLabelPattern.test(bodyText);
      const hasLumbab = bodyText.includes('Lumbab');

      console.log(`  "Consorcia" in body: ${hasConsorcia}`);
      console.log(`  Branch label "Consorcia · Gen N": ${hasBranchLabel}`);
      console.log(`  "Lumbab" in body: ${hasLumbab}`);

      await screenshot(page, 'test1b-wilda-search.png');

      if (hasConsorcia && hasBranchLabel && !hasLumbab) {
        RESULTS.gateSearchWilda = { status: 'PASS', details: 'Branch label "Consorcia · Gen N" present. No "Lumbab".' };
        console.log('  RESULT: PASS');
      } else {
        RESULTS.gateSearchWilda = { status: 'FAIL', details: `Consorcia=${hasConsorcia}, label=${hasBranchLabel}, Lumbab=${hasLumbab}` };
        console.log('  RESULT: FAIL');
      }
    } catch (err) {
      RESULTS.gateSearchWilda = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

    // Check console errors from gate tests
    if (consoleErrors.length > 0) {
      console.log(`  Console errors so far: ${consoleErrors.length}`);
      consoleErrors.forEach((e, i) => console.log(`    ${i+1}. ${e.substring(0, 150)}`));
    }

    // =========================================
    // Complete gate flow to access other pages
    // =========================================
    console.log('\n--- Completing gate flow to unlock RSVP/Tree/Chat ---');
    try {
      await completeGateFlow(page, 'Demelito');
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);
      
      // Take screenshot of post-gate state
      await screenshot(page, 'post-gate-state.png');
    } catch (err) {
      console.log(`  Gate flow error: ${err.message.substring(0, 120)}`);
    }

    // =========================================
    // TEST 2: RSVP Page - Dropdown Options
    // =========================================
    console.log('\n--- TEST 2: RSVP Page - Dropdown Options ---');
    try {
      // Try to navigate to /rsvp (may redirect if gate not completed)
      await nav(page, '/rsvp');

      let currentUrl = page.url();
      console.log(`  URL after /rsvp nav: ${currentUrl}`);

      // If redirected back to gate, try completing gate flow again
      if (currentUrl.includes('/gate') || currentUrl === BASE_URL + '/' || currentUrl === BASE_URL) {
        console.log('  Redirected to gate - completing flow again...');
        await completeGateFlow(page, 'Demelito');
        currentUrl = page.url();
        console.log(`  URL after retry: ${currentUrl}`);
        
        // Now try /rsvp again
        await nav(page, '/rsvp');
        currentUrl = page.url();
        console.log(`  URL after second /rsvp nav: ${currentUrl}`);
      }

      const bodyText = await page.textContent('body');
      console.log(`  Body length: ${bodyText.length}`);

      // Look for select/dropdown
      const selectCount = await page.locator('select').count();
      console.log(`  <select> elements: ${selectCount}`);

      let options = [];

      if (selectCount > 0) {
        options = await page.$$eval('select option', els => els.map(e => e.textContent.trim()).filter(t => t.length > 0));
        console.log('  Select options:', options);
      } else {
        // Try custom dropdown - click to open
        const combos = await page.locator('[role="combobox"], [class*="select" i], [class*="dropdown" i], [class*="branch" i]').count();
        console.log(`  Custom dropdown elements: ${combos}`);

        if (combos > 0) {
          const combo = page.locator('[role="combobox"], [class*="select" i], [class*="dropdown" i]').first();
          await combo.click();
          await page.waitForTimeout(1500);

          const listItems = await page.$$eval('[role="option"], [role="listbox"] *, li, [class*="option" i]',
            els => els.map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 60));
          console.log('  Items after click:', listItems);
          if (listItems.length > 0) options = listItems;
        }
      }

      // Fallback: check body text for branch names
      const branchesInPage = BRANCH_OPTIONS.filter(b => bodyText.includes(b));
      const invalidInPage = INVALID_OPTIONS.filter(b => bodyText.includes(b));
      console.log(`  Branch names in body: ${branchesInPage.join(', ')}`);
      console.log(`  Invalid names in body: ${invalidInPage.join(', ')}`);

      await screenshot(page, 'test2-rsvp-dropdown.png');

      // Determine pass/fail
      const checkOptions = options.length > 0 ? options : branchesInPage;
      const expectedFound = BRANCH_OPTIONS.filter(b => checkOptions.some(o => o.includes(b)));
      const invalidFound = INVALID_OPTIONS.filter(b => checkOptions.some(o => o.includes(b)));

      console.log(`  Expected found: ${expectedFound.length}/6 (${expectedFound.join(', ')})`);
      console.log(`  Invalid found: ${invalidFound.length} (${invalidFound.join(', ')})`);

      if (expectedFound.length === 6 && invalidFound.length === 0) {
        RESULTS.rsvpDropdown = { status: 'PASS', details: `6 options: ${expectedFound.join(', ')}. No invalid.` };
        console.log('  RESULT: PASS');
      } else {
        RESULTS.rsvpDropdown = { status: 'FAIL', details: `Expected: ${expectedFound.length}/6. Invalid: [${invalidFound.join(', ')}]. Options: [${checkOptions.join(', ')}]` };
        console.log('  RESULT: FAIL');
      }
    } catch (err) {
      RESULTS.rsvpDropdown = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

    // =========================================
    // TEST 3: Tree Page - Branch Chips
    // =========================================
    console.log('\n--- TEST 3: Tree Page - Branch Chips ---');
    try {
      await nav(page, '/tree');

      const currentUrl = page.url();
      console.log(`  URL: ${currentUrl}`);

      // If on gate, try completing flow
      if (currentUrl.includes('/gate') || currentUrl === BASE_URL + '/') {
        await completeGateFlow(page, 'Demelito');
        await nav(page, '/tree');
      }

      const bodyText = await page.textContent('body');
      console.log(`  Body length: ${bodyText.length}`);

      // Check for "All" chip
      const hasAll = /\bAll\b/.test(bodyText);
      const foundBranches = BRANCH_OPTIONS.filter(b => bodyText.includes(b));
      const invalidBranches = INVALID_OPTIONS.filter(b => bodyText.includes(b));

      console.log(`  "All" present: ${hasAll}`);
      console.log(`  Branches: ${foundBranches.join(', ')} (${foundBranches.length}/6)`);
      console.log(`  Invalid: ${invalidBranches.join(', ')}`);

      // Also look for chip/badge elements
      const chipEls = await page.$$('[class*="chip" i], [class*="badge" i], [class*="tag" i], button');
      console.log(`  Chip/badge/button elements: ${chipEls.length}`);

      await screenshot(page, 'test3-tree-chips.png');

      if (hasAll && foundBranches.length === 6 && invalidBranches.length === 0) {
        RESULTS.treeChips = { status: 'PASS', details: `All + 6 branches: ${foundBranches.join(', ')}` };
        console.log('  RESULT: PASS');
      } else {
        RESULTS.treeChips = { status: 'FAIL', details: `All=${hasAll}, branches=${foundBranches.length}/6, invalid=[${invalidBranches.join(', ')}]` };
        console.log('  RESULT: FAIL');
      }
    } catch (err) {
      RESULTS.treeChips = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

    // =========================================
    // TEST 4: Chat Page
    // =========================================
    console.log('\n--- TEST 4: Chat Page ---');
    try {
      await nav(page, '/chat');

      const currentUrl = page.url();
      console.log(`  URL: ${currentUrl}`);

      if (currentUrl.includes('/gate') || currentUrl === BASE_URL + '/') {
        await completeGateFlow(page, 'Demelito');
        await nav(page, '/chat');
      }

      const bodyText = await page.textContent('body');
      console.log(`  Body length: ${bodyText.length}`);

      const chatBranches = BRANCH_OPTIONS.filter(b => bodyText.includes(b));
      console.log(`  Branches in chat: ${chatBranches.join(', ')}`);

      const chipEls = await page.$$('[class*="chip" i], [class*="badge" i], [class*="tag" i], [class*="branch" i]');
      console.log(`  Chip/badge elements: ${chipEls.length}`);

      await screenshot(page, 'test4-chat-page.png');

      const criticalErrors = consoleErrors.filter(e =>
        !e.includes('Failed to load resource') &&
        !e.includes('favicon') &&
        !e.includes('404')
      );

      if (criticalErrors.length === 0) {
        RESULTS.chatPage = { status: 'PASS', details: `No critical errors. Branch chips: ${chatBranches.join(', ')}` };
        console.log('  RESULT: PASS');
      } else {
        RESULTS.chatPage = { status: 'FAIL', details: `Errors: ${criticalErrors.join('; ')}` };
        console.log('  RESULT: FAIL');
      }
    } catch (err) {
      RESULTS.chatPage = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

    // =========================================
    // TEST 5: Screenshot RSVP Dropdown (open state)
    // =========================================
    console.log('\n--- TEST 5: Screenshot RSVP Dropdown ---');
    try {
      await nav(page, '/rsvp');

      const currentUrl = page.url();
      if (currentUrl.includes('/gate') || currentUrl === BASE_URL + '/') {
        await completeGateFlow(page, 'Demelito');
        await nav(page, '/rsvp');
      }

      // Try to open dropdown
      const combo = page.locator('select, [role="combobox"], [class*="select" i], [class*="dropdown" i], [class*="branch" i]').first();
      if (await combo.count() > 0) {
        await combo.click();
        await page.waitForTimeout(1500);
        console.log('  Clicked dropdown');
      }

      const shotPath = await screenshot(page, 'qa-rsvp-branches.png');
      RESULTS.screenshotRsvp = { status: 'PASS', details: shotPath };
      console.log('  RESULT: PASS');
    } catch (err) {
      RESULTS.screenshotRsvp = { status: 'FAIL', details: err.message.substring(0, 200) };
      console.log(`  RESULT: FAIL - ${err.message.substring(0, 120)}`);
    }

  } catch (err) {
    console.error(`\nFATAL: ${err.message}`);
  } finally {
    await browser.close();
  }

  // =========================================
  // REPORT
  // =========================================
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n========================================');
  console.log('=== QA VERIFICATION REPORT ===');
  console.log(`Elapsed: ${elapsed.toFixed(1)}s (budget: 420s)`);
  console.log('========================================\n');

  const tests = [
    { name: 'TEST 1: Gate "Demelito" -> branch "Panfilo"', result: RESULTS.gateSearchDemelito },
    { name: 'TEST 1b: Gate "Wilda" -> branch "Consorcia"', result: RESULTS.gateSearchWilda },
    { name: 'TEST 2: RSVP Dropdown (6 options, no invalid)', result: RESULTS.rsvpDropdown },
    { name: 'TEST 3: Tree Chips (All + 6 branches)', result: RESULTS.treeChips },
    { name: 'TEST 4: Chat Page (no errors)', result: RESULTS.chatPage },
    { name: 'TEST 5: Screenshot RSVP branches', result: RESULTS.screenshotRsvp }
  ];

  let allPass = true;
  for (const t of tests) {
    const icon = t.result.status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`${icon} ${t.name}`);
    console.log(`    ${t.result.details}`);
    if (t.result.status !== 'PASS') allPass = false;
    console.log('');
  }

  console.log('========================================');
  console.log(`OVERALL VERDICT: ${allPass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(RESULTS, null, 2));
  console.log(`\nResults saved: ${RESULTS_FILE}`);

  if (consoleErrors.length > 0) {
    console.log(`\nConsole errors captured (${consoleErrors.length}):`);
    consoleErrors.slice(0, 20).forEach((e, i) => console.log(`  ${i+1}. ${e.substring(0, 200)}`));
  }

  return allPass;
}

runTests().then(pass => process.exit(pass ? 0 : 1)).catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
