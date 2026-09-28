/**
 * E2E: Gate page — family passcode removed, open registration
 *
 * Checks:
 *  1. GET /gate (no redirect) → NO #passcode input; #member-name visible; banner visible
 *  2. GET /gate?redirect=/admin → #passcode input present with admin label
 *  3. Screenshot of family view
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const TIMEOUTS = { navigation: 8000, default: 4000, launch: 15000 };

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

async function run() {
  const results: CheckResult[] = [];
  const browser = await chromium.launch({ headless: true, timeout: TIMEOUTS.launch });
  const context = await browser.newContext({ viewport: { width: 480, height: 900 } });

  // ---- CHECK 1: Family view (no passcode) ----
  {
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}/gate`, { waitUntil: "domcontentloaded", timeout: TIMEOUTS.navigation });

      // 1a: #passcode input must NOT be present
      const passcodeCount = await page.locator("#passcode").count();
      results.push({
        name: "1a: No #passcode input on /gate",
        pass: passcodeCount === 0,
        detail: `Found ${passcodeCount} #passcode input(s)`,
      });

      // 1b: #member-name input visible
      const memberNameVisible = await page.locator("#member-name").isVisible({ timeout: TIMEOUTS.default });
      results.push({
        name: "1b: #member-name input visible",
        pass: memberNameVisible,
        detail: memberNameVisible ? "Visible" : "Not visible",
      });

      // 1c: Banner text visible
      const bannerText = await page.locator("text=Open registration").isVisible({ timeout: TIMEOUTS.default });
      results.push({
        name: "1c: 'Open registration' banner visible",
        pass: bannerText,
        detail: bannerText ? "Visible" : "Not visible",
      });

      // 1d: Label text "Find your name in the family tree"
      const nameLabel = await page.locator("text=Find your name in the family tree").isVisible({ timeout: TIMEOUTS.default });
      results.push({
        name: "1d: 'Find your name in the family tree' label visible",
        pass: nameLabel,
        detail: nameLabel ? "Visible" : "Not visible",
      });

      // 1e: "Back to passcode" link must NOT be present
      const backLink = await page.locator("text=Back to passcode").count();
      results.push({
        name: "1e: No 'Back to passcode' link",
        pass: backLink === 0,
        detail: `Found ${backLink} 'Back to passcode' element(s)`,
      });

      // Screenshot
      await page.screenshot({
        path: "armada/screenshots/apor-family-tree/gate-family-open-qa.png",
        fullPage: true,
      });
    } catch (e: any) {
      results.push({ name: "CHECK 1: Family view", pass: false, detail: `Error: ${e.message}` });
    } finally {
      await page.close();
    }
  }

  // ---- CHECK 2: Admin view ----
  {
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}/gate?redirect=/admin`, { waitUntil: "domcontentloaded", timeout: TIMEOUTS.navigation });

      // 2a: #passcode input present
      const passcodeVisible = await page.locator("#passcode").isVisible({ timeout: TIMEOUTS.default });
      results.push({
        name: "2a: #passcode input present on /gate?redirect=/admin",
        pass: passcodeVisible,
        detail: passcodeVisible ? "Visible" : "Not visible",
      });

      // 2b: Admin label
      const adminLabel = await page.locator("text=admin passcode").isVisible({ timeout: TIMEOUTS.default });
      results.push({
        name: "2b: Admin passcode label visible",
        pass: adminLabel,
        detail: adminLabel ? "Visible" : "Not visible",
      });

      // 2c: #member-name must NOT be visible (admin step shows passcode, not name)
      const memberNameCount = await page.locator("#member-name").count();
      results.push({
        name: "2c: #member-name NOT on admin path",
        pass: memberNameCount === 0,
        detail: `Found ${memberNameCount} #member-name input(s)`,
      });
    } catch (e: any) {
      results.push({ name: "CHECK 2: Admin view", pass: false, detail: `Error: ${e.message}` });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Report
  console.log("\n=== GATE OPEN-REGISTRATION E2E RESULTS ===\n");
  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(`[${icon}] ${r.name} — ${r.detail}`);
    if (!r.pass) allPass = false;
  }
  console.log(`\nVERDICT: ${allPass ? "PASS" : "FAIL"}`);
  process.exit(allPass ? 0 : 1);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
