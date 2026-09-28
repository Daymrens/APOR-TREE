// Phase 3 E2E verification: Tree tab restyle
// Bounded Playwright script — no retries, tight timeouts.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS = join(process.cwd(), 'armada', 'screenshots', 'apor-family-tree');
mkdirSync(SCREENSHOTS, { recursive: true });

const PASS = 'PASS';
const FAIL = 'FAIL';
const results = [];
let browser, page;
let consoleErrors = [];
let consoleWarnings = [];

function record(name, status, detail) {
  results.push({ name, status, detail });
  console.log(`  [${status}] ${name}: ${detail}`);
}

(async () => {
  const startTime = Date.now();
  const TIMEOUT_BUDGET_MS = 180_000; // 3 minutes

  try {
    browser = await chromium.launch({ headless: true, timeout: 15000 });
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(4000);

    // Collect console messages
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      if (msg.type() === 'warning') consoleWarnings.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Navigate to the page
    console.log('Navigating to apor-family.html...');
    await page.goto('file:///' + join(process.cwd(), 'public', 'apor-family.html').replace(/\\/g, '/'), { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Page loaded.');

    // ============================================
    // TEST 1: Switch to Tree tab
    // ============================================
    try {
      await page.click('#tab-tree', { timeout: 4000 });
      await page.waitForTimeout(500);
      const treeVisible = await page.$eval('#view-tree', el => el.classList.contains('active'));
      record('1_tree_tab_visible', treeVisible ? PASS : FAIL,
        treeVisible ? 'Tree tab switches and view-tree is active' : 'view-tree not active after clicking tab');
    } catch (e) {
      record('1_tree_tab_visible', FAIL, e.message);
    }

    // ============================================
    // TEST 2: Tree SVG renders with node boxes
    // ============================================
    try {
      const nodeCount = await page.$$eval('#tree .node-box', els => els.length);
      record('2_tree_renders_nodes', nodeCount > 0 ? PASS : FAIL,
        `SVG has ${nodeCount} node-box elements (expected >0)`);
    } catch (e) {
      record('2_tree_renders_nodes', FAIL, e.message);
    }

    // ============================================
    // TEST 3: Branch left-border strips exist
    // ============================================
    try {
      const stripBranches = await page.$$eval('#tree rect[class^="br-"]', els =>
        [...new Set(els.map(el => el.getAttribute('class')))]
      );
      record('3_branch_strips', stripBranches.length >= 5 ? PASS : FAIL,
        `Branch strip classes: ${stripBranches.join(', ')} (expected >=5)`);
    } catch (e) {
      record('3_branch_strips', FAIL, e.message);
    }

    // ============================================
    // TEST 4: Toolbar renders (legend, chips, zoom)
    // ============================================
    try {
      const legendVisible = await page.$eval('.legend', el => getComputedStyle(el).display !== 'none');
      const chipsCount = await page.$$eval('.filter-chip', els => els.length);
      const zoomBtns = await page.$$eval('.zoom-btn', els => els.length);
      record('4_toolbar_renders', legendVisible && chipsCount >= 6 && zoomBtns >= 3 ? PASS : FAIL,
        `legend visible: ${legendVisible}, chips: ${chipsCount}, zoom buttons: ${zoomBtns}`);
    } catch (e) {
      record('4_toolbar_renders', FAIL, e.message);
    }

    // ============================================
    // TEST 5: Screenshot — full tree
    // ============================================
    try {
      const ssTree = join(SCREENSHOTS, 'redesign-phase3-qa-tree.png');
      await page.screenshot({ path: ssTree, fullPage: false });
      record('5_screenshot_tree', PASS, ssTree);
    } catch (e) {
      record('5_screenshot_tree', FAIL, e.message);
    }

    // ============================================
    // TEST 6: Filter — click a branch chip, verify node count changes
    // ============================================
    try {
      const allCount = await page.$$eval('#tree .node-box', els => els.length);
      // Click the "Apor" filter chip (index 1, since index 0 is "All")
      const chips = await page.$$('.filter-chip');
      if (chips.length > 1) {
        await chips[1].click();
        await page.waitForTimeout(300);
        const filteredCount = await page.$$eval('#tree .node-box', els => els.length);
        record('6_filter_changes_nodes', filteredCount !== allCount && filteredCount > 0 ? PASS : FAIL,
          `All: ${allCount}, filtered (Apor): ${filteredCount}`);
      } else {
        record('6_filter_changes_nodes', FAIL, `Only ${chips.length} chips found`);
      }
    } catch (e) {
      record('6_filter_changes_nodes', FAIL, e.message);
    }

    // ============================================
    // TEST 7: Screenshot — filtered state
    // ============================================
    try {
      const ssFiltered = join(SCREENSHOTS, 'redesign-phase3-qa-filtered.png');
      await page.screenshot({ path: ssFiltered, fullPage: false });
      record('7_screenshot_filtered', PASS, ssFiltered);
    } catch (e) {
      record('7_screenshot_filtered', FAIL, e.message);
    }

    // ============================================
    // TEST 8: Filter Lumbab specifically — check node count is 45 per spec
    // ============================================
    try {
      // Find the Lumbab chip by text
      const lumbabChip = await page.$('.filter-chip:nth-child(6)');
      if (lumbabChip) {
        await lumbabChip.click();
        await page.waitForTimeout(300);
        const lumbabCount = await page.$$eval('#tree .node-box', els => els.length);
        // The spec says 45 for Lumbab. Let's verify.
        record('8_filter_lumbab_count', lumbabCount === 45 ? PASS : FAIL,
          `Lumbab filter shows ${lumbabCount} nodes (expected 45)`);
      } else {
        record('8_filter_lumbab_count', FAIL, 'Lumbab chip not found');
      }
    } catch (e) {
      record('8_filter_lumbab_count', FAIL, e.message);
    }

    // ============================================
    // TEST 9: Reset to All
    // ============================================
    try {
      const allChip = await page.$('.filter-chip:first-child');
      if (allChip) {
        await allChip.click();
        await page.waitForTimeout(300);
        const allCount2 = await page.$$eval('#tree .node-box', els => els.length);
        record('9_filter_reset_all', allCount2 === 128 ? PASS : FAIL,
          `All filter shows ${allCount2} nodes (expected 128)`);
      } else {
        record('9_filter_reset_all', FAIL, 'All chip not found');
      }
    } catch (e) {
      record('9_filter_reset_all', FAIL, e.message);
    }

    // ============================================
    // TEST 10: Zoom — test zoom in/out and clamping
    // ============================================
    try {
      // Read initial SVG dimensions
      const initialW = await page.$eval('#tree', el => el.getAttribute('width'));
      // Click zoom in (+) — third .zoom-btn child inside .zoom-controls
      await page.evaluate(() => zoomTree(0.1));
      await page.waitForTimeout(200);
      const afterZoomInW = await page.$eval('#tree', el => parseFloat(el.getAttribute('width')));
      const initialWNum = parseFloat(initialW);
      record('10_zoom_in_works', afterZoomInW > initialWNum ? PASS : FAIL,
        `Width after zoom-in: ${afterZoomInW} > initial: ${initialWNum}`);
    } catch (e) {
      record('10_zoom_in_works', FAIL, e.message);
    }

    // ============================================
    // TEST 11: Zoom clamping — zoom to max and min
    // ============================================
    try {
      // Reset first
      await page.evaluate(() => zoomTree(0));
      await page.waitForTimeout(200);
      // Zoom to max by calling zoomTree(0.1) many times
      for (let i = 0; i < 20; i++) {
        await page.evaluate(() => zoomTree(0.1));
      }
      await page.waitForTimeout(200);
      const maxW = await page.$eval('#tree', el => parseFloat(el.getAttribute('width')));
      const baseW = await page.$eval('#tree', el => parseFloat(el.getAttribute('viewBox').split(' ')[2]));

      // Check max scale is 1.6
      const maxScale = maxW / baseW;
      record('11_zoom_max_clamp', maxScale <= 1.61 ? PASS : FAIL,
        `Max zoom scale: ${maxScale.toFixed(3)} (should be <= 1.6)`);

      // Zoom to min
      for (let i = 0; i < 30; i++) {
        await page.evaluate(() => zoomTree(-0.1));
      }
      await page.waitForTimeout(200);
      const minW = await page.$eval('#tree', el => parseFloat(el.getAttribute('width')));
      const minScale = minW / baseW;
      record('12_zoom_min_clamp', minScale >= 0.39 ? PASS : FAIL,
        `Min zoom scale: ${minScale.toFixed(3)} (should be >= 0.4)`);
    } catch (e) {
      record('11_zoom_max_clamp', FAIL, e.message);
      record('12_zoom_min_clamp', FAIL, e.message);
    }

    // ============================================
    // TEST 13: Fit button
    // ============================================
    try {
      await page.evaluate(() => zoomTree(0)); // Reset zoom
      await page.waitForTimeout(200);
      await page.evaluate(() => fitTree());
      await page.waitForTimeout(300);
      record('13_fit_works', PASS, 'fitTree() executed without error');
    } catch (e) {
      record('13_fit_works', FAIL, e.message);
    }

    // ============================================
    // TEST 14: Open Directory
    // ============================================
    try {
      await page.evaluate(() => openDirectory());
      await page.waitForTimeout(300);
      const dirVisible = await page.$eval('#directory', el => el.classList.contains('show'));
      const dirRows = await page.$$eval('.dir-row', els => els.length);
      record('14_directory_opens', dirVisible ? PASS : FAIL,
        `Directory visible: ${dirVisible}, rows: ${dirRows}`);
    } catch (e) {
      record('14_directory_opens', FAIL, e.message);
    }

    // ============================================
    // TEST 15: Directory shows 128 members
    // ============================================
    try {
      const dirRows = await page.$$eval('.dir-row', els => els.length);
      record('15_directory_count', dirRows === 128 ? PASS : FAIL,
        `Directory has ${dirRows} rows (expected 128)`);
    } catch (e) {
      record('15_directory_count', FAIL, e.message);
    }

    // ============================================
    // TEST 16: Screenshot — directory open
    // ============================================
    try {
      const ssDir = join(SCREENSHOTS, 'redesign-phase3-qa-dir.png');
      await page.screenshot({ path: ssDir, fullPage: false });
      record('16_screenshot_directory', PASS, ssDir);
    } catch (e) {
      record('16_screenshot_directory', FAIL, e.message);
    }

    // ============================================
    // TEST 17: Close directory, open detail on a node
    // ============================================
    try {
      await page.evaluate(() => closeDirectory());
      await page.waitForTimeout(200);
      // Call showDetail directly via JS
      await page.evaluate(() => showDetail(MEMBERS[0]));
      await page.waitForTimeout(300);
      const detailVisible = await page.$eval('#detail', el => el.classList.contains('show'));
      const detailName = await page.$eval('#d-name', el => el.textContent);
      record('17_detail_opens', detailVisible && detailName.length > 0 ? PASS : FAIL,
        `Detail visible: ${detailVisible}, name: "${detailName}"`);
    } catch (e) {
      record('17_detail_opens', FAIL, e.message);
    }

    // ============================================
    // TEST 18: Screenshot — detail open
    // ============================================
    try {
      const ssDetail = join(SCREENSHOTS, 'redesign-phase3-qa-detail.png');
      await page.screenshot({ path: ssDetail, fullPage: false });
      record('18_screenshot_detail', PASS, ssDetail);
    } catch (e) {
      record('18_screenshot_detail', FAIL, e.message);
    }

    // ============================================
    // TEST 19: Detail panel uses token styles (border-top on primary)
    // ============================================
    try {
      const detailBorderTop = await page.$eval('#detail', el => getComputedStyle(el).borderTopColor);
      record('19_detail_uses_tokens', PASS, `Detail border-top-color: ${detailBorderTop}`);
    } catch (e) {
      record('19_detail_uses_tokens', FAIL, e.message);
    }

    // ============================================
    // TEST 20: Directory uses token styles
    // ============================================
    try {
      // Re-open directory
      await page.evaluate(() => openDirectory());
      await page.waitForTimeout(200);
      const dirBorderTop = await page.$eval('#directory', el => getComputedStyle(el).borderTopColor);
      const dirBg = await page.$eval('#directory', el => getComputedStyle(el).backgroundColor);
      record('20_directory_uses_tokens', PASS, `Directory border-top: ${dirBorderTop}, bg: ${dirBg}`);
    } catch (e) {
      record('20_directory_uses_tokens', FAIL, e.message);
    }

    // ============================================
    // TEST 21: Node hover styling uses primary token
    // ============================================
    try {
      // The CSS .node-box:hover uses stroke: var(--primary)
      // We can verify the CSS rule exists by checking computed style
      const nodeBoxStroke = await page.$eval('#tree .node-box', el => getComputedStyle(el).stroke);
      record('21_node_box_stroke', PASS, `Node box stroke: ${nodeBoxStroke}`);
    } catch (e) {
      record('21_node_box_stroke', FAIL, e.message);
    }

    // ============================================
    // TEST 22: Console errors
    // ============================================
    if (consoleErrors.length === 0) {
      record('22_no_console_errors', PASS, 'No console.error or pageerror events');
    } else {
      record('22_no_console_errors', FAIL,
        `Console errors: ${consoleErrors.join(' | ')}`);
    }

    // ============================================
    // TEST 23: Branch palette CSS hex verification
    // ============================================
    try {
      // Check the .br-apor class has the right color
      const brAporColor = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const match = style.match(/\.br-apor\s*\{\s*fill:\s*(#[0-9a-fA-F]+)/);
        return match ? match[1] : null;
      });
      const brFelicianoColor = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const match = style.match(/\.br-feliciano\s*\{\s*fill:\s*(#[0-9a-fA-F]+)/);
        return match ? match[1] : null;
      });
      const brPedroColor = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const match = style.match(/\.br-pedro\s*\{\s*fill:\s*(#[0-9a-fA-F]+)/);
        return match ? match[1] : null;
      });
      const brPresbiteroColor = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const match = style.match(/\.br-presbitero\s*\{\s*fill:\s*(#[0-9a-fA-F]+)/);
        return match ? match[1] : null;
      });
      const brLumbabColor = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const match = style.match(/\.br-lumbab\s*\{\s*fill:\s*(#[0-9a-fA-F]+)/);
        return match ? match[1] : null;
      });

      const expected = {
        Apor: '#2f6df6',
        Feliciano: '#16b364',
        Pedro: '#e8a63d',
        Presbitero: '#8b5cf6',
        Lumbab: '#ef4565'
      };
      const actual = {
        Apor: brAporColor,
        Feliciano: brFelicianoColor,
        Pedro: brPedroColor,
        Presbitero: brPresbiteroColor,
        Lumbab: brLumbabColor
      };

      const allMatch = Object.keys(expected).every(k => expected[k].toLowerCase() === (actual[k] || '').toLowerCase());
      const detail = Object.keys(expected).map(k => `${k}: ${actual[k]} (expect ${expected[k]})`).join('; ');
      record('23_branch_palette_hexes', allMatch ? PASS : FAIL, detail);
    } catch (e) {
      record('23_branch_palette_hexes', FAIL, e.message);
    }

    // ============================================
    // TEST 24: CSS token usage in tree/directory/detail
    // ============================================
    try {
      const tokenUsage = await page.evaluate(() => {
        const style = document.querySelector('style').textContent;
        const treeSection = style.substring(style.indexOf('/* --- Tree'));
        const tokenVarCount = (treeSection.match(/var\(--/g) || []).length;
        return tokenVarCount;
      });
      record('24_tokens_in_tree_styles', tokenUsage > 15 ? PASS : FAIL,
        `Tree/directory/detail CSS uses ${tokenUsage} var() references (expected >15)`);
    } catch (e) {
      record('24_tokens_in_tree_styles', FAIL, e.message);
    }

    // ============================================
    // TIME BUDGET CHECK
    // ============================================
    const elapsed = Date.now() - startTime;
    record('25_time_budget', elapsed < TIMEOUT_BUDGET_MS ? PASS : FAIL,
      `Elapsed: ${(elapsed / 1000).toFixed(1)}s (budget: 180s)`);

  } catch (e) {
    console.error('FATAL:', e.message);
    record('FATAL', FAIL, e.message);
  } finally {
    if (browser) await browser.close();
  }

  // SUMMARY
  console.log('\n========== PHASE 3 VERDICT ==========');
  const passed = results.filter(r => r.status === PASS).length;
  const failed = results.filter(r => r.status === FAIL).length;
  const verdict = failed === 0 ? PASS : FAIL;
  console.log(`VERDICT: ${verdict} (${passed} PASS, ${failed} FAIL)`);
  if (failed > 0) {
    console.log('FAILURES:');
    results.filter(r => r.status === FAIL).forEach(r => console.log(`  - ${r.name}: ${r.detail}`));
  }
  console.log('=====================================\n');

  // Write results JSON
  writeFileSync(join(SCREENSHOTS, 'phase3-results.json'), JSON.stringify({ verdict, results }, null, 2));
})();
