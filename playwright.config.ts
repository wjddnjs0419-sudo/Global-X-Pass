import { defineConfig, devices } from '@playwright/test';

const recordCiReplay = process.env.PW_QA_RECORD_REPLAY === '1';

// QA 대상 URL. 기본은 local(Docker, 127.0.0.1:54321) 백엔드를 띄운 로컬 미리보기(아래 webServer가 자동 기동).
// 선행조건: npm run db:start 로 로컬 Supabase 가 떠 있어야 EF/DB 가 응답한다.
// PW_BASE_URL로 오버라이드(예: 배포된 프로덕션 스모크) 시 webServer는 비활성 → 외부 타깃 직접 조회.
// 프로덕션 실데이터 오염 방지 위해 기본은 비-프로덕션(로컬).
const overrideBaseURL = process.env.PW_BASE_URL?.trim();
const localTarget = !overrideBaseURL;
const baseURL = overrideBaseURL || 'http://localhost:4173';

export default defineConfig({
  testDir: './tests/qa',
  fullyParallel: false,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  // 로컬 타깃일 때만 local preview를 자동 기동(로컬·CI 동일 경로). PW_BASE_URL 지정 시 외부 타깃이라 미기동.
  webServer: localTarget
    ? {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
  use: {
    baseURL,
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
