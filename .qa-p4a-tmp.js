const { chromium } = require("C:/Users/actdr/.agents/skills/powerpoint/node_modules/playwright-core");
const BASE = "http://localhost:3000";
const COOKIE_VAL = "6455f9829e4442139793ff940325f871febaa7ddff7f1b1ccacf910fcd2316c2.9a671dc2c1702a566c0562c69a1affa73f15a9172bb03b011d7b93872edbc8e5";
const OUT = "D:/PROJECTS/FamilyReunion/armada/screenshots/reunion-config/";
const results = [];
async function check(viewport, label) {
  let browser;
  try {
    try { browser = await chromium.launch({ headless: true, channel: "msedge" }); }
    catch (e1) { browser = await chromium.launch({ headless: true, channel: "chrome" }); }
    const ctx = await browser.newContext({ viewport, locale: "en-US" });
    await ctx.addCookies([{ name: "admin-session", value: COOKIE_VAL, domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    let err = null;
    try {
      await page.goto(BASE + "/admin/config", { waitUntil: "domcontentloaded", timeout: 12000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: OUT + "config-" + viewport.width + "x" + viewport.height + ".png", fullPage: true });
      const radios = await page.locator('input[name="reunionScheduled"]').count();
      const dates = await page.locator('input[type="datetime-local"]').count();
      const hasStatus = await page.locator("text=Reunion status").count();
      let startDisabled = null, endDisabled = null;
      if (dates >= 2) {
        startDisabled = await page.locator('input[type="datetime-local"]').nth(0).isDisabled();
        endDisabled = await page.locator('input[type="datetime-local"]').nth(1).isDisabled();
      }
      results.push({ viewport: label, status: "OK", radios, dates, hasStatus, startDisabled, endDisabled, url: page.url() });
    } catch (e) {
      try { await page.screenshot({ path: OUT + "config-" + viewport.width + "x" + viewport.height + ".png", fullPage: true }).catch(() => {}); } catch {}
      results.push({ viewport: label, status: "ERROR", error: String(e).slice(0, 250) });
    }
    await browser.close();
  } catch (e) {
    results.push({ viewport: label, status: "ERROR", error: String(e).slice(0, 250) });
  }
}
(async () => {
  await check({ width: 360, height: 800 }, "360x800");
  await check({ width: 1440, height: 900 }, "1440x900");
  console.log(JSON.stringify(results, null, 2));
})();