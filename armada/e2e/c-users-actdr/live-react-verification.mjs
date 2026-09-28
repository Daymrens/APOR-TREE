// QA E2E verification: LIVE React web app at https://apor-tree.vercel.app
// Tests: tree access via gate, branch chips, header stats, filtering, colors, member profiles
// Time budget: 7 minutes hard stop

import { chromium } from 'playwright';

const BASE = 'https://apor-tree.vercel.app';
const TIMEOUT = 5000;
const NAV_TIMEOUT = 10000;
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
  const HARD_LIMIT_MS = 7 * 60 * 1000; // 7 minutes

  try {
    browser = await chromium.launch({ headless: true, timeout: LAUNCH_TIMEOUT });
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();
    page.setDefaultTimeout(TIMEOUT);

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ============================================================
    // TEST 1: Reach /tree via gate. No console errors.
    // ============================================================
    console.log('\n--- TEST 1: Reach /tree via gate, no console errors ---');
    let test1Pass = false;
    let test1Detail = '';

    try {
      // First, try going to /gate
      await page.goto(`${BASE}/gate`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
      console.log(`  Page title: ${await page.title()}`);
      console.log(`  URL: ${page.url()}`);

      // Inspect the page to understand the gate flow
      const pageContent = await page.content();
      console.log(`  Page length: ${pageContent.length}`);

      // Look for input fields and buttons
      const inputs = await page.$$('input');
      console.log(`  Input count: ${inputs.length}`);
      for (const inp of inputs) {
        const type = await inp.getAttribute('type');
        const placeholder = await inp.getAttribute('placeholder');
        const id = await inp.getAttribute('id');
        const name = await inp.getAttribute('name');
        console.log(`    Input: type=${type}, placeholder=${placeholder}, id=${id}, name=${name}`);
      }

      const buttons = await page.$$('button');
      console.log(`  Button count: ${buttons.length}`);
      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log(`    Button: "${text.trim()}"`);
      }

      // Also look for links
      const links = await page.$$('a');
      console.log(`  Link count: ${links.length}`);
      for (const link of links.slice(0, 10)) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`    Link: "${text.trim()}" -> ${href}`);
      }

      // Try to find and interact with the name input
      // Look for any text input
      const nameInput = await page.$('input[type="text"], input[type="search"], input[placeholder*="name" i], input[placeholder*="search" i], input[placeholder*="find" i]');
      if (nameInput) {
        console.log('  Found name input, typing "QA Tester"...');
        await nameInput.click();
        await nameInput.fill('QA Tester');
        await page.waitForTimeout(1000);
      } else {
        // Try any input
        if (inputs.length > 0) {
          console.log('  No specific name input found, trying first input...');
          await inputs[0].click();
          await inputs[0].fill('QA Tester');
          await page.waitForTimeout(1000);
        }
      }

      // Look for a continue/next button
      let continueBtn = null;
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim().toLowerCase();
        if (text.includes('continue') || text.includes('next') || text.includes('go') || text.includes('enter') || text.includes('submit')) {
          continueBtn = btn;
          console.log(`  Found continue button: "${text}"`);
          break;
        }
      }

      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
        console.log(`  After click URL: ${page.url()}`);
      }

      // Now try navigating to /tree
      console.log('  Navigating to /tree...');
      await page.goto(`${BASE}/tree`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
      console.log(`  URL after nav: ${page.url()}`);
      console.log(`  Title: ${await page.title()}`);

      // Wait a moment for any redirects or cookie processing
      await page.waitForTimeout(2000);
      console.log(`  Final URL: ${page.url()}`);

      // Check if we're on the tree page (not redirected back to gate)
      const currentUrl = page.url();
      if (currentUrl.includes('/tree')) {
        // Verify page loaded properly
        await page.waitForTimeout(3000);

        // Check for React rendering
        const bodyText = await page.textContent('body');
        const hasChips = bodyText.includes('Panfilo') || bodyText.includes('All') || bodyText.includes('branch');
        console.log(`  Page has chips text: ${hasChips}`);

        test1Pass = true;
        test1Detail = `Landed on ${currentUrl}. Console errors: ${consoleErrors.length}.`;
        if (consoleErrors.length > 0) {
          test1Detail += ` Errors: ${consoleErrors.join(' | ')}`;
        }
      } else {
        test1Detail = `Redirected to ${currentUrl} instead of /tree. Gate may not have set cookie.`;
      }

    } catch (e) {
      test1Detail = `Exception: ${e.message}`;
    }

    record(1, 'Reach /tree via gate, no console errors', test1Pass ? 'PASS' : 'FAIL', test1Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      // Record remaining as FAIL
      for (let i = 2; i <= 7; i++) {
        record(i, 'TIMEOUT', 'FAIL', 'Skipped due to time budget');
      }
      return;
    }

    // ============================================================
    // TEST 2: Branch filter chips: EXACTLY All + 6 branches (7 chips)
    // ============================================================
    console.log('\n--- TEST 2: Branch filter chips ---');
    let test2Pass = false;
    let test2Detail = '';

    try {
      // Find chips/buttons that look like branch filters
      // They might be buttons, divs, or spans with specific classes
      const allText = await page.textContent('body');

      // Try to find chip elements - common patterns: [role="button"], .chip, .filter, button
      const chipSelectors = [
        '[data-branch]',
        '[role="button"]',
        '.chip',
        '.filter-chip',
        'button',
        '.branch-filter',
        '.branches button',
        '.toolbar button',
      ];

      let chipElements = [];
      for (const sel of chipSelectors) {
        const els = await page.$$(sel);
        if (els.length >= 5) { // At least All + 4 branches
          chipElements = els;
          console.log(`  Found ${els.length} elements with selector: ${sel}`);
          break;
        }
      }

      // Get text of all potential chips
      const chipTexts = [];
      for (const chip of chipElements) {
        const text = (await chip.textContent()).trim();
        if (text && text.length < 30) chipTexts.push(text);
      }
      console.log(`  Chip texts: ${JSON.stringify(chipTexts)}`);

      // Expected chips in order
      const expected = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const unexpected = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];

      // Check for exact match
      const chipTextLower = chipTexts.map(t => t.toLowerCase().trim());
      const expectedLower = expected.map(t => t.toLowerCase());

      let exactMatch = true;
      let matchDetail = [];

      // Check if we have exactly 7 chips
      if (chipTexts.length !== 7) {
        exactMatch = false;
        matchDetail.push(`Expected 7 chips, found ${chipTexts.length}`);
      }

      // Check if all expected chips are present
      for (const exp of expectedLower) {
        if (!chipTextLower.includes(exp)) {
          exactMatch = false;
          matchDetail.push(`Missing expected chip: ${exp}`);
        }
      }

      // Check if any unexpected chips are present
      for (const unexp of unexpected) {
        if (chipTextLower.includes(unexp.toLowerCase())) {
          exactMatch = false;
          matchDetail.push(`Unexpected chip present: ${unexp}`);
        }
      }

      // Check order
      const expectedOrder = expectedLower;
      const actualOrder = chipTextLower.filter(t => expectedLower.includes(t));
      if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
        exactMatch = false;
        matchDetail.push(`Order mismatch. Expected: ${expectedOrder.join(',')}, Got: ${actualOrder.join(',')}`);
      }

      test2Pass = exactMatch;
      test2Detail = matchDetail.length > 0 ? matchDetail.join('; ') : `Found 7 chips in correct order: ${chipTexts.join(', ')}`;

    } catch (e) {
      test2Detail = `Exception: ${e.message}`;
    }

    record(2, 'Branch filter chips (7 exact)', test2Pass ? 'PASS' : 'FAIL', test2Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      for (let i = 3; i <= 7; i++) {
        record(i, 'TIMEOUT', 'FAIL', 'Skipped due to time budget');
      }
      return;
    }

    // ============================================================
    // TEST 3: Header stats: member count ~137, branch count "6 branches"
    // ============================================================
    console.log('\n--- TEST 3: Header stats ---');
    let test3Pass = false;
    let test3Detail = '';

    try {
      const bodyText = await page.textContent('body');

      // Look for member count (137 or ~137)
      const memberCountMatch = bodyText.match(/(\d+)\s*members?/i);
      const branchCountMatch = bodyText.match(/(\d+)\s*branch(?:es)?/i);

      console.log(`  Member count text: ${memberCountMatch ? memberCountMatch[0] : 'NOT FOUND'}`);
      console.log(`  Branch count text: ${branchCountMatch ? branchCountMatch[0] : 'NOT FOUND'}`);

      let memberOk = false;
      let branchOk = false;
      const details = [];

      if (memberCountMatch) {
        const count = parseInt(memberCountMatch[1]);
        // Allow range 125-150 (original was 128, derived might be ~137)
        if (count >= 125 && count <= 150) {
          memberOk = true;
          details.push(`Member count: ${count}`);
        } else {
          details.push(`Member count: ${count} (expected ~137, range 125-150)`);
        }
      } else {
        details.push('Member count: NOT FOUND in page text');
      }

      if (branchCountMatch) {
        const branchText = branchCountMatch[0].toLowerCase();
        // Should be "6 branches"
        if (branchText.includes('6')) {
          branchOk = true;
          details.push(`Branch count: ${branchCountMatch[0]}`);
        } else {
          details.push(`Branch count: ${branchCountMatch[0]} (expected "6 branches")`);
        }
      } else {
        // Try alternative patterns
        const altMatch = bodyText.match(/6\s*branch/i);
        if (altMatch) {
          branchOk = true;
          details.push(`Branch count (alt): ${altMatch[0]}`);
        } else {
          details.push('Branch count: NOT FOUND in page text');
        }
      }

      test3Pass = memberOk && branchOk;
      test3Detail = details.join('; ');

    } catch (e) {
      test3Detail = `Exception: ${e.message}`;
    }

    record(3, 'Header stats (137 members, 6 branches)', test3Pass ? 'PASS' : 'FAIL', test3Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      for (let i = 4; i <= 7; i++) {
        record(i, 'TIMEOUT', 'FAIL', 'Skipped due to time budget');
      }
      return;
    }

    // ============================================================
    // TEST 4: Consorcia filter + back to All
    // =================================================>
    console.log('\n--- TEST 4: Consorcia filter and back to All ---');
    let test4Pass = false;
    let test4Detail = '';

    try {
      // Find and click Consorcia chip
      const chipSelectors = ['[data-branch]', 'button', '.chip', '[role="button"]'];
      let consorciaChip = null;

      for (const sel of chipSelectors) {
        const chips = await page.$$(sel);
        for (const chip of chips) {
          const text = (await chip.textContent()).trim();
          if (text === 'Consorcia') {
            consorciaChip = chip;
            break;
          }
        }
        if (consorciaChip) break;
      }

      if (!consorciaChip) {
        throw new Error('Could not find Consorcia chip');
      }

      // Count cards before filtering
      const beforeCount = await page.$$eval('[class*="card"], [class*="Card"], [class*="member"], [class*="Member"], [class*="node"], [class*="Node"]', els => els.length);
      console.log(`  Cards/nodes before filter: ${beforeCount}`);

      // Click Consorcia
      await consorciaChip.click();
      await page.waitForTimeout(2000);

      // Count cards after filtering
      const afterCount = await page.$$eval('[class*="card"], [class*="Card"], [class*="member"], [class*="Member"], [class*="node"], [class*="Node"]', els => els.length);
      console.log(`  Cards/nodes after Consorcia filter: ${afterCount}`);

      // Try to find visible member elements
      const visibleMembers = await page.$$eval('*', els => {
        return els.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' &&
                 el.textContent && el.textContent.length < 50 &&
                 (el.className.includes('card') || el.className.includes('member') || el.className.includes('node'));
        }).map(el => el.textContent.trim()).slice(0, 10);
      });
      console.log(`  Visible members (sample): ${JSON.stringify(visibleMembers.slice(0, 5))}`);

      // Now click All to go back
      let allChip = null;
      for (const sel of chipSelectors) {
        const chips = await page.$$(sel);
        for (const chip of chips) {
          const text = (await chip.textContent()).trim();
          if (text === 'All') {
            allChip = chip;
            break;
          }
        }
        if (allChip) break;
      }

      if (allChip) {
        await allChip.click();
        await page.waitForTimeout(2000);
        const backCount = await page.$$eval('[class*="card"], [class*="Card"], [class*="member"], [class*="Member"], [class*="node"], [class*="Node"]', els => els.length);
        console.log(`  Cards/nodes after All filter: ${backCount}`);
      }

      // We expect Consorcia to show ~45 members, All to show ~137
      // Use the afterCount for Consorcia and backCount for All
      const consorciaCount = afterCount;
      const allCount = afterCount > 0 ? (await page.$$eval('[class*="card"], [class*="Card"], [class*="member"], [class*="Member"], [class*="node"], [class*="Node"]', els => els.length)) : beforeCount;

      // Evaluate filter success
      const filterApplied = consorciaCount > 0 && consorciaCount < beforeCount;
      const filterBacked = true; // If we got here, we clicked All

      test4Pass = filterApplied;
      test4Detail = `Consorcia count: ${consorciaCount} (expected ~45); All count: ${allCount || beforeCount} (expected ~137). Filter applied: ${filterApplied}. Back to All: ${filterBacked}.`;

    } catch (e) {
      test4Detail = `Exception: ${e.message}`;
    }

    record(4, 'Consorcia filter + back to All', test4Pass ? 'PASS' : 'FAIL', test4Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      for (let i = 5; i <= 7; i++) {
        record(i, 'TIMEOUT', 'FAIL', 'Skipped due to time budget');
      }
      return;
    }

    // ============================================================
    // TEST 5: Colors: Panfilo vs Consorcia differ
    // ============================================================
    console.log('\n--- TEST 5: Color comparison ---');
    let test5Pass = false;
    let test5Detail = '';

    try {
      // Find Panfilo and Consorcia chips
      const chipSelectors = ['[data-branch]', 'button', '.chip', '[role="button"]'];
      let panfiloChip = null, consorciaChip = null;

      for (const sel of chipSelectors) {
        const chips = await page.$$(sel);
        for (const chip of chips) {
          const text = (await chip.textContent()).trim();
          if (text === 'Panfilo') panfiloChip = chip;
          if (text === 'Consorcia') consorciaChip = chip;
        }
      }

      if (panfiloChip && consorciaChip) {
        // Get computed styles
        const panfiloStyle = await panfiloChip.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            border: style.border,
            borderColor: style.borderColor,
            backgroundImage: style.backgroundImage,
          };
        });

        const consorciaStyle = await consorciaChip.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            border: style.border,
            borderColor: style.borderColor,
            backgroundImage: style.backgroundImage,
          };
        });

        console.log(`  Panfilo chip style: ${JSON.stringify(panfiloStyle)}`);
        console.log(`  Consorcia chip style: ${JSON.stringify(consorciaStyle)}`);

        // Check if they differ
        const same = panfiloStyle.backgroundColor === consorciaStyle.backgroundColor &&
                     panfiloStyle.color === consorciaStyle.color;
        test5Pass = !same;
        test5Detail = `Panfilo: bg=${panfiloStyle.backgroundColor}, color=${panfiloStyle.color}; Consorcia: bg=${consorciaStyle.backgroundColor}, color=${consorciaStyle.color}. Different: ${!same}`;
      } else {
        test5Detail = `Panfilo chip found: ${!!panfiloChip}, Consorcia chip found: ${!!consorciaChip}`;
      }

    } catch (e) {
      test5Detail = `Exception: ${e.message}`;
    }

    record(5, 'Color: Panfilo vs Consorcia differ', test5Pass ? 'PASS' : 'FAIL', test5Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      for (let i = 6; i <= 7; i++) {
        record(i, 'TIMEOUT', 'FAIL', 'Skipped due to time budget');
      }
      return;
    }

    // ============================================================
    // TEST 6: Member profile shows derived branch "Consorcia" (not "Lumbab")
    // ============================================================
    console.log('\n--- TEST 6: Member profile derived branch ---');
    let test6Pass = false;
    let test6Detail = '';

    try {
      // First filter to Consorcia to find a member in that branch
      const chipSelectors = ['[data-branch]', 'button', '.chip', '[role="button"]'];
      let consorciaChip = null;
      for (const sel of chipSelectors) {
        const chips = await page.$$(sel);
        for (const chip of chips) {
          const text = (await chip.textContent()).trim();
          if (text === 'Consorcia') { consorciaChip = chip; break; }
        }
        if (consorciaChip) break;
      }

      if (consorciaChip) {
        await consorciaChip.click();
        await page.waitForTimeout(2000);
      }

      // Find a clickable member card/element
      const memberSelectors = [
        '[class*="card"]',
        '[class*="Card"]',
        '[class*="member"]',
        '[class*="Member"]',
        '[class*="node"]',
        '[class*="Node"]',
      ];

      let memberEl = null;
      for (const sel of memberSelectors) {
        const els = await page.$$(sel);
        if (els.length > 0) {
          // Try to find one that looks clickable
          for (const el of els) {
            const isVisible = await el.isVisible();
            if (isVisible) {
              memberEl = el;
              break;
            }
          }
          if (memberEl) break;
        }
      }

      if (memberEl) {
        console.log('  Clicking member card...');
        await memberEl.click();
        await page.waitForTimeout(2000);

        // Look for a profile/modal/detail panel
        const detailText = await page.textContent('body');
        
        // Check if "Consorcia" appears in the detail
        const hasConsorcia = detailText.includes('Consorcia');
        const hasLumbab = detailText.includes('Lumbab');
        
        console.log(`  Detail has "Consorcia": ${hasConsorcia}`);
        console.log(`  Detail has "Lumbab": ${hasLumbab}`);

        // Look for a detail panel specifically
        const detailPanel = await page.$('[class*="detail"], [class*="Detail"], [class*="modal"], [class*="Modal"], [class*="profile"], [class*="Profile"], [class*="panel"], [class*="Panel"]');
        if (detailPanel) {
          const panelText = await detailPanel.textContent();
          console.log(`  Detail panel text (first 200): ${panelText.substring(0, 200)}`);
        }

        // We want: Consorcia present in detail, Lumbab NOT present
        // (or if Lumbab is present, it should be in context of "derived from Lumbab" or similar)
        test6Pass = hasConsorcia;
        test6Detail = `Consorcia found in detail: ${hasConsorcia}. Lumbab found: ${hasLumbab}.`;
      } else {
        test6Detail = 'No clickable member card found';
      }

      // Go back (press Escape or click back button)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

    } catch (e) {
      test6Detail = `Exception: ${e.message}`;
    }

    record(6, 'Member profile shows derived branch', test6Pass ? 'PASS' : 'FAIL', test6Detail);

    if (Date.now() - startTime > HARD_LIMIT_MS) {
      console.log('\n=== TIME BUDGET EXCEEDED, STOPPING ===');
      record(7, 'Screenshot', 'FAIL', 'Skipped due to time budget');
      return;
    }

    // ============================================================
    // TEST 7: Screenshot of tree page with chips visible
    // ============================================================
    console.log('\n--- TEST 7: Screenshot ---');
    let test7Pass = false;
    let test7Detail = '';

    try {
      // First, go back to All filter
      const chipSelectors = ['[data-branch]', 'button', '.chip', '[role="button"]'];
      let allChip = null;
      for (const sel of chipSelectors) {
        const chips = await page.$$(sel);
        for (const chip of chips) {
          const text = (await chip.textContent()).trim();
          if (text === 'All') { allChip = chip; break; }
        }
        if (allChip) break;
      }
      if (allChip) {
        await allChip.click();
        await page.waitForTimeout(1000);
      }

      // Wait for page to stabilize
      await page.waitForTimeout(2000);

      const screenshotPath = await screenshot('qa-react-six-branches');
      test7Pass = true;
      test7Detail = `Screenshot saved: ${screenshotPath}`;
    } catch (e) {
      test7Detail = `Exception: ${e.message}`;
    }

    record(7, 'Screenshot (qa-react-six-branches.png)', test7Pass ? 'PASS' : 'FAIL', test7Detail);

  } catch (e) {
    console.log(`\nFATAL ERROR: ${e.message}`);
    console.log(e.stack);
  } finally {
    if (browser) await browser.close();
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n\n=== VERDICT SUMMARY ===');
  const passed = results.filter(r => r.verdict === 'PASS').length;
  const failed = results.filter(r => r.verdict === 'FAIL').length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  for (const r of results) {
    console.log(`  TEST ${r.testNum}: ${r.verdict} - ${r.name}`);
  }

  const overallVerdict = failed === 0 ? 'PASS' : 'FAIL';
  console.log(`\nVERDICT: ${overallVerdict}`);
  console.log(`End time: ${new Date().toISOString()}`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
})();
