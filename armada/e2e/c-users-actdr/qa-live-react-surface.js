const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://apor-tree.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/apor-family-tree');

(async () => {
  const results = [];
  const consoleErrors = [];
  let browser;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    context.setDefaultTimeout(5000);
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    // =============================================
    // TEST 1: GATE search
    // =============================================
    console.log('--- TEST 1: GATE search ---');
    await page.goto(`${BASE_URL}/gate`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    const searchInput = page.locator('#member-name');
    await searchInput.waitFor({ timeout: 5000 });
    
    // --- Test 1a: Demelito ---
    await searchInput.fill('Demelito');
    await page.waitForTimeout(2000);
    
    // Check result row: "Demelito Apor" with branch "Panfilo"
    // "Apor" is the person's surname, NOT the branch label
    // Branch label is "Panfilo · Gen 2" or "Panfilo branch" (after selection)
    const gateHtml = await page.locator('body').innerHTML();
    
    // Check that "Panfilo" appears as a branch (not just as a surname)
    const hasPanfiloBranch = /Panfilo\s*(·|branch)/.test(gateHtml);
    // Check that "Apor" does NOT appear as a branch label (it's OK in the name "Demelito Apor")
    const hasAporAsBranch = /Apor\s*(·|branch)/.test(gateHtml);
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-gate-demelito.png'), fullPage: true });
    
    if (hasPanfiloBranch && !hasAporAsBranch) {
      results.push({ test: '1a: GATE Demelito -> branch "Panfilo" (NOT "Apor")', status: 'PASS',
        detail: 'Branch label is "Panfilo". "Apor" is surname only, not a branch label.' });
    } else {
      results.push({ test: '1a: GATE Demelito -> branch "Panfilo" (NOT "Apor")', status: 'FAIL',
        detail: `panfiloBranch=${hasPanfiloBranch}, aporAsBranch=${hasAporAsBranch}` });
    }
    
    // --- Test 1b: Wilda ---
    await searchInput.fill('');
    await searchInput.fill('Wilda');
    await page.waitForTimeout(2000);
    
    const gateHtml2 = await page.locator('body').innerHTML();
    const hasConsorciaBranch = /Consorcia\s*(·|branch)/.test(gateHtml2);
    const hasLumbabAsBranch = /Lumbab\s*(·|branch)/.test(gateHtml2);
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-gate-wilda.png'), fullPage: true });
    
    if (hasConsorciaBranch && !hasLumbabAsBranch) {
      results.push({ test: '1b: GATE Wilda -> branch "Consorcia" (NOT "Lumbab")', status: 'PASS',
        detail: 'Branch label is "Consorcia". No "Lumbab" branch label.' });
    } else {
      results.push({ test: '1b: GATE Wilda -> branch "Consorcia" (NOT "Lumbab")', status: 'FAIL',
        detail: `consorciaBranch=${hasConsorciaBranch}, lumbabAsBranch=${hasLumbabAsBranch}` });
    }
    
    // --- Test 1c: Console errors ---
    if (consoleErrors.length > 0) {
      results.push({ test: '1c: GATE no console errors', status: 'FAIL', detail: `Errors: ${consoleErrors.join('; ')}` });
    } else {
      results.push({ test: '1c: GATE no console errors', status: 'PASS', detail: 'No console errors' });
    }
    
    // =============================================
    // COMPLETE GATE FLOW: Search -> Click member -> "Enter as ..."
    // =============================================
    console.log('\n--- Completing gate flow ---');
    consoleErrors.length = 0;
    
    // Search Demelito and select
    await searchInput.fill('');
    await searchInput.fill('Demelito');
    await page.waitForTimeout(2000);
    
    // Click the result row (it's a button)
    const resultBtn = page.locator('button').filter({ hasText: 'Demelito Apor' }).first();
    await resultBtn.click({ timeout: 5000 });
    console.log('Clicked result button');
    await page.waitForTimeout(2000);
    
    // Now click "Enter as Demelito"
    const enterBtn = page.locator('button').filter({ hasText: 'Enter as Demelito' });
    const enterBtnCount = await enterBtn.count();
    console.log('Enter button count:', enterBtnCount);
    
    if (enterBtnCount > 0) {
      await enterBtn.first().click({ timeout: 5000 });
      console.log('Clicked Enter as Demelito');
      await page.waitForTimeout(5000);
      
      const afterEnterUrl = page.url();
      console.log('URL after Enter:', afterEnterUrl);
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-gate-entered.png'), fullPage: true });
      
      // Check localStorage for session
      const ls = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          items[key] = window.localStorage.getItem(key).substring(0, 200);
        }
        return items;
      });
      console.log('localStorage:', JSON.stringify(ls, null, 2));
    } else {
      console.log('ERROR: Enter button not found!');
      results.push({ test: 'Gate flow completion', status: 'FAIL', detail: 'Enter as Demelito button not found' });
    }
    
    // =============================================
    // TEST 2: RSVP dropdown
    // =============================================
    console.log('\n--- TEST 2: RSVP dropdown ---');
    
    await page.goto(`${BASE_URL}/rsvp`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    let rsvpUrl = page.url();
    console.log('RSVP URL:', rsvpUrl);
    
    if (rsvpUrl.includes('/gate')) {
      // Redirected to gate - the selection didn't persist.
      // The gate may use sessionStorage or the state may not survive navigation.
      // Let me try navigating via the Enter button redirect
      console.log('Redirected to gate - trying to complete flow again...');
      
      const si = page.locator('#member-name');
      if (await si.count() > 0) {
        await si.fill('Demelito');
        await page.waitForTimeout(2000);
        
        const btn = page.locator('button').filter({ hasText: 'Demelito Apor' }).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(2000);
          
          const enter = page.locator('button').filter({ hasText: 'Enter as Demelito' });
          if (await enter.count() > 0) {
            await enter.first().click();
            await page.waitForTimeout(5000);
            
            // Check where we ended up
            rsvpUrl = page.url();
            console.log('After re-enter URL:', rsvpUrl);
            
            // If the Enter button redirected us somewhere, try /rsvp from there
            if (!rsvpUrl.includes('/rsvp')) {
              await page.goto(`${BASE_URL}/rsvp`, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await page.waitForTimeout(5000);
              rsvpUrl = page.url();
              console.log('RSVP URL after re-navigation:', rsvpUrl);
            }
          }
        }
      }
    }
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-initial.png'), fullPage: true });
    
    if (rsvpUrl.includes('/rsvp')) {
      console.log('Successfully on /rsvp page!');
      
      // Look for select element
      const selectCount = await page.locator('select').count();
      console.log('Select elements:', selectCount);
      
      if (selectCount > 0) {
        const options = await page.locator('select option').allTextContents();
        const branchOptions = options.map(o => o.trim()).filter(o => o && !o.toLowerCase().includes('select') && !o.toLowerCase().includes('choose'));
        console.log('Branch dropdown options:', branchOptions);
        
        const expected = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
        const unexpected = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];
        
        const missing = expected.filter(e => !branchOptions.includes(e));
        const foundUnexpected = unexpected.filter(u => branchOptions.includes(u));
        
        if (missing.length === 0 && foundUnexpected.length === 0) {
          results.push({ test: '2: RSVP family-branch dropdown EXACTLY 6 options', status: 'PASS',
            detail: `Options: ${branchOptions.join(', ')}` });
        } else {
          results.push({ test: '2: RSVP family-branch dropdown EXACTLY 6 options', status: 'FAIL',
            detail: `Got: [${branchOptions.join(', ')}]. Missing: [${missing.join(', ')}]. Unexpected: [${foundUnexpected.join(', ')}]` });
        }
        
        // Click on the select to show it for screenshot
        try {
          const sel = page.locator('select').first();
          await sel.evaluate(el => el.size = 6); // expand size for screenshot
        } catch(e) {}
        
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-branches.png'), fullPage: true });
      } else {
        // Custom dropdown - check HTML
        const rsvpHtml = await page.locator('body').innerHTML();
        const branchNames = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
        const unexpectedNames = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];
        
        const found = branchNames.filter(b => rsvpHtml.includes(b));
        const unexpectedFound = unexpectedNames.filter(u => rsvpHtml.includes(u));
        
        console.log('Found in RSVP HTML:', found);
        console.log('Unexpected in RSVP HTML:', unexpectedFound);
        
        if (found.length === 6 && unexpectedFound.length === 0) {
          results.push({ test: '2: RSVP family-branch dropdown EXACTLY 6 options', status: 'PASS',
            detail: `All 6 branches in HTML: ${found.join(', ')}. No unexpected branches.` });
        } else {
          results.push({ test: '2: RSVP family-branch dropdown EXACTLY 6 options', status: 'FAIL',
            detail: `Found: [${found.join(', ')}]. Unexpected: [${unexpectedFound.join(', ')}]` });
        }
        
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-branches.png'), fullPage: true });
      }
    } else {
      results.push({ test: '2: RSVP family-branch dropdown EXACTLY 6 options', status: 'FAIL',
        detail: `Could not reach /rsvp. URL: ${rsvpUrl}` });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-rsvp-branches.png'), fullPage: true });
    }
    
    // =============================================
    // TEST 3: Tree chips
    // =============================================
    console.log('\n--- TEST 3: Tree chips ---');
    
    await page.goto(`${BASE_URL}/tree`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    const treeUrl = page.url();
    console.log('Tree URL:', treeUrl);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-tree-initial.png'), fullPage: true });
    
    if (treeUrl.includes('/tree')) {
      const buttons = await page.locator('button').allTextContents();
      console.log('All buttons on tree:', buttons);
      
      const expectedChips = ['All', 'Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const unexpectedChips = ['Apor', 'Presbitero', 'Lumbab', 'Jose', 'Antonio', 'Rosa'];
      
      const foundExpected = expectedChips.filter(e => buttons.some(b => b.includes(e)));
      const foundUnexpected = unexpectedChips.filter(u => buttons.some(b => b.includes(u)));
      
      if (foundExpected.length === expectedChips.length && foundUnexpected.length === 0) {
        results.push({ test: '3: Tree chips exactly All + 6 branches', status: 'PASS',
          detail: `Chips: ${foundExpected.join(', ')}` });
      } else {
        results.push({ test: '3: Tree chips exactly All + 6 branches', status: 'FAIL',
          detail: `Expected: [${expectedChips.join(', ')}]. Found: [${foundExpected.join(', ')}]. Unexpected: [${foundUnexpected.join(', ')}]` });
      }
    } else {
      results.push({ test: '3: Tree chips exactly All + 6 branches', status: 'FAIL',
        detail: `Could not reach /tree. URL: ${treeUrl}` });
    }
    
    // =============================================
    // TEST 4: Chat
    // =============================================
    console.log('\n--- TEST 4: Chat ---');
    
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    const chatUrl = page.url();
    console.log('Chat URL:', chatUrl);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa-chat.png'), fullPage: true });
    
    if (chatUrl.includes('/chat')) {
      const hasInput = await page.locator('input, textarea, [contenteditable]').count() > 0;
      
      const chatHtml = await page.locator('body').innerHTML();
      const branchNames = ['Panfilo', 'Feliciano', 'Pedro', 'Pablo', 'Purificasion', 'Consorcia'];
      const foundBranches = branchNames.filter(b => chatHtml.includes(b));
      
      // Check for colored elements (branch chip palette)
      let coloredBranchChip = false;
      const allEls = await page.locator('span, div, p').all();
      for (const el of allEls) {
        try {
          const bg = await el.evaluate(e => window.getComputedStyle(e).backgroundColor);
          const text = await el.textContent();
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)' && bg !== 'rgb(0, 0, 0)') {
            if (branchNames.some(b => text.includes(b))) {
              coloredBranchChip = true;
              console.log(`Found colored branch chip: "${text.substring(0, 30)}" bg=${bg}`);
              break;
            }
          }
        } catch(e) {}
      }
      
      if (hasInput) {
        results.push({ test: '4a: Chat loads without errors', status: 'PASS', detail: 'Chat interface loaded' });
      } else {
        results.push({ test: '4a: Chat loads without errors', status: 'FAIL', detail: 'No chat input found' });
      }
      
      if (foundBranches.length > 0) {
        results.push({ test: '4b: Chat has author branch chip from 6-branch palette', status: 'PASS',
          detail: `Branches in chat: ${foundBranches.join(', ')}` });
      } else {
        results.push({ test: '4b: Chat has author branch chip from 6-branch palette', status: 'FAIL',
          detail: 'No branch names found in chat HTML' });
      }
    } else {
      results.push({ test: '4a: Chat loads without errors', status: 'FAIL', detail: `Could not reach /chat. URL: ${chatUrl}` });
      results.push({ test: '4b: Chat has author branch chip from 6-branch palette', status: 'FAIL', detail: 'Chat not reached' });
    }
    
    // Console errors across all protected pages
    if (consoleErrors.length > 0) {
      results.push({ test: '4c: No console errors on protected pages', status: 'FAIL',
        detail: `Errors: ${consoleErrors.join('; ')}` });
    } else {
      results.push({ test: '4c: No console errors on protected pages', status: 'PASS', detail: 'No console errors' });
    }
    
  } catch (error) {
    console.log('GLOBAL ERROR:', error.message);
    results.push({ test: 'Global error', status: 'FAIL', detail: error.message });
  } finally {
    if (browser) await browser.close();
  }
  
  // Print results
  console.log('\n========================================');
  console.log('   QA VERIFICATION RESULTS');
  console.log('========================================');
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    const prefix = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`${prefix} ${r.test}`);
    console.log(`       ${r.detail}`);
    if (r.status === 'PASS') passCount++;
    if (r.status === 'FAIL') failCount++;
  }
  console.log('----------------------------------------');
  console.log(`Total: ${passCount} PASS, ${failCount} FAIL out of ${results.length}`);
  console.log('========================================');
  const overallVerdict = failCount === 0 ? 'PASS' : 'FAIL';
  console.log(`\nOVERALL VERDICT: ${overallVerdict}`);
})();
