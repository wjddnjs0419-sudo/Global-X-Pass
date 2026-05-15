import { chromium } from '@playwright/test';
import * as otplib from 'otplib';

const { authenticator } = otplib;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[Diag-MFA] Missing required environment variable: ${name}`);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv('QA_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('QA_ADMIN_PASSWORD');
const ADMIN_MFA_SECRET = requireEnv('QA_ADMIN_MFA_SECRET');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('[Diag-MFA] Logging in to reach MFA screen...');
  await page.goto('https://google-play-changgoo-program.netlify.app/login');
  
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button:has-text("로그인")').last().click();
  
  // MFA 화면 대기
  await page.waitForTimeout(5000);
  
  console.log('[Diag-MFA] Current URL:', page.url());
  console.log('[Diag-MFA] Visible Buttons:', await page.locator('button').allTextContents());
  
  // MFA 입력란 구조 파악
  const inputs = await page.locator('input').evaluateAll(els => els.map(el => ({
    type: el.getAttribute('type'),
    ariaLabel: el.getAttribute('aria-label'),
    className: el.className
  })));
  console.log('[Diag-MFA] Found Inputs:', inputs);
  
  const bodyText = await page.innerText('body');
  console.log('[Diag-MFA] Body Text:', bodyText.substring(0, 500));
  console.log('[Diag-MFA] Current TOTP Preview:', authenticator.generate(ADMIN_MFA_SECRET));
  
  await browser.close();
})();
