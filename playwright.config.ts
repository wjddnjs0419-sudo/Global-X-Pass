import { defineConfig, devices } from '@playwright/test';

const recordCiReplay = process.env.PW_QA_RECORD_REPLAY === '1';

export default defineConfig({
  testDir: './tests/qa',
  fullyParallel: false,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'https://google-play-changgoo-program.netlify.app',
    trace: recordCiReplay ? 'on' : 'on-first-retry',
    screenshot: recordCiReplay ? 'on' : 'only-on-failure',
    video: recordCiReplay ? 'on' : 'retain-on-failure',
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
