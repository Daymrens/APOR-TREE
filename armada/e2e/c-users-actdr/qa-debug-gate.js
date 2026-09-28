const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://apor-tree.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/apor-family-tree');

(async () => {
  let browser;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    context.setDefaultTimeout(5000);
    const page = await context.newPage();
    
    page.on('console', msg => {
      console.log('[CONSOLE]', msg.type(), msg.text());
    });
    page.on('pageerror', err => {
      console.log('[PAGE ERROR]', err.message);
    });

    // Navigate to gate
    console.log('Navigating to /gate...');
    await page.goto(`${BASE_URL}/gate`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // Search for Demelito
    const searchInput = page.locator('#member-name');
    await searchInput.fill('Demelito');
    await page.waitForTimeout(2000);
    
    // Take screenshot to see the result row state
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-gate-1.png'), fullPage: true });
    
    // Inspect the result row structure
    const resultRowHtml = await page.evaluate(() => {
      // Find the element containing "Demelito Apor"
      const els = document.querySelectorAll('*');
      for (const el of els) {
        if (el.textContent.includes('Demelito Apor') && el.textContent.includes('Panfilo')) {
          return {
            tag: el.tagName,
            className: el.className,
            role: el.getAttribute('role'),
            tabIndex: el.getAttribute('tabindex'),
            onClick: el.onclick ? 'has onclick' : 'no onclick',
            outerHTML: el.outerHTML.substring(0, 1000)
          };
        }
      }
      return null;
    });
    console.log('Result row structure:', JSON.stringify(resultRowHtml, null, 2));
    
    // Try clicking the result row more precisely
    // Look for the element that has the arrow/chevron or is the clickable card
    const clickableElements = await page.evaluate(() => {
      const results = [];
      const els = document.querySelectorAll('[role="button"], button, a, [onclick], [class*="cursor-pointer"], [class*="clickable"]');
      for (const el of els) {
        if (el.textContent.includes('Demelito') || el.textContent.includes('Panfilo')) {
          results.push({
            tag: el.tagName,
            className: el.className,
            text: el.textContent.substring(0, 100),
            role: el.getAttribute('role')
          });
        }
      }
      return results;
    });
    console.log('Clickable elements near Demelito:', JSON.stringify(clickableElements, null, 2));
    
    // Try clicking the exact result area
    // From the screenshot, the result card has the > chevron on the right
    const resultCard = page.locator('[class*="rounded"]').filter({ hasText: 'Demelito Apor' });
    console.log('Result card count:', await resultCard.count());
    
    // Try a more targeted click - look for the element with the chevron
    const chevronEl = page.locator('svg, [class*="chevron"], [class*="arrow"]').filter({ hasText: 'Demelito' });
    console.log('Chevron count:', await chevronEl.count());
    
    // Just try clicking the text
    await page.locator('text=Demelito Apor').first().click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-gate-2.png'), fullPage: true });
    console.log('URL after clicking Demelito Apor:', page.url());
    
    // Get the full page HTML structure to understand what changed
    const afterClickText = await page.locator('body').textContent();
    console.log('Page text after click (500):', afterClickText.substring(0, 500));
    
    // Check if there are now different buttons
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons after click:', allButtons);
    
    // Check all interactive elements
    const allInteractive = await page.evaluate(() => {
      const results = [];
      const els = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
      for (const el of els) {
        results.push({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          className: el.className.substring(0, 100),
          disabled: el.disabled,
          visible: el.offsetParent !== null
        });
      }
      return results;
    });
    console.log('All interactive elements:', JSON.stringify(allInteractive, null, 2));
    
    // Try clicking "Continue as guest" with more precision
    const continueBtn = page.locator('button').filter({ hasText: 'Continue as guest' });
    const continueBtnCount = await continueBtn.count();
    console.log('Continue as guest button count:', continueBtnCount);
    
    if (continueBtnCount > 0) {
      await continueBtn.first().click();
      await page.waitForTimeout(5000);
      console.log('URL after Continue as guest:', page.url());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-gate-3.png'), fullPage: true });
      
      // Check localStorage for any gate state
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          items[key] = window.localStorage.getItem(key);
        }
        return items;
      });
      console.log('localStorage after continue:', JSON.stringify(localStorage, null, 2));
    }
    
    // Check cookies
    const cookies = await context.cookies();
    console.log('Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 50)}`));
    
    // Try navigating to /rsvp now
    await page.goto(`${BASE_URL}/rsvp`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    console.log('RSVP URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-rsvp.png'), fullPage: true });
    
    const rsvpText = await page.locator('body').textContent();
    console.log('RSVP text (500):', rsvpText.substring(0, 500));
    
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    if (browser) await browser.close();
  }
})();
