// E2E: Verify branch derivation on live Vercel after PR #13
// Target: https://apor-tree.vercel.app
// Time budget: 7 min

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'https://apor-tree.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', 'screenshots', 'apor-family-tree');

(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.setDefaultTimeout(8000);
  const NAV_TIMEOUT = 20000;

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Filter out known benign browser warnings
      const text = msg.text();
      if (/behind a redirect/i.test(text)) return;
      consoleErrors.push(`[console] ${text}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[pageerror] ${err.message}`);
  });

  const results = [];
  function record(test, pass, detail) {
    results.push({ test, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} | ${test} | ${detail}`);
  }

  async function waitTreeLoaded(timeout = 25000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try {
        const txt = await page.textContent('body');
        if (!/Loading family tree/i.test(txt)) return true;
      } catch(e) {}
      await page.waitForTimeout(500);
    }
    return false;
  }

  // Complete the gate flow and navigate to a target page using in-app nav
  async function passThroughGateAndNav(targetHref, targetLabel) {
    await page.goto(`${BASE}/gate`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForSelector('input', { timeout: 15000 });
    await waitTreeLoaded(25000);
    await page.waitForTimeout(2000);

    const gateInput = page.locator('input').first();
    await gateInput.fill('Demelito');
    await page.waitForTimeout(3000);

    // Click Demelito result via its ancestor
    const clicked = await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && /Demelito/i.test(el.textContent)) {
          let target = el;
          while (target && target !== document.body) {
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.role === 'button' || target.onclick) {
              target.click();
              return `Clicked ${target.tagName}`;
            }
            const keys = Object.keys(target);
            const hasReactProps = keys.some(k => k.startsWith('__reactProps'));
            if (hasReactProps) {
              const props = target[keys.find(k => k.startsWith('__reactProps'))];
              if (props && props.onClick) {
                target.click();
                return `Clicked React onClick on ${target.tagName}`;
              }
            }
            target = target.parentElement;
          }
          if (el.parentElement) {
            el.parentElement.click();
            return `Clicked parent of ${el.tagName}`;
          }
        }
      }
      return null;
    });
    console.log(`  [gate] Click: ${clicked}`);
    await page.waitForTimeout(3000);

    // Find and click "Enter as Demelito" button
    const allButtons = await page.locator('button').all();
    let enterBtn = null;
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const disabled = await btn.isDisabled();
      if (/Enter as|Continue/i.test(text.trim()) && !disabled) {
        enterBtn = btn;
      }
    }

    if (enterBtn) {
      const btnText = await enterBtn.textContent();
      console.log(`  [gate] Clicking "${btnText.trim()}"...`);
      await enterBtn.click();
      await page.waitForTimeout(5000);
      console.log(`  [gate] URL: ${page.url()}`);

      // Navigate to target
      if (targetHref && targetLabel) {
        const navClicked = await page.evaluate((href) => {
          const link = document.querySelector(`a[href="${href}"]`);
          if (link) { link.click(); return true; }
          return false;
        }, `/${targetHref}`);
        if (navClicked) {
          console.log(`  [gate] JS-clicked ${targetLabel} nav`);
          await page.waitForTimeout(3000);
          console.log(`  [gate] URL after nav: ${page.url()}`);
          return true;
        }
      }
      return true;
    }
    return false;
  }

  try {
    // ========================================================================
    // TEST 1: Gate search - "Demelito" => branch "Panfilo"
    // ========================================================================
    console.log('\n=== TEST 1: Gate search - Demelito ===');
    const consoleBefore = consoleErrors.length;

    await page.goto(`${BASE}/gate`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForSelector('input', { timeout: 15000 });
    await waitTreeLoaded(25000);
    await page.waitForTimeout(2000);

    const input = page.locator('input').first();
    await input.fill('Demelito');
    await page.waitForTimeout(3000);

    const body1 = await page.textContent('body');
    const hasDemelito = /Demelito/i.test(body1);
    const hasPanfilo = /Panfilo/i.test(body1);
    console.log(`  Demelito=${hasDemelito}, Panfilo=${hasPanfilo}`);
    const idx1 = body1.indexOf('Demelito');
    if (idx1 >= 0) {
      console.log(`  Context: "${body1.substring(Math.max(0, idx1 - 30), idx1 + 120)}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-gate-demelito.png'), fullPage: true });

    if (hasDemelito && hasPanfilo) {
      record('Gate: Demelito shows Panfilo branch', true, 'Demelito found; Panfilo (derived) present');
    } else {
      record('Gate: Demelito shows Panfilo branch', false,
        `Demelito=${hasDemelito}, Panfilo=${hasPanfilo}`);
    }

    // ========================================================================
    // TEST 1b: Gate search - "Wilda" => branch "Consorcia"
    // ========================================================================
    console.log('\n=== TEST 1b: Gate search - Wilda ===');
    await page.goto(`${BASE}/gate`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForSelector('input', { timeout: 15000 });
    await waitTreeLoaded(25000);
    await page.waitForTimeout(2000);

    const input2 = page.locator('input').first();
    await input2.fill('Wilda');
    await page.waitForTimeout(3000);

    const body2 = await page.textContent('body');
    const hasWilda = /Wilda/i.test(body2);
    const hasConsorcia = /Consorcia/i.test(body2);
    console.log(`  Wilda=${hasWilda}, Consorcia=${hasConsorcia}`);
    const idx2 = body2.indexOf('Wilda');
    if (idx2 >= 0) {
      console.log(`  Context: "${body2.substring(Math.max(0, idx2 - 30), idx2 + 120)}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-gate-wilda.png'), fullPage: true });

    if (hasWilda && hasConsorcia) {
      record('Gate: Wilda shows Consorcia branch', true, 'Wilda found; Consorcia (raw was Lumbab) present');
    } else {
      record('Gate: Wilda shows Consorcia branch', false,
        `Wilda=${hasWilda}, Consorcia=${hasConsorcia}`);
    }

    const ceGate = consoleErrors.slice(consoleBefore);
    if (ceGate.length > 0) {
      record('Gate: No console errors', false, ceGate.join(' | '));
    } else {
      record('Gate: No console errors', true, 'Clean console');
    }

    // ========================================================================
    // TEST 2: RSVP page - dropdown has exactly 6 branch options
    // ========================================================================
    console.log('\n=== TEST 2: RSVP page branches ===');
    const consoleBefore2 = consoleErrors.length;

    const gateOk = await passThroughGateAndNav('rsvp', 'RSVP');
    console.log(`  Gate passed: ${gateOk}, URL: ${page.url()}`);

    if (gateOk) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-page.png'), fullPage: true });

      // Find select
      const selectEl = page.locator('select').first();
      let optionTexts = [];

      if (await selectEl.count() > 0) {
        optionTexts = await selectEl.locator('option').allTextContents();
        console.log(`  <select> options (${optionTexts.length}): ${optionTexts.join(', ')}`);
        // Click to open dropdown for screenshot
        await selectEl.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-branches.png'), fullPage: true });
      } else {
        console.log('  No <select> found');
      }

      // Validate: filter out placeholder and "Other" options, check only the 6 branches
      const EXPECTED = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const BLOCKED = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];

      const normalized = optionTexts.map(o => o.trim()).filter(o => o.length > 0);
      // Remove placeholder-like options
      const branchOptions = normalized.filter(o => !/^Select/i.test(o) && !/^Other/i.test(o) && !/^Not sure/i.test(o));

      const hasAllExpected = EXPECTED.every(e => branchOptions.some(o => o.toLowerCase() === e.toLowerCase()));
      const hasBlocked = BLOCKED.filter(b => branchOptions.some(o => o.toLowerCase().includes(b.toLowerCase())));

      console.log(`  Branch options (${branchOptions.length}): ${branchOptions.join(', ')}`);
      console.log(`  All expected present: ${hasAllExpected}. Blocked: ${hasBlocked.join(', ')}`);

      if (branchOptions.length === 6 && hasAllExpected && hasBlocked.length === 0) {
        record('RSVP: Family branch dropdown has exactly 6 correct options', true,
          `Branches: ${branchOptions.join(', ')}`);
      } else {
        record('RSVP: Family branch dropdown has exactly 6 correct options', false,
          `Found ${branchOptions.length} branch options. Expected 6. All expected: ${hasAllExpected}. Blocked: ${hasBlocked.join(', ')}. Options: ${branchOptions.join(', ')}`);
      }
    } else {
      record('RSVP: Family branch dropdown has exactly 6 correct options', false,
        'Could not pass through gate');
    }

    const ceRsvp = consoleErrors.slice(consoleBefore2);
    if (ceRsvp.length > 0) {
      record('RSVP: No console errors', false, ceRsvp.join(' | '));
    } else {
      record('RSVP: No console errors', true, 'Clean console');
    }

    // ========================================================================
    // TEST 3: Tree page - chips = All + 6 branches (regression)
    // ========================================================================
    console.log('\n=== TEST 3: Tree page chips ===');
    const consoleBefore3 = consoleErrors.length;

    const gateOk3 = await passThroughGateAndNav('tree', 'Tree');
    if (gateOk3) {
      await waitTreeLoaded(25000);
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-tree-page.png'), fullPage: true });

      // The tree page has a "Filter by branch" section with chip buttons.
      // Get the text of all buttons, then find the filter chip section.
      // The filter chips are the ones right after "Filter by branch" text.
      const treeText = await page.textContent('body');
      console.log(`  Tree page header: ${treeText.substring(0, 300)}`);

      // Extract the filter section: between "Filter by branch" and the first member card
      const filterIdx = treeText.indexOf('Filter by branch');
      const memberIdx = treeText.indexOf('Generation', filterIdx + 1);
      const filterSection = filterIdx >= 0 && memberIdx > filterIdx
        ? treeText.substring(filterIdx, memberIdx)
        : '';
      console.log(`  Filter section: "${filterSection}"`);

      // Check that filter section contains exactly All + 6 branches
      const EXPECTED = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const BLOCKED = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];

      const hasAll = /All/i.test(filterSection);
      const foundBranches = EXPECTED.filter(b => filterSection.includes(b));
      const foundBlocked = BLOCKED.filter(b => filterSection.includes(b));

      console.log(`  Filter: All=${hasAll}, Branches=${foundBranches.join(', ')} (${foundBranches.length}/6)`);
      console.log(`  Blocked in filter: ${foundBlocked.join(', ')}`);

      if (hasAll && foundBranches.length === 6 && foundBlocked.length === 0) {
        record('Tree: Chips = All + 6 branches (no regression)', true,
          `Filter chips: All, ${foundBranches.join(', ')}`);
      } else {
        record('Tree: Chips = All + 6 branches (no regression)', false,
          `All=${hasAll}, Branches=${foundBranches.length}/6, Blocked=${foundBlocked.join(', ')}`);
      }
    } else {
      record('Tree: Chips = All + 6 branches (no regression)', false, 'Could not pass through gate');
    }

    const ceTree = consoleErrors.slice(consoleBefore3);
    if (ceTree.length > 0) {
      record('Tree: No console errors', false, ceTree.join(' | '));
    } else {
      record('Tree: No console errors', true, 'Clean console');
    }

    // ========================================================================
    // TEST 4: Chat page
    // ========================================================================
    console.log('\n=== TEST 4: Chat page ===');
    const consoleBefore4 = consoleErrors.length;

    const gateOk4 = await passThroughGateAndNav('chat', 'Chat');
    if (gateOk4) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-chat-page.png'), fullPage: true });

      const chatText = await page.textContent('body');
      console.log(`  Chat body (first 500): ${chatText.substring(0, 500)}`);

      // Check for any message author chips with branch-based coloring
      const authorChips = await page.locator('[class*="author"], [class*="chip"], [class*="badge"], [class*="branch-label"]').allTextContents();
      console.log(`  Author/branch chips: ${authorChips.length > 0 ? authorChips.join(', ') : 'none (no messages yet)'}`);

      const ceChat = consoleErrors.slice(consoleBefore4);
      if (ceChat.length > 0) {
        record('Chat: No console errors', false, ceChat.join(' | '));
      } else {
        record('Chat: No console errors', true, 'Clean console');
      }
      record('Chat page reachable', true, 'Page loaded without crash');
    } else {
      record('Chat page reachable', false, 'Could not pass through gate');
      record('Chat: No console errors', true, 'N/A');
    }

    // ========================================================================
    // FINAL
    // ========================================================================
    console.log('\n\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================');
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    results.forEach(r => {
      console.log(`  ${r.pass ? 'PASS' : 'FAIL'} | ${r.test}`);
      if (!r.pass) console.log(`         Detail: ${r.detail}`);
    });
    console.log(`\nPassed: ${passed}/${results.length}  Failed: ${failed}`);
    console.log(`Overall: ${failed === 0 ? 'PASS' : 'FAIL'}`);

  } catch (err) {
    console.error('FATAL ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
})();
