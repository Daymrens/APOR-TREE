const { chromium } = require("C:/Users/actdr/.agents/skills/powerpoint/node_modules/playwright-core");
const BASE = "http://localhost:3000";
const OUT = "D:/PROJECTS/FamilyReunion/armada/screenshots/reunion-config/";
const MODE = process.argv[2] || "scheduled";
const results = [];

async function launch() {
  try { return await chromium.launch({ headless: true, channel: "msedge" }); }
  catch (e1) { return await chromium.launch({ headless: true, channel: "chrome" }); }
}

async function shot(browser, viewport, url, file, opts = {}) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  if (opts.cookie) {
    await ctx.addCookies([{ name: "admin-session", value: opts.cookie, domain: "localhost", path: "/" }]);
  }
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  const entry = { file, viewport: viewport.width + "x" + viewport.height, status: "OK" };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: OUT + file, fullPage: true });
    if (opts.checks) entry.checks = await opts.checks(page);
  } catch (e) {
    entry.status = "ERROR";
    entry.error = String(e).slice(0, 250);
    try { await page.screenshot({ path: OUT + file, fullPage: true }).catch(() => {}); } catch {}
  }
  results.push(entry);
  await ctx.close();
}

(async () => {
  const browser = await launch();
  let cookie = null;
  if (MODE !== "scheduled") {
    try {
      const r = await fetch(BASE + "/api/verify-passcode", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: "APORADMIN26", isAdmin: true })
      });
      const sc = r.headers.get("set-cookie");
      cookie = sc ? sc.split(";")[0].split("=").slice(1).join("=") : null;
      results.push({ step: "cookie", status: "OK", got: !!cookie });
    } catch (e) { results.push({ step: "cookie", status: "ERROR", error: String(e).slice(0, 200) }); }
  }

  if (MODE === "scheduled") {
    await shot(browser, { width: 360, height: 800 }, BASE + "/", "home-scheduled-360.png", {
      checks: async (page) => ({
        countdownSection: await page.locator("text=Countdown").count(),
        daysLabel: await page.locator("text=Days").count(),
        hoursLabel: await page.locator("text=Hours").count()
      })
    });
  } else {
    await shot(browser, { width: 360, height: 800 }, BASE + "/", "home-360.png", {
      checks: async (page) => ({
        countdownSection: await page.locator("text=Countdown").count(),
        daysLabel: await page.locator("text=Days").count()
      })
    });
    await shot(browser, { width: 1440, height: 900 }, BASE + "/", "home-1440.png", {
      checks: async (page) => ({
        countdownSection: await page.locator("text=Countdown").count(),
        daysLabel: await page.locator("text=Days").count()
      })
    });
    await shot(browser, { width: 360, height: 800 }, BASE + "/admin/config", "admin-360.png", {
      cookie,
      checks: async (page) => ({
        errorCard: await page.locator("text=Could not load config").count(),
        retryBtn: await page.locator("text=Retry").count(),
        radios: await page.locator('input[name="reunionScheduled"]').count(),
        dateInputs: await page.locator('input[type="datetime-local"]').count()
      })
    });
    await shot(browser, { width: 1440, height: 900 }, BASE + "/admin/config", "admin-1440.png", {
      cookie,
      checks: async (page) => ({
        errorCard: await page.locator("text=Could not load config").count(),
        retryBtn: await page.locator("text=Retry").count(),
        radios: await page.locator('input[name="reunionScheduled"]').count(),
        dateInputs: await page.locator('input[type="datetime-local"]').count()
      })
    });
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();