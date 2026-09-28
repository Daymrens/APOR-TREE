const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({headless:true, timeout:10000});
  const ctx = await browser.newContext({viewport:{width:1280,height:900}});
  
  const page = await ctx.newPage();
  page.on("console", msg => {
    console.log("  [BROWSER " + msg.type() + "] " + msg.text());
  });
  page.on("pageerror", err => {
    console.log("  [PAGE ERROR] " + err.message);
  });
  
  await page.goto("http://localhost:3000/gate", {timeout:8000, waitUntil:"domcontentloaded"});
  try { await page.waitForSelector('#member-name', {state:'attached', timeout:10000}); } catch(e) {}
  await page.waitForTimeout(4000);
  
  console.log("URL: " + page.url());
  
  // Check DOM structure
  const domInfo = await page.evaluate(() => {
    const body = document.body;
    const root = document.querySelector('#__next') || document.querySelector('#root') || document.querySelector('[data-reactroot]') || body.children[0];
    return {
      rootTag: root ? root.tagName : 'none',
      rootId: root ? root.id : 'none',
      rootClass: root ? root.className.substring(0, 100) : 'none',
      bodyChildren: body.children.length,
      gearButton: !!document.querySelector('button[aria-label="Admin settings"]'),
      nameInput: !!document.querySelector('#member-name'),
      bodyHTML: body.innerHTML.substring(0, 200),
    };
  }).catch(e => { console.log("DOM check error: " + e.message); return null; });
  console.log("DOM info:", JSON.stringify(domInfo, null, 2));
  
  // Try clicking at exact coordinates of gear button
  const box = await page.locator('button[aria-label="Admin settings"]').boundingBox({timeout:5000}).catch(() => null);
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    console.log("Clicking at (" + cx + ", " + cy + ")...");
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(1500);
    
    const afterClick = await page.evaluate(() => {
      return {
        passcodeExists: !!document.querySelector('#passcode'),
        backLinkExists: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Back to name entry')),
        passcodeLabel: !!document.querySelector('label[for="passcode"]'),
      };
    }).catch(e => null);
    console.log("After mouse.click:", JSON.stringify(afterClick));
  } else {
    console.log("No bounding box for gear");
  }
  
  await page.close();
  await browser.close();
})();
