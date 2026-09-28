const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Set timeouts
  context.setDefaultTimeout(4000);
  
  const page = await context.newPage();
  
  // Collect console errors
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
    
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.error('ERROR: Console errors detected:');
      consoleErrors.forEach(err => console.error('  ' + err));
      process.exit(1);
    } else {
      console.log('No console errors (good)');
    }
    
    // Test 1: Desktop viewport (1440x900)
    console.log('\n=== Testing desktop viewport (1440x900) ===');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    
    // Check for horizontal overflow
    const desktopOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    if (desktopOverflow) {
      console.error('ERROR: Horizontal overflow detected at 1440px');
      process.exit(1);
    } else {
      console.log('No horizontal overflow at 1440px (good)');
    }
    
    // Capture desktop screenshot
    await page.screenshot({ 
      path: 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree\\redesign-final-desktop.png',
      fullPage: true
    });
    console.log('Desktop screenshot captured');
    
    // Test 2: Mobile viewport (390x844)
    console.log('\n=== Testing mobile viewport (390x844) ===');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    
    // Check for horizontal overflow
    const mobileOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    if (mobileOverflow) {
      console.error('ERROR: Horizontal overflow detected at 390px');
      process.exit(1);
    } else {
      console.log('No horizontal overflow at 390px (good)');
    }
    
    // Capture mobile screenshot
    await page.screenshot({ 
      path: 'D:\\PROJECTS\\FamilyReunion\\armada\\screenshots\\apor-family-tree\\redesign-final-mobile.png',
      fullPage: true
    });
    console.log('Mobile screenshot captured');
    
    // Test 3: Print media emulation
    console.log('\n=== Testing print media emulation ===');
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
    
    if (!langBarHidden || !tabsHidden || !toolbarHidden) {
      console.error('ERROR: Chrome elements not hidden in print mode');
      console.error('  lang-bar hidden:', langBarHidden);
      console.error('  nav.tabs hidden:', tabsHidden);
      console.error('  tree-toolbar hidden:', toolbarHidden);
    } else {
      console.log('Print media: chrome elements hidden (good)');
    }
    
    // Test 4: Reduced motion emulation
    console.log('\n=== Testing reduced motion emulation ===');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    
    // Check that transitions are disabled
    const transitionsDisabled = await page.evaluate(() => {
      const element = document.querySelector('.filter-chip');
      if (!element) return true;
      const style = window.getComputedStyle(element);
      return style.transitionDuration === '0s' || style.transitionDuration === '';
    });
    
    if (!transitionsDisabled) {
      console.error('ERROR: Transitions not disabled with reduced motion');
    } else {
      console.log('Reduced motion: transitions disabled (good)');
    }
    
    // Test 5: Focus states
    console.log('\n=== Testing focus states ===');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(500);
    
    // Tab to a filter chip and check focus ring
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusVisible = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style.outlineStyle !== 'none' && style.outlineStyle !== '';
    });
    
    if (!focusVisible) {
      console.error('ERROR: Focus ring not visible');
    } else {
      console.log('Focus ring visible (good)');
    }
    
    // Test 6: Contrast ratio calculation
    console.log('\n=== Calculating contrast ratios ===');
    
    // Function to convert hex to RGB
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    // Function to calculate relative luminance
    function getLuminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    // Function to calculate contrast ratio
    function getContrastRatio(l1, l2) {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    
    // Get token values from the CSS
    const tokenValues = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        text: style.getPropertyValue('--text').trim(),
        textFaint: style.getPropertyValue('--text-faint').trim(),
        surface: style.getPropertyValue('--surface').trim(),
        bg: style.getPropertyValue('--bg').trim()
      };
    });
    
    console.log('Token values:', tokenValues);
    
    // Calculate contrast ratios
    const textColor = hexToRgb(tokenValues.text);
    const textFaintColor = hexToRgb(tokenValues.textFaint);
    const surfaceColor = hexToRgb(tokenValues.surface);
    const bgColor = hexToRgb(tokenValues.bg);
    
    if (textColor && surfaceColor) {
      const textLuminance = getLuminance(textColor.r, textColor.g, textColor.b);
      const surfaceLuminance = getLuminance(surfaceColor.r, surfaceColor.g, surfaceColor.b);
      const textContrast = getContrastRatio(textLuminance, surfaceLuminance);
      console.log('--text on --surface contrast ratio:', textContrast.toFixed(2), '(AA requires >= 4.5)');
      
      if (textContrast < 4.5) {
        console.error('ERROR: --text on --surface does not meet AA contrast');
      }
    }
    
    if (textFaintColor && surfaceColor) {
      const textFaintLuminance = getLuminance(textFaintColor.r, textFaintColor.g, textFaintColor.b);
      const surfaceLuminance = getLuminance(surfaceColor.r, surfaceColor.g, surfaceColor.b);
      const textFaintContrast = getContrastRatio(textFaintLuminance, surfaceLuminance);
      console.log('--text-faint on --surface contrast ratio:', textFaintContrast.toFixed(2), '(AA requires >= 4.5)');
      
      if (textFaintContrast < 4.5) {
        console.error('ERROR: --text-faint on --surface does not meet AA contrast');
      }
    }
    
    // Check for console errors again
    if (consoleErrors.length > 0) {
      console.error('ERROR: Console errors detected during testing:');
      consoleErrors.forEach(err => console.error('  ' + err));
      process.exit(1);
    }
    
    console.log('\n=== All Playwright verification tests PASSED ===');
    
  } catch (err) {
    console.error('ERROR during Playwright execution:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
