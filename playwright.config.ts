import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/qa',
  fullyParallel: false,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'https://google-play-changgoo-program.netlify.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
