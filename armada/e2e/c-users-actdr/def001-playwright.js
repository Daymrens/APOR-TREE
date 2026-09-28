// DEF-001: Playwright E2E retest — placeholder visible on initial load
// Time budget: launch 15000, navigation 10000, defaultTimeout 5000, total < 4 min
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const ROOT = path.resolve(__dirname, '..', '..', '..', 'public');
const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', '..', 'screenshots', 'apor-family-directory');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

(async () => {
  // Ensure screenshot directory exists
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Start static file server
  const server = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let fp = path.join(ROOT, req.url === '/' ? '/index.html' : req.url);
      const ext = path.extname(fp);
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    s.listen(PORT, () => resolve(s));
  });
  console.log('Server started on port ' + PORT);

  let browser;
  try {
    browser = await chromium.launch({ headless: true, timeout: 15000 });

    const context = await browser.newContext();
    context.setDefaultTimeout(5000);
    const page = await context.newPage();

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Navigate with bounded timeout
    await page.goto('http://localhost:' + PORT + '/apor-family.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('Page loaded');

    // Check 1: placeholder on initial load (NO language switch)
    const placeholder = await page.getAttribute('#dirSearch', 'placeholder');
    console.log('Initial placeholder: "' + placeholder + '"');

    if (placeholder === 'Search name or nickname...') {
      console.log('PASS: placeholder correct on initial load');
    } else {
      console.error('FAIL: placeholder incorrect, got "' + placeholder + '"');
    }

    // Screenshot showing the placeholder
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'def-001-retest.png'), fullPage: false });
    console.log('Screenshot: armada/screenshots/apor-family-directory/def-001-retest.png');

    // Check 2: no console errors
    if (consoleErrors.length > 0) {
      console.error('Console errors: ' + consoleErrors.join('; '));
    } else {
      console.log('No console errors');
    }

    // Regression: open directory and search 'apor'
    await page.click('button:has-text("Family Tree")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Directory")');
    await page.waitForTimeout(500);

    const dirVisible = await page.isVisible('#directory.show');
    console.log('Directory visible after click: ' + dirVisible);

    // Count rows before search
    const rowsBefore = await page.locator('#dirList .dir-row').count();
    console.log('Rows before search: ' + rowsBefore);

    // Type 'apor' in search
    await page.fill('#dirSearch', 'apor');
    await page.waitForTimeout(500);

    const rowsAfter = await page.locator('#dirList .dir-row').count();
    console.log('Rows after search "apor": ' + rowsAfter);

    if (rowsBefore > 0 && rowsAfter > 0 && rowsAfter < rowsBefore) {
      console.log('PASS: regression search filters rows correctly');
    } else {
      console.error('FAIL: regression search issue');
    }

    // Verdict
    const allPass = (placeholder === 'Search name or nickname...') && (rowsBefore > 0) && (rowsAfter > 0) && (rowsAfter < rowsBefore);
    console.log('\nVERDICT: ' + (allPass ? 'PASS' : 'FAIL'));

  } catch (e) {
    console.error('ERROR: ' + e.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})();
