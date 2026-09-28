const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'phase1-redesign.spec.js',
  timeout: 20000,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 4000,
    navigationTimeout: 8000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
