// @ts-check
const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:3000/apor-family.html';
const TIMEOUTS = { default: 4000, nav: 8000, launch: 15000 };

test.describe('Phase 1 - Redesign tokens, header, tabs', () => {

  test('header title is oversized display type (>2rem at 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });

    const h1 = page.locator('header.brand h1');
    await expect(h1).toBeVisible({ timeout: TIMEOUTS.default });

    const fontSize = await h1.evaluate(el => {
      return parseFloat(getComputedStyle(el).fontSize);
    });
    console.log('H1 computed font-size: ' + fontSize + 'px');
    expect(fontSize).toBeGreaterThan(32); // 2rem = 32px
  });

  test('tabs render as pills (border-radius 999px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });

    const tabForm = page.locator('#tab-form');
    const borderRadius = await tabForm.evaluate(el => {
      return getComputedStyle(el).borderRadius;
    });
    console.log('Tab border-radius: ' + borderRadius);
    expect(borderRadius).toBe('999px');
  });

  test('clicking Family Tree switches to tree view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });

    // Initially form view is active
    await expect(page.locator('#view-form')).toHaveClass(/active/);

    // Click Family Tree tab
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(200);

    // Tree view should be active, form inactive
    await expect(page.locator('#view-tree')).toHaveClass(/active/);
    await expect(page.locator('#view-form')).not.toHaveClass(/active/);
    console.log('Tab switch to tree: PASS');
  });

  test('clicking Member Form switches back to form view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });

    // Switch to tree first
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#view-tree')).toHaveClass(/active/);

    // Switch back to form
    await page.locator('#tab-form').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#view-form')).toHaveClass(/active/);
    await expect(page.locator('#view-tree')).not.toHaveClass(/active/);
    console.log('Tab switch to form: PASS');
  });

  test('Directory tab opens the panel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });

    // Directory panel should not have 'show' class initially
    const dir = page.locator('#directory');
    await expect(dir).not.toHaveClass(/show/);

    // Click Directory tab
    await page.locator('#tab-dir').click();
    await page.waitForTimeout(300);

    // Directory panel should now have 'show' class
    await expect(dir).toHaveClass(/show/);
    console.log('Directory panel open: PASS');
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });
    await page.waitForTimeout(1000);

    console.log('Console errors count: ' + errors.length);
    if (errors.length > 0) {
      console.log('Errors: ' + errors.join(' | '));
    }
    expect(errors).toHaveLength(0);
  });

  test('screenshot: hero + tabs + tree view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.launch });
    await page.waitForTimeout(500);

    // Switch to tree view
    await page.locator('#tab-tree').click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'armada/screenshots/apor-family-tree/redesign-phase1.png',
      fullPage: false,
    });
    console.log('Screenshot saved: armada/screenshots/apor-family-tree/redesign-phase1.png');
  });

});
