// @ts-check
const { test, expect } = require('@playwright/test');

const FILE_URL = 'file:///D:/PROJECTS/FamilyReunion/public/apor-family.html';
const SCREENSHOT_DIR = 'D:/PROJECTS/FamilyReunion/armada/screenshots/apor-family-tree';

test.describe('Three-Mode Form (apor-family.html)', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(FILE_URL, { timeout: 8000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500); // let JS init
  });

  // ── TEST 1 ──
  test('T1: Load -> form view -> 3 mode buttons visible, no console errors', async ({ page }) => {
    // Click Member Form tab
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Verify form view is active
    const formView = page.locator('#view-form');
    await expect(formView).toHaveClass(/active/);

    // Verify 3 mode tabs
    const modeTabs = page.locator('.mode-tab');
    await expect(modeTabs).toHaveCount(3);

    // Add Family Member is active
    const addTab = page.locator('.mode-tab[data-mode="add"]');
    await expect(addTab).toHaveClass(/active/);
    await expect(addTab).toHaveText('Add Family Member');

    // Correction and Suggestion are visible
    await expect(page.locator('.mode-tab[data-mode="correct"]')).toBeVisible();
    await expect(page.locator('.mode-tab[data-mode="correct"]')).toHaveText('Correction');
    await expect(page.locator('.mode-tab[data-mode="suggest"]')).toBeVisible();
    await expect(page.locator('.mode-tab[data-mode="suggest"]')).toHaveText('Suggestion');

    // No console errors
    expect(consoleErrors).toEqual([]);
  });

  // ── TEST 2 ──
  test('T2: ADD mode: branch dropdown -> pick Panfilo -> branch info shows people with G badges', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Click branch search input to open dropdown
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);

    // Dropdown should open
    const branchList = page.locator('#branchList');
    await expect(branchList).toHaveClass(/open/);

    // Type "Pan" to filter
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);

    // Should see Panfilo in the dropdown
    const panfiloRow = branchList.locator('.sdd-row', { hasText: 'Panfilo' });
    await expect(panfiloRow).toBeVisible();

    // Click Panfilo
    await panfiloRow.click();
    await page.waitForTimeout(300);

    // Branch info panel should appear
    const branchInfo = page.locator('#branchInfo');
    await expect(branchInfo).toBeVisible();

    // Check content
    const branchText = await branchInfo.textContent();
    expect(branchText).toContain('Panfilo');

    // Should list branch members with G badges
    expect(branchText).toContain('Panfilo Apor');
    expect(branchText).toContain('Antonia Montecalvo');

    // Gen 2 kids
    expect(branchText).toContain('Ricardenel');
    expect(branchText).toContain('Charlita');
    expect(branchText).toContain('Merlyn');
    expect(branchText).toContain('Yelbe');
    expect(branchText).toContain('Lonifredo');
    expect(branchText).toContain('Marlibeth');
    expect(branchText).toContain('Demelito');
    expect(branchText).toContain('Jofersel');

    // G badges should be present
    const gBadges = branchInfo.locator('.dir-gen');
    const badgeCount = await gBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(9); // Panfilo + Antonia + 7-8 kids

    // Verify G2 badges for Gen 2
    const g2Badges = branchInfo.locator('.dir-gen', { hasText: 'G2' });
    const g2Count = await g2Badges.count();
    expect(g2Count).toBeGreaterThanOrEqual(7);
  });

  // ── TEST 3 ──
  test('T3: Target dropdown: search Demelito, pick, relation radios auto-fill parents', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Select Panfilo branch first
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    const branchList = page.locator('#branchList');
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Now open target dropdown
    const targetInput = page.locator('#targetSearch');
    await targetInput.click();
    await page.waitForTimeout(200);

    // Search Demelito
    await targetInput.fill('Demelito');
    await page.waitForTimeout(300);

    const targetList = page.locator('#targetList');
    const demelitoRow = targetList.locator('.sdd-row', { hasText: 'Demelito' });
    await expect(demelitoRow).toBeVisible();
    await demelitoRow.click();
    await page.waitForTimeout(300);

    // Pick Sibling radio
    await page.click('input[value="sibling"]');
    await page.waitForTimeout(200);
    const parentName = page.locator('#parentName');
    const parentVal = await parentName.inputValue();
    // Sibling -> parents = target's parents = Gerbacio Apor & Marciana Apor
    expect(parentVal).toContain('Gerbacio');
    expect(parentVal).toContain('Marciana');

    // Switch to Child
    await page.click('input[value="child"]');
    await page.waitForTimeout(200);
    const childParentVal = await parentName.inputValue();
    // Child -> parents = target (Panfilo) + spouse (Antonia)
    expect(childParentVal).toContain('Panfilo');
    expect(childParentVal).toContain('Antonia');

    // Switch to Spouse
    await page.click('input[value="spouse"]');
    await page.waitForTimeout(200);
    const spouseParentVal = await parentName.inputValue();
    // Spouse -> empty
    expect(spouseParentVal).toBe('');
  });

  // ── TEST 4 ──
  test('T4: Spouse guard: target with spouse -> error, root couple -> error', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // --- Test 4a: Target = Panfilo (has spouse Antonia), Spouse relation ---
    // Select Panfilo branch
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    const branchList = page.locator('#branchList');
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Select Panfilo as target
    const targetInput = page.locator('#targetSearch');
    await targetInput.click();
    await page.waitForTimeout(200);
    await targetInput.fill('Panfilo');
    await page.waitForTimeout(300);
    const targetList = page.locator('#targetList');
    await targetList.locator('.sdd-row', { hasText: 'Panfilo Apor' }).click();
    await page.waitForTimeout(300);

    // Select Spouse relation
    await page.click('input[value="spouse"]');
    await page.waitForTimeout(200);

    // Fill first/last name
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Check error banner
    const banner = page.locator('#form-banner');
    const bannerText = await banner.textContent();
    expect(bannerText.toLowerCase()).toContain('already has a spouse');

    // No fetch should have been made (check no network POST captured)
    // The banner says "already has a spouse" so submit was rejected before fetch

    // --- Test 4b: Root couple error ---
    // Reset and try root couple
    await page.click('button[type="reset"]');
    await page.waitForTimeout(200);

    // Select Panfilo branch again
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Select Gerbacio as target (root, gen 0)
    await targetInput.click();
    await page.waitForTimeout(200);
    await targetInput.fill('Gerbacio');
    await page.waitForTimeout(300);
    await targetList.locator('.sdd-row', { hasText: 'Gerbacio Apor' }).click();
    await page.waitForTimeout(300);

    // Select Spouse relation
    await page.click('input[value="spouse"]');
    await page.waitForTimeout(200);

    // Fill names
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const bannerText2 = await banner.textContent();
    expect(bannerText2.toLowerCase()).toContain('root couple');
  });

  // ── TEST 5 ──
  test('T5: Sibling guard: target = gerbacio-apor (root), Sibling -> error', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Select Panfilo branch
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    const branchList = page.locator('#branchList');
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Select Gerbacio as target (root, has no parents)
    const targetInput = page.locator('#targetSearch');
    await targetInput.click();
    await page.waitForTimeout(200);
    await targetInput.fill('Gerbacio');
    await page.waitForTimeout(300);
    const targetList = page.locator('#targetList');
    await targetList.locator('.sdd-row', { hasText: 'Gerbacio Apor' }).click();
    await page.waitForTimeout(300);

    // Select Sibling relation
    await page.click('input[value="sibling"]');
    await page.waitForTimeout(200);

    // Fill names
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const banner = page.locator('#form-banner');
    const bannerText = await banner.textContent();
    expect(bannerText.toLowerCase()).toContain('no parents');
  });

  // ── TEST 6 ──
  test('T6: Validation: empty branch/target/relation -> errPickAll banner', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Fill just first/last name (valid names)
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Apor');
    await page.waitForTimeout(200);

    // Submit without branch, target, or relation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const banner = page.locator('#form-banner');
    const bannerText = await banner.textContent();
    expect(bannerText.toLowerCase()).toContain('pick');
  });

  // ── TEST 7 ──
  test('T7: Payload check: add mode -> route-intercepted POST with correct payload', async ({ page }) => {
    let capturedPayload = null;
    let capturedUrl = null;

    // Route intercept: block the real API call and capture the payload
    await page.route('https://apor-tree.vercel.app/api/contributions', async (route) => {
      capturedUrl = route.request().url();
      capturedPayload = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });

    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Select Panfilo branch
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    const branchList = page.locator('#branchList');
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Select Demelito as target
    const targetInput = page.locator('#targetSearch');
    await targetInput.click();
    await page.waitForTimeout(200);
    await targetInput.fill('Demelito');
    await page.waitForTimeout(300);
    const targetList = page.locator('#targetList');
    await targetList.locator('.sdd-row', { hasText: 'Demelito' }).click();
    await page.waitForTimeout(300);

    // Select Child relation
    await page.click('input[value="child"]');
    await page.waitForTimeout(200);

    // Fill names
    await page.fill('#firstName', 'QA Test');
    await page.fill('#lastName', 'Apor');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify the intercepted request
    expect(capturedUrl).toBe('https://apor-tree.vercel.app/api/contributions');
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.type).toBe('add_member');
    expect(capturedPayload.data.relation).toBe('Child');
    expect(capturedPayload.data.targetId).toBe('demelito-apor');
    expect(capturedPayload.title).toContain('QA Test');

    // Print the exact payload for evidence
    console.log('Captured payload:', JSON.stringify(capturedPayload, null, 2));
  });

  // ── TEST 8 ──
  test('T8: CORRECTION mode: person dropdown, field select, payload intercept', async ({ page }) => {
    let capturedPayload = null;

    await page.route('https://apor-tree.vercel.app/api/contributions', async (route) => {
      capturedPayload = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });

    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Switch to Correction mode
    await page.click('.mode-tab[data-mode="correct"]');
    await page.waitForTimeout(300);

    // Verify correction mode is active
    const corrMode = page.locator('#mode-correct');
    await expect(corrMode).not.toHaveClass(/hidden/);

    // Open person search
    const personInput = page.locator('#personSearch');
    await personInput.click();
    await page.waitForTimeout(200);

    // Search for Purificasion
    await personInput.fill('Purificasion');
    await page.waitForTimeout(300);

    const personList = page.locator('#personList');
    const purifRow = personList.locator('.sdd-row', { hasText: 'Purificasion' });
    await expect(purifRow).toBeVisible();
    await purifRow.click();
    await page.waitForTimeout(300);

    // Verify correction card shows
    const corrCard = page.locator('#corrCard');
    await expect(corrCard).not.toHaveClass(/hide/);
    const cardText = await corrCard.textContent();
    expect(cardText).toContain('Purificasion');
    expect(cardText).toContain('Presbitero'); // branch

    // Select "Birth date" field
    await page.selectOption('#corrField', 'birth_date');
    await page.waitForTimeout(200);

    // Date input should be visible
    const corrValue = page.locator('#corrValue');
    await expect(corrValue).toBeVisible();

    // Fill date
    await corrValue.fill('1950-01-01');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify payload
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.type).toBe('correction');
    expect(capturedPayload.data.personId).toBe('purificasion-apor');
    expect(capturedPayload.data.field).toBe('birth_date');
    expect(capturedPayload.data.correctedValue).toBe('1950-01-01');

    console.log('Correction payload:', JSON.stringify(capturedPayload, null, 2));
  });

  // ── TEST 9 ──
  test('T9: SUGGESTION mode: category + text, payload intercept, empty text validation', async ({ page }) => {
    let capturedPayload = null;

    await page.route('https://apor-tree.vercel.app/api/contributions', async (route) => {
      capturedPayload = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });

    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Switch to Suggestion mode
    await page.click('.mode-tab[data-mode="suggest"]');
    await page.waitForTimeout(300);

    // Verify suggestion mode is active
    const suggMode = page.locator('#mode-suggest');
    await expect(suggMode).not.toHaveClass(/hidden/);

    // Category should default to "Reunion event"
    const catSelect = page.locator('#suggCat');
    await expect(catSelect).toHaveValue('reunion');

    // Fill text
    await page.fill('#suggText', 'QA test suggestion');
    await page.waitForTimeout(200);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify payload
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.type).toBe('suggestion');
    expect(capturedPayload.category).toBe('reunion');
    expect(capturedPayload.description).toContain('QA test suggestion');

    console.log('Suggestion payload:', JSON.stringify(capturedPayload, null, 2));

    // --- Now test empty text validation ---
    capturedPayload = null; // reset
    await page.fill('#suggText', '');
    await page.waitForTimeout(200);

    // Submit with empty text
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should show validation error
    const banner = page.locator('#form-banner');
    const bannerText = await banner.textContent();
    expect(bannerText).toBeTruthy();
    expect(bannerText.length).toBeGreaterThan(0);
    // No payload should have been sent
    expect(capturedPayload).toBeNull();
  });

  // ── TEST 10 ──
  test('T10: i18n: setLang tl -> mode buttons change, setLang en restores', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Verify English labels
    await expect(page.locator('.mode-tab[data-mode="add"]')).toHaveText('Add Family Member');
    await expect(page.locator('.mode-tab[data-mode="correct"]')).toHaveText('Correction');
    await expect(page.locator('.mode-tab[data-mode="suggest"]')).toHaveText('Suggestion');

    // Switch to Tagalog
    await page.evaluate(() => setLang('tl'));
    await page.waitForTimeout(300);

    // Mode buttons should now be in Tagalog
    const addText = await page.locator('.mode-tab[data-mode="add"]').textContent();
    const corrText = await page.locator('.mode-tab[data-mode="correct"]').textContent();
    const suggText = await page.locator('.mode-tab[data-mode="suggest"]').textContent();

    expect(addText).toContain('Miyembro'); // "Magdagdag ng Miyembro"
    expect(corrText).toContain('Pagwawasto');
    expect(suggText).toContain('Mungkahi');

    // Labels should also change
    const branchLbl = await page.locator('[data-i18n="branchLbl"]').textContent();
    expect(branchLbl).toBe('Sanga');

    const relationLbl = await page.locator('[data-i18n="relationLbl"]').textContent();
    expect(relationLbl).toBe('Ugnayan');

    // No console errors
    expect(consoleErrors).toEqual([]);

    // Switch back to English
    await page.evaluate(() => setLang('en'));
    await page.waitForTimeout(300);

    // Verify restored
    await expect(page.locator('.mode-tab[data-mode="add"]')).toHaveText('Add Family Member');
    const branchLblEn = await page.locator('[data-i18n="branchLbl"]').textContent();
    expect(branchLblEn).toBe('Branch');

    // Still no errors
    expect(consoleErrors).toEqual([]);
  });

  // ── TEST 11 ──
  test('T11: Screenshot: add mode with branch panel + target + relation visible', async ({ page }) => {
    await page.click('#tab-form');
    await page.waitForTimeout(200);

    // Select Panfilo branch
    const branchInput = page.locator('#branchSearch');
    await branchInput.click();
    await page.waitForTimeout(200);
    await branchInput.fill('Pan');
    await page.waitForTimeout(300);
    const branchList = page.locator('#branchList');
    await branchList.locator('.sdd-row', { hasText: 'Panfilo' }).click();
    await page.waitForTimeout(300);

    // Select Demelito as target
    const targetInput = page.locator('#targetSearch');
    await targetInput.click();
    await page.waitForTimeout(200);
    await targetInput.fill('Demelito');
    await page.waitForTimeout(300);
    const targetList = page.locator('#targetList');
    await targetList.locator('.sdd-row', { hasText: 'Demelito' }).click();
    await page.waitForTimeout(300);

    // Select Child relation
    await page.click('input[value="child"]');
    await page.waitForTimeout(200);

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/qa-three-mode-form.png`,
      fullPage: true,
    });

    // Verify screenshot file exists
    const fs = require('fs');
    expect(fs.existsSync(`${SCREENSHOT_DIR}/qa-three-mode-form.png`)).toBeTruthy();
  });
});
