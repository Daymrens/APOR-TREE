// Phase 3 screenshot capture and interactive verification
const { chromium } = require('playwright');
const path = require('path');

const screenshotDir = path.resolve(__dirname, '../../screenshots/apor-family-tree');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Navigate to the local file
  const filePath = path.resolve(__dirname, '../../../public/apor-family.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });

  // Switch to tree view
  await page.click('#tab-tree');
  await page.waitForTimeout(1000); // wait for renderTree() to complete

  // Verify tree SVG exists and has content
  const svgExists = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg && svg.children.length > 0;
  });
  console.log('Tree SVG has content:', svgExists);

  // Count nodes and edges
  const counts = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    const nodes = svg.querySelectorAll('g[style*="cursor"]');
    const paths = svg.querySelectorAll('path.edge');
    const branchStrips = svg.querySelectorAll('[class^="br-"]');
    return { nodes: nodes.length, paths: paths.length, strips: branchStrips.length };
  });
  console.log('Rendered nodes:', counts.nodes);
  console.log('Rendered edges:', counts.paths);
  console.log('Branch color strips:', counts.strips);

  // Verify branch colors are applied
  const branchClasses = await page.evaluate(() => {
    const strips = document.querySelectorAll('[class^="br-"]');
    const classes = new Set();
    strips.forEach(s => classes.add(s.getAttribute('class')));
    return [...classes];
  });
  console.log('Branch classes found:', branchClasses);

  // Take full tree screenshot
  await page.screenshot({ path: path.join(screenshotDir, 'phase3.png'), fullPage: false });
  console.log('Screenshot saved: armada/screenshots/apor-family-tree/phase3.png');

  // Test zoom buttons exist and are clickable
  const zoomButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll('.zoom-btn');
    return btns.length;
  });
  console.log('Zoom buttons found:', zoomButtons);

  // Click zoom in and verify scale changes
  const scaleBefore = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg.getAttribute('width');
  });
  console.log('SVG width before zoom:', scaleBefore);

  // Click zoom in button
  await page.click('.zoom-btn:nth-child(3)'); // + button
  await page.waitForTimeout(200);

  const scaleAfter = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg.getAttribute('width');
  });
  console.log('SVG width after zoom in:', scaleAfter);
  console.log('Zoom changed view:', scaleBefore !== scaleAfter);

  // Take zoomed-in screenshot
  await page.screenshot({ path: path.join(screenshotDir, 'phase3-zoomed.png'), fullPage: false });
  console.log('Screenshot saved: armada/screenshots/apor-family-tree/phase3-zoomed.png');

  // Click zoom out to test clamping
  await page.click('.zoom-btn:nth-child(3)'); // + again
  await page.waitForTimeout(100);
  await page.click('.zoom-btn:nth-child(3)'); // + again
  await page.waitForTimeout(100);

  // Reset zoom
  await page.click('.zoom-btn:nth-child(2)'); // 100% reset
  await page.waitForTimeout(200);

  const scaleReset = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    return svg.getAttribute('width');
  });
  console.log('SVG width after reset:', scaleReset);
  console.log('Reset brought back to original:', scaleReset === scaleBefore);

  // Test drag-to-pan
  const treeScroll = await page.$('#treeScroll');
  const box = await treeScroll.boundingBox();

  // Verify treeScroll has touch-action: none (for drag-to-pan)
  const touchAction = await page.evaluate(() => {
    const sc = document.getElementById('treeScroll');
    return window.getComputedStyle(sc).touchAction;
  });
  console.log('treeScroll touch-action:', touchAction);

  // Perform a drag
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 200, { steps: 5 });
  await page.mouse.up();
  console.log('Drag interaction performed');

  // Verify panning class was toggled (it gets added then removed)
  const hasPanningClass = await page.evaluate(() => {
    return document.getElementById('treeScroll').classList.contains('panning');
  });
  console.log('Panning class removed after drag release:', !hasPanningClass);

  // Check that orthogonal edges are present in the rendered SVG
  const edgeTypes = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    const edges = svg.querySelectorAll('path.edge');
    const types = new Set();
    edges.forEach(e => {
      const cls = e.getAttribute('class');
      if (cls.includes('marriage')) types.add('marriage');
      if (cls.includes('parent')) types.add('parent');
      if (cls.includes('bus')) types.add('bus');
    });
    return [...types];
  });
  console.log('Edge types rendered:', edgeTypes);

  // Verify all paths use only M and L (no curves in rendered SVG)
  const curvedPaths = await page.evaluate(() => {
    const svg = document.getElementById('tree');
    const paths = svg.querySelectorAll('path.edge');
    let curved = 0;
    paths.forEach(p => {
      const d = p.getAttribute('d');
      // Check for curve commands C, Q, S, A (not inside ${} templates)
      if (/[QqCcSsAa]/.test(d)) curved++;
    });
    return { total: paths.length, curved };
  });
  console.log('Rendered edge paths total:', curvedPaths.total);
  console.log('Rendered edge paths with curves:', curvedPaths.curved);
  console.log('All rendered edges rectilinear:', curvedPaths.curved === 0);

  // Final full-page screenshot showing complete tree
  await page.screenshot({ path: path.join(screenshotDir, 'phase3-final.png'), fullPage: true });
  console.log('Screenshot saved: armada/screenshots/apor-family-tree/phase3-final.png');

  await browser.close();
  console.log('\n=== SCREENSHOT CAPTURE COMPLETE ===');
})();
