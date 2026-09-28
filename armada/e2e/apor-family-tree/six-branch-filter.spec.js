const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  const context = await browser.newContext();
  context.setDefaultTimeout(4000);
  
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Load the page
    console.log('=== Loading page ===');
    await page.goto('file://' + path.resolve('D:\\PROJECTS\\FamilyReunion\\public\\apor-family.html'), { 
      waitUntil: 'load',
      timeout: 15000 
    });
    await page.waitForTimeout(1000); // Wait for rendering
    
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.error('ERROR: Console errors detected on load:');
      consoleErrors.forEach(err => console.error('  ' + err));
      process.exit(1);
    } else {
      console.log('No console errors on load (good)');
    }
    
    // Test 1: Click Tree tab and verify chip list
    console.log('\n=== Test 1: Tree tab and chip list ===');
    
    // Click the Tree tab
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    
    // Verify chips container exists
    const chipsContainer = await page.$('#filterChips');
    if (!chipsContainer) {
      console.error('ERROR: Filter chips container not found');
      process.exit(1);
    }
    
    // Get all chip elements
    const chips = await page.$$('#filterChips .filter-chip');
    console.log('Number of chips found:', chips.length);
    
    // Get chip text in order
    const chipTexts = [];
    for (const chip of chips) {
      const text = await chip.textContent();
      chipTexts.push(text.trim());
    }
    console.log('Chip texts in order:', chipTexts);
    
    // Expected exact chip list
    const expectedChips = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    
    // Verify exact match
    const chipsMatch = JSON.stringify(chipTexts) === JSON.stringify(expectedChips);
    if (!chipsMatch) {
      console.error('ERROR: Chip list does not match expected order');
      console.error('Expected:', expectedChips);
      console.error('Actual:', chipTexts);
      process.exit(1);
    } else {
      console.log('PASS: Chip list matches expected order');
    }
    
    // Verify no forbidden chips
    const forbiddenChips = ['Apor', 'Presbitero', 'Lumbab', 'Antonio', 'Jose', 'Rosa'];
    const foundForbidden = chipTexts.filter(chip => forbiddenChips.includes(chip));
    if (foundForbidden.length > 0) {
      console.error('ERROR: Found forbidden chips:', foundForbidden);
      process.exit(1);
    } else {
      console.log('PASS: No forbidden chips found');
    }
    
    // Test 2: Legend shows 6 color entries
    console.log('\n=== Test 2: Legend with 6 color entries ===');
    
    // Find legend container
    const legend = await page.$('#legend');
    if (!legend) {
      console.error('ERROR: Legend container not found');
      process.exit(1);
    }
    
    // Get legend items - each span inside #legend has a sw color swatch + text
    const legendSpans = await page.$$('#legend > span');
    console.log('Number of legend spans:', legendSpans.length);
    
    if (legendSpans.length !== 6) {
      console.error('ERROR: Expected 6 legend spans, got', legendSpans.length);
      process.exit(1);
    }
    
    // Verify legend item texts match branch names (text content includes swatch but text() gives the text)
    const legendTexts = [];
    for (const span of legendSpans) {
      const text = await span.textContent();
      legendTexts.push(text.trim());
    }
    console.log('Legend texts:', legendTexts);
    
    const expectedLegend = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
    const legendMatch = JSON.stringify(legendTexts) === JSON.stringify(expectedLegend);
    if (!legendMatch) {
      console.error('ERROR: Legend items do not match expected branch names');
      console.error('Expected:', expectedLegend);
      console.error('Actual:', legendTexts);
      process.exit(1);
    } else {
      console.log('PASS: Legend shows 6 correct branch names');
    }
    
    // Test 3: Click "Panfilo" chip and count nodes
    console.log('\n=== Test 3: Panfilo branch filter ===');
    
    // Click Panfilo chip
    await page.click('#filterChips .filter-chip:nth-child(2)'); // Panfilo is second
    await page.waitForTimeout(500);
    
    // Count visible node groups (g[style*="cursor"])
    const panfiloNodes = await page.$$('g[style*="cursor"]');
    console.log('Panfilo branch node count:', panfiloNodes.length);
    
    // Expected 17 nodes (Panfilo + Antonia + 8 kids + 7 in-married spouses)
    if (panfiloNodes.length !== 17) {
      console.error('ERROR: Expected 17 nodes in Panfilo branch, got', panfiloNodes.length);
      process.exit(1);
    } else {
      console.log('PASS: Panfilo branch has 17 nodes');
    }
    
    // Verify Rose Ursal (spouse of Ricardenel) is visible
    const roseVisible = await page.evaluate(() => {
      const allNodes = document.querySelectorAll('g[style*="cursor"]');
      for (const node of allNodes) {
        const text = node.textContent || '';
        if (text.includes('Rose') || text.includes('Ursal')) {
          return true;
        }
      }
      return false;
    });
    
    if (!roseVisible) {
      console.error('ERROR: Rose Ursal (spouse of Ricardenel) not visible in Panfilo filter');
      process.exit(1);
    } else {
      console.log('PASS: Rose Ursal is visible in Panfilo filter');
    }
    
    // Test 4: Click "Consorcia" → 45 nodes, "Pedro" → 21 nodes, "All" → 137 nodes
    console.log('\n=== Test 4: Other branch filters ===');
    
    // Click Consorcia chip (7th chip)
    await page.click('#filterChips .filter-chip:nth-child(7)');
    await page.waitForTimeout(500);
    
    const consorciaNodes = await page.$$('g[style*="cursor"]');
    console.log('Consorcia branch node count:', consorciaNodes.length);
    
    if (consorciaNodes.length !== 45) {
      console.error('ERROR: Expected 45 nodes in Consorcia branch, got', consorciaNodes.length);
      process.exit(1);
    } else {
      console.log('PASS: Consorcia branch has 45 nodes');
    }
    
    // Click Pedro chip (4th chip)
    await page.click('#filterChips .filter-chip:nth-child(4)');
    await page.waitForTimeout(500);
    
    const pedroNodes = await page.$$('g[style*="cursor"]');
    console.log('Pedro branch node count:', pedroNodes.length);
    
    if (pedroNodes.length !== 21) {
      console.error('ERROR: Expected 21 nodes in Pedro branch, got', pedroNodes.length);
      process.exit(1);
    } else {
      console.log('PASS: Pedro branch has 21 nodes');
    }
    
    // Click All chip (1st chip)
    await page.click('#filterChips .filter-chip:nth-child(1)');
    await page.waitForTimeout(500);
    
    const allNodes = await page.$$('g[style*="cursor"]');
    console.log('All branches node count:', allNodes.length);
    
    if (allNodes.length !== 137) {
      console.error('ERROR: Expected 137 nodes in All filter, got', allNodes.length);
      process.exit(1);
    } else {
      console.log('PASS: All filter shows 137 nodes');
    }
    
    // Test 5: Root couple visibility
    console.log('\n=== Test 5: Root couple visibility ===');
    
    // Test with All filter - root couple should be visible
    await page.click('#filterChips .filter-chip:nth-child(1)'); // All
    await page.waitForTimeout(500);
    
    // Check for Gerbacio and Marciana as separate nodes (they are separate people)
    const rootVisibleWithAll = await page.evaluate(() => {
      const allNodes = document.querySelectorAll('g[style*="cursor"]');
      let foundGerbacio = false;
      let foundMarciana = false;
      for (const node of allNodes) {
        const text = node.textContent || '';
        if (text.includes('Gerbacio')) foundGerbacio = true;
        if (text.includes('Marciana')) foundMarciana = true;
      }
      return foundGerbacio && foundMarciana;
    });
    
    if (!rootVisibleWithAll) {
      console.error('ERROR: Root couple (Gerbacio/Marciana) not visible with All filter');
      process.exit(1);
    } else {
      console.log('PASS: Root couple visible with All filter');
    }
    
    // Test with Panfilo filter - root couple should NOT be visible
    await page.click('#filterChips .filter-chip:nth-child(2)'); // Panfilo
    await page.waitForTimeout(500);
    
    const rootVisibleWithPanfilo = await page.evaluate(() => {
      const allNodes = document.querySelectorAll('g[style*="cursor"]');
      let foundGerbacio = false;
      let foundMarciana = false;
      for (const node of allNodes) {
        const text = node.textContent || '';
        if (text.includes('Gerbacio')) foundGerbacio = true;
        if (text.includes('Marciana')) foundMarciana = true;
      }
      return foundGerbacio || foundMarciana;
    });
    
    if (rootVisibleWithPanfilo) {
      console.error('ERROR: Root couple (Gerbacio/Marciana) visible with Panfilo filter - should be hidden');
      process.exit(1);
    } else {
      console.log('PASS: Root couple hidden with Panfilo filter');
    }
    
    // Test 6: Branch colors are different
    console.log('\n=== Test 6: Branch node colors ===');
    
    // Get color of first Panfilo node's strip rect (the inner rect, not the g)
    await page.click('#filterChips .filter-chip:nth-child(2)'); // Panfilo
    await page.waitForTimeout(500);
    
    const panfiloColor = await page.evaluate(() => {
      const g = document.querySelector('g[style*="cursor"]');
      if (g) {
        // The strip rect is the 2nd child (index 1) of the g
        const strip = g.querySelectorAll('rect')[1];
        if (strip) {
          return strip.style.fill || window.getComputedStyle(strip).fill;
        }
      }
      return null;
    });
    
    // Get color of first Consorcia node's strip rect
    await page.click('#filterChips .filter-chip:nth-child(7)'); // Consorcia
    await page.waitForTimeout(500);
    
    const consorciaColor = await page.evaluate(() => {
      const g = document.querySelector('g[style*="cursor"]');
      if (g) {
        const strip = g.querySelectorAll('rect')[1];
        if (strip) {
          return strip.style.fill || window.getComputedStyle(strip).fill;
        }
      }
      return null;
    });
    
    console.log('Panfilo strip color:', panfiloColor);
    console.log('Consorcia strip color:', consorciaColor);
    
    if (panfiloColor === consorciaColor) {
      console.error('ERROR: Panfilo and Consorcia nodes have the same color');
      process.exit(1);
    } else {
      console.log('PASS: Panfilo and Consorcia nodes have different colors');
    }
    
    // Test 7: Directory unchanged and search works
    console.log('\n=== Test 7: Directory functionality ===');
    
    // Click Directory tab (3rd tab)
    await page.click('#tab-dir');
    await page.waitForTimeout(500);
    
    // Verify directory view is visible
    const directory = await page.$('#view-dir');
    if (!directory) {
      console.error('ERROR: Directory view not found');
      process.exit(1);
    }
    
    // Verify 6 root entries exist in dirList
    const rootEntries = await page.$$('#dirList .dir-row.dir-branch');
    console.log('Directory root branch entries:', rootEntries.length);
    
    if (rootEntries.length !== 6) {
      console.error('ERROR: Expected 6 root directory branch entries, got', rootEntries.length);
      process.exit(1);
    }
    
    // Verify root entry names
    const rootNames = [];
    for (const entry of rootEntries) {
      const nameEl = await entry.$('.dir-name');
      if (nameEl) {
        const text = await nameEl.textContent();
        // Extract just the first name part (before any & or em)
        const clean = text.split('&')[0].replace(/\(.*?\)/g, '').trim();
        rootNames.push(clean);
      }
    }
    console.log('Root directory names:', rootNames);
    
    const expectedRoots = ['Panfilo Apor', 'Feliciano', 'Pedro Lumbab', 'Pablo Apor', 'Purificasion Apor', 'Consorcia Apor'];
    // Just check that the expected roots are all present
    const allPresent = expectedRoots.every(name => rootNames.some(rn => rn.includes(name.split(' ')[0])));
    if (!allPresent) {
      console.error('ERROR: Root directory names do not match expected');
      console.error('Expected roots:', expectedRoots);
      console.error('Actual names:', rootNames);
      process.exit(1);
    } else {
      console.log('PASS: All 6 root directory entries present');
    }
    
    // Test search functionality
    const searchInput = await page.$('#dirSearch');
    if (!searchInput) {
      console.error('ERROR: Search input not found');
      process.exit(1);
    }
    
    await searchInput.fill('Panfilo');
    await page.waitForTimeout(300);
    
    // Check filtered results
    const filteredEntries = await page.$$('#dirList .dir-row');
    console.log('Filtered directory entries after search "Panfilo":', filteredEntries.length);
    
    if (filteredEntries.length < 1) {
      console.error('ERROR: Search returned no results for "Panfilo"');
      process.exit(1);
    } else {
      console.log('PASS: Search works - found results for "Panfilo"');
    }
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
    
    // Test 8: Take screenshot
    console.log('\n=== Test 8: Screenshot ===');
    
    // Switch to Tree tab with Panfilo filter
    await page.click('#tab-tree');
    await page.waitForTimeout(500);
    await page.click('#filterChips .filter-chip:nth-child(2)'); // Panfilo
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree\\qa-six-branches.png',
      fullPage: false
    });
    console.log('Screenshot captured: qa-six-branches.png');
    
    // Final console error check
    if (consoleErrors.length > 0) {
      console.error('ERROR: Console errors detected during testing:');
      consoleErrors.forEach(err => console.error('  ' + err));
      process.exit(1);
    }
    
    console.log('\n=== All 8 tests PASSED ===');
    process.exit(0);
    
  } catch (err) {
    console.error('ERROR during Playwright execution:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();