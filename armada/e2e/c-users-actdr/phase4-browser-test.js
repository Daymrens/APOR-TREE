// Phase 4 Browser E2E: Click a node, verify detail panel opens with 8 fields
// Serves the static HTML file directly (bypassing Next.js auth gate)
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  const htmlPath = path.join(__dirname, '..', '..', '..', 'public', 'apor-family.html');
  const screenshotDir = path.join(__dirname, '..', '..', '..', 'armada', 'screenshots', 'apor-family-tree');
  const screenshotPath = path.join(screenshotDir, 'phase4.png');

  // Start a simple static file server on a random port
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Static server on port ${port}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to page...');
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 15000 });
  console.log('Page loaded.');
  await page.waitForTimeout(1000);

  // Switch to tree view
  console.log('Switching to tree view...');
  await page.click('#tab-tree');
  await page.waitForTimeout(1500);

  // Verify SVG tree rendered
  const svgInfo = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    return {
      childCount: svg?.children?.length || 0,
      width: svg?.getAttribute('width'),
      height: svg?.getAttribute('height'),
      clickableGroups: svg?.querySelectorAll('g[style*="cursor"]').length || 0
    };
  });
  console.log(`SVG: children=${svgInfo.childCount}, w=${svgInfo.width}, h=${svgInfo.height}, clickable=${svgInfo.clickableGroups}`);

  // Click the first node
  console.log('Clicking first node...');
  const result = await page.evaluate(() => {
    const g = document.querySelector('svg.tree g[style*="cursor"]');
    if (!g) return { ok: false, reason: 'no clickable group found', name: '', meta: '', rows: {} };
    g.dispatchEvent(new Event('click', { bubbles: true }));

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        const d = document.getElementById('detail');
        const visible = d && d.classList.contains('show');
        const name = document.getElementById('d-name')?.textContent || '';
        const meta = document.getElementById('d-meta')?.textContent || '';
        const dts = document.querySelectorAll('#d-body dt');
        const dds = document.querySelectorAll('#d-body dd');
        const rows = {};
        for (let i = 0; i < dts.length; i++) {
          rows[dts[i].textContent] = dds[i]?.textContent || '';
        }
        resolve({ ok: visible, name, meta, rows });
      });
    });
  });

  console.log('\n--- Detail Panel Result ---');
  console.log(`Detail opened: ${result.ok}`);
  console.log(`Name: ${result.name}`);
  console.log(`Living/Deceased: ${result.meta}`);
  for (const [k, v] of Object.entries(result.rows || {})) {
    console.log(`${k}: ${v}`);
  }

  // Check all 8 expected fields
  let allPresent = true;
  const expectedLabels = ['Nickname', 'Branch', 'Generation', 'Spouse', 'Parents', 'Note'];
  for (const label of expectedLabels) {
    const found = label in (result.rows || {});
    console.log(`Field "${label}": ${found ? 'PRESENT' : 'MISSING'}`);
    if (!found) allPresent = false;
  }
  const hasName = (result.name || '').length > 0;
  const hasMeta = (result.meta || '').includes('Living') || (result.meta || '').includes('Deceased');
  console.log(`Field "name": ${hasName ? 'PRESENT' : 'MISSING'}`);
  console.log(`Field "living/deceased": ${hasMeta ? 'PRESENT' : 'MISSING'}`);
  if (!hasName || !hasMeta) allPresent = false;

  // Capture screenshot with detail panel open
  console.log(`\nCapturing screenshot to ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved.');

  // Report console errors
  if (consoleErrors.length > 0) {
    console.log(`\nConsole errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`  ERROR: ${e}`));
  } else {
    console.log('\nNo console errors detected.');
  }

  console.log(`\n=== BROWSER VERDICT: ${allPresent && result.ok ? 'PASS' : 'FAIL'} ===`);

  await browser.close();
  server.close();
  process.exit(allPresent && result.ok ? 0 : 1);
})();
