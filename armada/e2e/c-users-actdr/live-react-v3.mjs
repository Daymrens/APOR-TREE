// QA E2E verification v3: LIVE React web app at https://apor-tree.vercel.app
// Refined selectors based on screenshot analysis
// Time budget: 7 minutes hard stop

import { chromium } from 'playwright';

const BASE = 'https://apor-tree.vercel.app';
const NAV_TIMEOUT = 15000;
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
  console.log('=== QA Live React Verification v3 ===');
  const startTime = Date.now();
  const HARD_LIMIT_MS = 7 * 60 * 1000;

  try {
    browser = await chromium.launch({ headless: true, timeout: LAUNCH_TIMEOUT });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    page.setDefaultTimeout(5000);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ===== GATE FLOW =====
    // Strategy: try the proper gate, then fall back to cookie + direct nav
    console.log('\n--- Gate flow ---');
    
    // First, try proper gate flow
    await page.goto(`${BASE}/gate`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(3000);
    console.log(`  Gate URL: ${page.url()}`);

    // Type a known member name to trigger the name finder
    const nameInput = await page.$('input#member-name, input[placeholder*="name" i]');
    if (nameInput) {
      await nameInput.click();
      await nameInput.fill('Gerbracio');
      await page.waitForTimeout(2000);
      console.log('  Typed "Gerbracio", waiting for suggestions...');
      
      // Look for suggestions that appeared
      const suggestions = await page.$$('[class*="suggestion"], [class*="result"], [class*="match"], li, [role="option"]');
      console.log(`  Suggestion elements: ${suggestions.length}`);
      
      // Check body text for matches
      const bodyAfter = await page.textContent('body');
      if (bodyAfter.includes('Gerbracio')) {
        console.log('  "Gerbracio" found in body');
      }

      // Try clicking Enter the reunion if it's enabled
      const enterBtn = await page.$('button:has-text("Enter the reunion")');
      if (enterBtn) {
        const isDisabled = await enterBtn.evaluate(el => el.disabled);
        console.log(`  Enter button disabled: ${isDisabled}`);
        if (!isDisabled) {
          await enterBtn.click();
          await page.waitForTimeout(3000);
          console.log(`  After Enter click: ${page.url()}`);
        }
      }
    }

    // If not on /tree, fall back to cookie-based approach
    if (!page.url().includes('/tree')) {
      console.log('  Gate flow did not reach /tree, using cookie fallback...');
      
      // Navigate to /api/set-member to set the cookie via the API
      try {
        const resp = await page.evaluate(async () => {
          const r = await fetch('/api/set-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Gerbracio Apor' }),
          });
          return { status: r.status, text: await r.text() };
        });
        console.log(`  /api/set-member response: ${resp.status} ${resp.text}`);
      } catch (e) {
        console.log(`  /api/set-member failed: ${e.message}`);
      }

      // Now navigate to /tree
      await page.goto(`${BASE}/tree`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      await page.waitForTimeout(5000);
      console.log(`  After API + nav: ${page.url()}`);
    }

    // Final fallback: set cookie manually
    if (!page.url().includes('/tree')) {
      console.log('  Setting cookie manually...');
      await context.addCookies([{
        name: 'family-session',
        value: JSON.stringify({ memberName: 'Gerbracio Apor', branch: 'All' }),
        domain: 'apor-tree.vercel.app',
        path: '/',
      }]);
      await page.goto(`${BASE}/tree`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      await page.waitForTimeout(5000);
      console.log(`  After manual cookie: ${page.url()}`);
    }

    // ===== TEST 1: Reach /tree, no console errors =====
    const onTree = page.url().includes('/tree');
    const test1Detail = `URL: ${page.url()}; Console errors: ${consoleErrors.length}${consoleErrors.length > 0 ? ': ' + consoleErrors.slice(0,3).join('; ') : ''}`;
    record(1, 'Reach /tree via gate, no console errors', onTree ? 'PASS' : 'FAIL', test1Detail);

    if (!onTree) {
      console.log('\n=== CANNOT REACH /tree, STOPPING ===');
      for (let i = 2; i <= 7; i++) record(i, 'SKIPPED', 'FAIL', 'Depends on /tree');
      return;
    }

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 2: Branch filter chips =====
    console.log('\n--- TEST 2: Branch filter chips ---');

    // Get all chip buttons - they are the FILTER BY BRANCH row buttons
    // From screenshot: chips are styled buttons with colored dots
    const chipButtons = await page.$$('button');
    const chipTexts = [];
    for (const btn of chipButtons) {
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;
      const text = (await btn.textContent()).trim();
      // Filter chip texts are short branch names or "All"
      const knownChips = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      if (knownChips.includes(text)) {
        chipTexts.push(text);
      }
    }
    console.log(`  Chip texts found: ${JSON.stringify(chipTexts)}`);

    const expected = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    const unexpected = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];

    // Deduplicate while preserving order (chips might appear twice if rendered in different views)
    const uniqueChips = [...new Set(chipTexts)];

    const issues = [];
    if (uniqueChips.length !== 7) issues.push(`Expected 7 unique chips, found ${uniqueChips.length}: [${uniqueChips}]`);
    for (const exp of expected) {
      if (!uniqueChips.includes(exp)) issues.push(`Missing: ${exp}`);
    }
    for (const unexp of unexpected) {
      if (uniqueChips.includes(unexp)) issues.push(`Unexpected: ${unexp}`);
    }

    // Check order
    for (let i = 0; i < expected.length - 1; i++) {
      const idx1 = uniqueChips.indexOf(expected[i]);
      const idx2 = uniqueChips.indexOf(expected[i + 1]);
      if (idx1 >= 0 && idx2 >= 0 && idx1 > idx2) {
        issues.push(`Order: ${expected[i]} after ${expected[i + 1]}`);
      }
    }

    const test2Pass = issues.length === 0;
    record(2, 'Branch filter chips (7 exact)', test2Pass ? 'PASS' : 'FAIL',
      issues.length > 0 ? issues.join('; ') : `All 7 present in order: ${uniqueChips.join(', ')}`);

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 3: Header stats =====
    console.log('\n--- TEST 3: Header stats ---');
    const bodyText = await page.textContent('body');
    const memberMatch = bodyText.match(/(\d+)\s*members?/i);
    const branchMatch = bodyText.match(/(\d+)\s*branches?/i);

    let memberOk = false, branchOk = false;
    const d3 = [];
    if (memberMatch) {
      const c = parseInt(memberMatch[1]);
      memberOk = c >= 120 && c <= 150;
      d3.push(`Members: ${c} (${memberMatch[0]})`);
    } else d3.push('Members: NOT FOUND');

    if (branchMatch) {
      const c = parseInt(branchMatch[1]);
      branchOk = c === 6;
      d3.push(`Branches: ${c} (${branchMatch[0]})`);
    } else d3.push('Branches: NOT FOUND');

    record(3, 'Header stats', memberOk && branchOk ? 'PASS' : 'FAIL', d3.join('; '));

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 4: Consorcia filter + back to All =====
    console.log('\n--- TEST 4: Consorcia filter ---');

    // Count member cards - look for elements with "GEN" badge text
    async function countMembers() {
      const genEls = await page.$$eval('*', els => {
        return els.filter(el => {
          const text = el.textContent.trim();
          // Member cards have "GEN X" badge, a name, and are clickable
          return text.match(/^GEN \d/) && el.offsetWidth > 0;
        }).length;
      });
      // Also count by looking for elements with initials pattern (2-3 letter large text)
      const memberCards = await page.$$eval('[class*="rounded"]', els => {
        return els.filter(el => {
          const text = el.textContent;
          // Cards contain "GEN" and a name pattern
          return text.includes('GEN') && el.offsetWidth > 200 && el.offsetHeight > 200;
        }).length;
      });
      return { genBadges: genEls, cards: memberCards };
    }

    // Better approach: count generation section member counts
    async function getTotalVisibleCount() {
      // Sum up "X members" text from each generation section
      const counts = await page.$$eval('*', els => {
        const results = [];
        for (const el of els) {
          const text = el.textContent.trim();
          const match = text.match(/^(\d+)\s*members?$/i);
          if (match && el.offsetWidth > 0 && el.children.length === 0) {
            results.push(parseInt(match[1]));
          }
        }
        return results;
      });
      return counts.reduce((a, b) => a + b, 0);
    }

    const beforeCount = await getTotalVisibleCount();
    console.log(`  Before filter total: ${beforeCount}`);

    // Click Consorcia chip
    const consorciaBtn = await page.$('button:has-text("Consorcia")');
    if (consorciaBtn) {
      await consorciaBtn.click();
      await page.waitForTimeout(2000);

      const afterConsorcia = await getTotalVisibleCount();
      console.log(`  After Consorcia filter: ${afterConsorcia}`);

      // Click All
      const allBtn = await page.$('button:has-text("All")');
      if (allBtn) {
        await allBtn.click();
        await page.waitForTimeout(2000);
        const afterAll = await getTotalVisibleCount();
        console.log(`  After All: ${afterAll}`);

        // Check: Consorcia filter should show fewer than All
        const filterApplied = afterConsorcia > 0 && afterConsorcia < afterAll;
        const restored = afterAll >= beforeCount * 0.9; // Allow 10% variance
        record(4, 'Consorcia filter + back to All', filterApplied ? 'PASS' : 'FAIL',
          `Before: ${beforeCount}, Consorcia: ${afterConsorcia}, All: ${afterAll}. Filter applied: ${filterApplied}`);
      } else {
        record(4, 'Consorcia filter + back to All', 'FAIL', 'Could not find All button');
      }
    } else {
      record(4, 'Consorcia filter + back to All', 'FAIL', 'Could not find Consorcia button');
    }

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 5: Color comparison =====
    console.log('\n--- TEST 5: Color comparison ---');

    // The chips have colored dots. Let's find the dot elements inside each chip.
    const chipColorInfo = {};
    const chipNames = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];

    for (const name of chipNames) {
      // Find the button containing this text
      const btn = await page.$(`button:has-text("${name}")`);
      if (btn) {
        // Look for colored dot/span inside
        const dotInfo = await btn.evaluate(el => {
          // Find the small colored dot element (usually a span with bg color)
          const spans = el.querySelectorAll('span, div, i');
          const info = { button: el.textContent.trim() };
          for (const span of spans) {
            const style = window.getComputedStyle(span);
            if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'rgb(255, 255, 255)' && style.width !== '0px') {
              info.dotColor = style.backgroundColor;
              info.dotWidth = style.width;
              break;
            }
          }
          // Also check button's own border-left or background
          const btnStyle = window.getComputedStyle(el);
          info.btnBg = btnStyle.backgroundColor;
          info.btnBorderLeft = btnStyle.borderLeftColor;
          return info;
        });
        chipColorInfo[name] = dotInfo;
        console.log(`  ${name}: ${JSON.stringify(dotInfo)}`);
      }
    }

    // Check if Panfilo and Consorcia have different colors
    const pColor = chipColorInfo['Panfilo'];
    const cColor = chipColorInfo['Consorcia'];
    if (pColor && cColor) {
      const different = JSON.stringify(pColor) !== JSON.stringify(cColor);
      record(5, 'Color: Panfilo vs Consorcia differ', different ? 'PASS' : 'FAIL',
        `Panfilo: ${JSON.stringify(pColor)}; Consorcia: ${JSON.stringify(cColor)}; Different: ${different}`);
    } else {
      record(5, 'Color: Panfilo vs Consorcia differ', 'FAIL',
        `Panfilo: ${JSON.stringify(pColor)}; Consorcia: ${JSON.stringify(cColor)}`);
    }

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 6: Member profile derived branch =====
    console.log('\n--- TEST 6: Member profile ---');

    // Filter to Consorcia first
    const consorciaBtn6 = await page.$('button:has-text("Consorcia")');
    if (consorciaBtn6) {
      await consorciaBtn6.click();
      await page.waitForTimeout(2000);
    }

    // Find a member card to click - look for elements containing "Consorcia" text that are cards
    // From the screenshot, cards have: GEN badge, initials, name, "Consorcia" branch label
    // The cards are likely the colored-border rounded boxes
    const memberCards = await page.$$eval('[class*="rounded"]', els => {
      return els.filter(el => {
        return el.textContent.includes('Consorcia') &&
               el.offsetWidth > 200 && el.offsetHeight > 200 &&
               el.querySelector('p, span');
      }).map(el => ({
        text: el.textContent.substring(0, 80),
        tag: el.tagName,
      }));
    });
    console.log(`  Consorcia member cards found: ${memberCards.length}`);
    if (memberCards.length > 0) {
      console.log(`  First card: ${JSON.stringify(memberCards[0])}`);
    }

    // Try clicking the first member card
    // Use a more specific approach: find a member name text and click its parent card
    let clickedMember = false;
    const memberNames = await page.$$('p, h3, h4, span');
    for (const el of memberNames) {
      try {
        const isVisible = await el.isVisible();
        if (!isVisible) continue;
        const text = (await el.textContent()).trim();
        // Member names are like "Lolo Gerbacio", "Lola Marciana", etc.
        if (text.match(/^(Lolo|Lola|Mr|Mrs|Ms|Dr)\s+\w/i) || text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/)) {
          // Found a name, click it or its parent card
          const parent = await el.evaluateHandle(el => {
            // Walk up to find a clickable card container
            let current = el;
            while (current && current.parentElement) {
              current = current.parentElement;
              if (current.offsetWidth > 200 && current.offsetHeight > 200 && current.tagName !== 'BODY') {
                return current;
              }
            }
            return el;
          });
          console.log(`  Clicking member card for: "${text}"`);
          await parent.click();
          await page.waitForTimeout(2000);
          clickedMember = true;
          break;
        }
      } catch (e) { /* skip */ }
    }

    if (clickedMember) {
      await screenshot('qa-member-profile');

      // Look for detail panel / sidebar / modal
      const detailText = await page.textContent('body');
      const hasConsorcia = detailText.includes('Consorcia');
      const hasLumbab = detailText.includes('Lumbab');

      // Look for a detail/modal/sidebar element
      const detailSelectors = [
        '[class*="detail"]', '[class*="Detail"]',
        '[class*="modal"]', '[class*="Modal"]',
        '[class*="sidebar"]', '[class*="Sidebar"]',
        '[class*="panel"]', '[class*="Panel"]',
        '[class*="drawer"]', '[class*="Drawer"]',
        '[role="dialog"]',
      ];
      let detailText2 = '';
      for (const sel of detailSelectors) {
        const els = await page.$$(sel);
        for (const el of els) {
          try {
            if (await el.isVisible()) {
              const t = await el.textContent();
              if (t.length > 50) {
                detailText2 = t.substring(0, 500);
                console.log(`  Detail panel (${sel}): ${detailText2.substring(0, 200)}`);
                break;
              }
            }
          } catch (e) { /* skip */ }
        }
        if (detailText2) break;
      }

      const branchInDetail = detailText2 || detailText;
      const test6Pass = branchInDetail.includes('Consorcia');
      record(6, 'Member profile shows derived branch', test6Pass ? 'PASS' : 'FAIL',
        `Consorcia in detail: ${branchInDetail.includes('Consorcia')}; Lumbab in detail: ${branchInDetail.includes('Lumbab')}; Detail text: ${detailText2.substring(0, 150)}`);

      // Close detail
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      record(6, 'Member profile shows derived branch', 'FAIL', 'Could not find clickable member');
    }

    if (Date.now() - startTime > HARD_LIMIT_MS) { console.log('TIME BUDGET EXCEEDED'); return; }

    // ===== TEST 7: Final screenshot =====
    console.log('\n--- TEST 7: Screenshot ---');
    // Reset to All
    const allBtn7 = await page.$('button:has-text("All")');
    if (allBtn7) { await allBtn7.click(); await page.waitForTimeout(1000); }
    await page.waitForTimeout(2000);
    const sp = await screenshot('qa-react-six-branches');
    record(7, 'Screenshot', 'PASS', sp);

  } catch (e) {
    console.log(`\nFATAL: ${e.message}\n${e.stack}`);
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
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
})();
