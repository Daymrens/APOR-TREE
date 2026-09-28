// Combined: static server + playwright test in one process
const http = require('http');
const fs = require('fs');
const path = require('path');

// Start a minimal static server on port 8765
const PUBLIC = path.join(__dirname, '..', '..', '..', 'public');
const server = http.createServer((req, res) => {
  const filePath = path.join(PUBLIC, req.url === '/' ? 'apor-family.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(8765, '127.0.0.1', async () => {
  console.log('Static server ready on :8765');
  try {
    await runTests();
  } catch (e) {
    console.error('FATAL: ' + e.message);
    console.error(e.stack);
  }
  server.close();
  process.exit(0);
});

async function runTests() {
  const { chromium } = require('playwright');
  const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'screenshots', 'apor-family-tree');
  const URL = 'http://127.0.0.1:8765/apor-family.html';
  const results = {};

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(800);

    // TEST 1: Header title font-size > 2rem at 1440px
    const h1 = page.locator('header.brand h1');
    await h1.waitFor({ state: 'visible', timeout: 4000 });
    const fontSize = await h1.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    results['header-oversized'] = fontSize > 32 ? 'PASS' : 'FAIL';
    console.log('TEST header-oversized: ' + fontSize + 'px (>32px=2rem) => ' + results['header-oversized']);

    // TEST 2: Tabs render as pills (border-radius: 999px)
    const tabForm = page.locator('#tab-form');
    const borderRadius = await tabForm.evaluate(el => getComputedStyle(el).borderRadius);
    results['tabs-pills'] = borderRadius === '999px' ? 'PASS' : 'FAIL';
    console.log('TEST tabs-pills: borderRadius=' + borderRadius + ' => ' + results['tabs-pills']);

    // TEST 3: Click Family Tree -> view-tree active, view-form inactive
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(250);
    const treeActive = await page.locator('#view-tree').evaluate(el => el.classList.contains('active'));
    const formInactive = await page.locator('#view-form').evaluate(el => !el.classList.contains('active'));
    results['switch-tree'] = (treeActive && formInactive) ? 'PASS' : 'FAIL';
    console.log('TEST switch-tree: view-tree=' + treeActive + ' form_inactive=' + formInactive + ' => ' + results['switch-tree']);

    // TEST 4: Click Member Form -> view-form active, view-tree inactive
    await page.locator('#tab-form').click();
    await page.waitForTimeout(250);
    const formActive = await page.locator('#view-form').evaluate(el => el.classList.contains('active'));
    const treeInactive = await page.locator('#view-tree').evaluate(el => !el.classList.contains('active'));
    results['switch-form'] = (formActive && treeInactive) ? 'PASS' : 'FAIL';
    console.log('TEST switch-form: view-form=' + formActive + ' tree_inactive=' + treeInactive + ' => ' + results['switch-form']);

    // TEST 5: Directory tab opens the panel
    await page.locator('#tab-dir').click();
    await page.waitForTimeout(300);
    const dirShow = await page.locator('#directory').evaluate(el => el.classList.contains('show'));
    results['directory-open'] = dirShow ? 'PASS' : 'FAIL';
    console.log('TEST directory-open: panel.show=' + dirShow + ' => ' + results['directory-open']);

    // TEST 6: No console errors
    results['no-console-errors'] = consoleErrors.length === 0 ? 'PASS' : 'FAIL';
    console.log('TEST no-console-errors: count=' + consoleErrors.length + ' => ' + results['no-console-errors']);
    if (consoleErrors.length > 0) {
      console.log('  Errors: ' + consoleErrors.join(' | '));
    }

    // TEST 7: Screenshot (hero + tabs + tree view)
    // Close directory, switch to tree
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(500);
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'redesign-phase1.png'),
      fullPage: false,
    });
    results['screenshot'] = 'PASS';
    console.log('TEST screenshot: saved => PASS');

  } catch (e) {
    console.error('TEST ERROR: ' + e.message);
    results['error'] = 'FAIL: ' + e.message;
  }

  await browser.close();

  // Summary
  console.log('\n=== PHASE 1 E2E SUMMARY ===');
  const allPass = Object.values(results).every(v => v === 'PASS');
  for (const [k, v] of Object.entries(results)) {
    console.log('  ' + k + ': ' + v);
  }
  console.log('VERDICT: ' + (allPass ? 'PASS' : 'FAIL'));
}
