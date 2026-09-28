const { chromium } = require("C:/Users/actdr/.agents/skills/powerpoint/node_modules/playwright-core");
const BASE = "http://localhost:3000";
const ADMIN_COOKIE = "6455f9829e4442139793ff940325f871febaa7ddff7f1b1ccacf910fcd2316c2.9a671dc2c1702a566c0562c69a1affa73f15a9172bb03b011d7b93872edbc8e5";

(async () => {
  let browser;
  try { browser = await chromium.launch({ headless: true, channel: "msedge" }); }
  catch (e) { try { browser = await chromium.launch({ headless: true, channel: "chrome" }); } catch (e2) { console.error("LAUNCH", e2.message); return; } }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: "admin-session", value: ADMIN_COOKIE, url: BASE }]);
  const page = await ctx.newPage();
  page.on("response", (r) => { if (r.url().includes("get-config")) console.log("API", r.status(), r.url()); });
  await page.goto(BASE + "/admin/config", { waitUntil: "domcontentloaded", timeout: 10000 });
  await page.waitForTimeout(4000);
  console.log("URL:", page.url());
  console.log("RADIOS:", await page.locator('input[type="radio"]').count());
  console.log("DTL:", await page.locator('input[type="datetime-local"]').count());
  const body = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log("BODY:", body.replace(/\n+/g, " | ").slice(0, 300));
  await browser.close();
})();