import { chromium } from '@playwright/test';
import { generateSync } from 'otplib';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[Diag-UI] Missing required environment variable: ${name}`);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv('QA_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('QA_ADMIN_PASSWORD');
const ADMIN_MFA_SECRET = requireEnv('QA_ADMIN_MFA_SECRET');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 로그인 및 MFA (이미 검증된 로직)
  await page.goto('https://google-play-changgoo-program.netlify.app/login');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button:has-text("로그인")').last().click();
  await page.waitForTimeout(3000);
  const token = generateSync({ secret: ADMIN_MFA_SECRET });
  await page.locator('input').first().fill(token);
  await page.keyboard.press('Enter');
  await page.waitForURL(/.*admin|.*mypage/);
  
  // 게시물 작성 페이지 진입 후 구조 진단
  console.log('[Diag-UI] Navigating to Post Create Page...');
  await page.goto('https://google-play-changgoo-program.netlify.app/admin/post/create').catch(() => {});
  await page.waitForTimeout(3000);
  
  console.log('[Diag-UI] Current URL:', page.url());
  const buttons = await page.locator('button').allTextContents();
  console.log('[Diag-UI] Buttons on page:', buttons);
  
  const selects = await page.locator('select').count();
  console.log('[Diag-UI] Select elements count:', selects);
  
  await browser.close();
})();
