// Phase 3 supplementary: verify branch colors computationally and take wide screenshot
const { chromium } = require('playwright');
const path = require('path');
const screenshotDir = path.resolve(__dirname, '../../screenshots/apor-family-tree');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 2400, height: 1200 } });
  const filePath = path.resolve(__dirname, '../../../public/apor-family.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
  await page.click('#tab-tree');
  await page.waitForTimeout(1000);

  // Verify all branch colors appear as computed fill values on rendered strips
  const branchColors = await page.evaluate(() => {
    const strips = document.querySelectorAll('[class^="br-"]');
    const colorMap = {};
    strips.forEach(s => {
      const cls = s.getAttribute('class');
      const computed = window.getComputedStyle(s).fill;
      if (!colorMap[cls]) colorMap[cls] = { count: 0, fill: computed };
      colorMap[cls].count++;
    });
    return colorMap;
  });
  console.log('Branch color verification:');
  Object.entries(branchColors).forEach(([cls, info]) => {
    console.log('  ' + cls + ': fill=' + info.fill + ' count=' + info.count);
  });

  // Verify marriage edges are dashed rose
  const marriageInfo = await page.evaluate(() => {
    const edges = document.querySelectorAll('path.edge.marriage');
    if (edges.length === 0) return null;
    const first = edges[0];
    const computed = window.getComputedStyle(first);
    return { count: edges.length, stroke: computed.stroke, dasharray: computed.strokeDasharray };
  });
  console.log('Marriage edges:', JSON.stringify(marriageInfo));

  // Verify bus and parent edges
  const edgeInfo = await page.evaluate(() => {
    return {
      bus: document.querySelectorAll('path.edge.bus').length,
      parent: document.querySelectorAll('path.edge.parent').length,
      marriage: document.querySelectorAll('path.edge.marriage').length,
    };
  });
  console.log('Edge counts:', JSON.stringify(edgeInfo));

  // Verify all path d attributes use only M and L commands (no curves)
  const pathCheck = await page.evaluate(() => {
    const paths = document.querySelectorAll('path.edge');
    let allRectilinear = true;
    const samples = [];
    paths.forEach(p => {
      const d = p.getAttribute('d');
      if (/[QqCcSsAa]/.test(d)) {
        allRectilinear = false;
        samples.push(d.substring(0, 80));
      }
    });
    return { total: paths.length, allRectilinear, curvedSamples: samples };
  });
  console.log('Path rectilinearity:', JSON.stringify(pathCheck));

  // Take wide screenshot
  await page.screenshot({ path: path.join(screenshotDir, 'phase3-wide.png'), fullPage: false });
  console.log('Wide screenshot saved: armada/screenshots/apor-family-tree/phase3-wide.png');

  await browser.close();
})();
