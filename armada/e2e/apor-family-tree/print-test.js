const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const page = await context.newPage();
  
  try {
    // Load the page
    console.log('=== Loading page for print test ===');
    await page.goto('file://' + path.resolve('D:\\PROJECTS\\FamilyReunion\\public\\apor-family.html'), { 
      waitUntil: 'load',
      timeout: 15000 
    });
    
    // Switch to tree view first
    console.log('=== Switching to tree view ===');
    await page.click('#tab-tree');
    await page.waitForTimeout(1000);
    
    // Emulate print media
    console.log('=== Emulating print media ===');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    
    // Check that chrome elements are hidden
    const langBarHidden = await page.evaluate(() => {
      const langBar = document.querySelector('.lang-bar');
      return langBar ? window.getComputedStyle(langBar).display === 'none' : true;
    });
    
    const tabsHidden = await page.evaluate(() => {
      const tabs = document.querySelector('nav.tabs');
      return tabs ? window.getComputedStyle(tabs).display === 'none' : true;
    });
    
    const toolbarHidden = await page.evaluate(() => {
      const toolbar = document.querySelector('.tree-toolbar');
      return toolbar ? window.getComputedStyle(toolbar).display === 'none' : true;
    });
    
    const detailHidden = await page.evaluate(() => {
      const detail = document.querySelector('.detail');
      return detail ? window.getComputedStyle(detail).display === 'none' : true;
    });
    
    const directoryHidden = await page.evaluate(() => {
      const directory = document.querySelector('.directory');
      return directory ? window.getComputedStyle(directory).display === 'none' : true;
    });
    
    console.log('Print media element visibility:');
    console.log('  lang-bar hidden:', langBarHidden);
    console.log('  nav.tabs hidden:', tabsHidden);
    console.log('  tree-toolbar hidden:', toolbarHidden);
    console.log('  detail hidden:', detailHidden);
    console.log('  directory hidden:', directoryHidden);
    
    // Check that tree view is visible
    const treeVisible = await page.evaluate(() => {
      const treeView = document.getElementById('view-tree');
      return treeView ? window.getComputedStyle(treeView).display !== 'none' : false;
    });
    
    console.log('  tree-view visible:', treeVisible);
    
    // Capture print screenshot
    await page.screenshot({ 
      path: 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree\\redesign-final-print.png',
      fullPage: true
    });
    console.log('Print screenshot captured');
    
    // Verify all chrome is hidden
    if (!langBarHidden || !tabsHidden || !toolbarHidden || !detailHidden || !directoryHidden) {
      console.error('ERROR: Some chrome elements not hidden in print mode');
      process.exit(1);
    }
    
    if (!treeVisible) {
      console.error('ERROR: Tree view not visible in print mode');
      process.exit(1);
    }
    
    console.log('\n=== Print media verification PASSED ===');
    
  } catch (err) {
    console.error('ERROR during print test:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
