import { expect, type Page } from '@playwright/test';
import { generateSync } from 'otplib';

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[QA] Missing required environment variable: ${name}`);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv('QA_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('QA_ADMIN_PASSWORD');
const MFA_SECRET = requireEnv('QA_ADMIN_MFA_SECRET');

export function getQaRunId() {
  return process.env.GITHUB_RUN_ID?.trim() || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeQaTitle(label: string) {
  return `QA_E2E_${getQaRunId()}_${label}`;
}

export async function robustLogin(page: Page) {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  await emailInput.click();
  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.click();
  await passwordInput.fill(ADMIN_PASSWORD);
  await expect(emailInput).toHaveValue(ADMIN_EMAIL);
  await expect(passwordInput).not.toHaveValue('');

  await page.locator('button:has-text("로그인")').last().click();
  console.log('[QA] Login submitted.');

  await page.locator('text=2단계 인증').waitFor({ timeout: 15000 });
  const token = generateSync({ secret: MFA_SECRET });

  const otpInput = page.locator('input').first();
  await otpInput.waitFor({ state: 'attached' });
  await otpInput.fill(token);
  await otpInput.evaluate((el, val) => {
    (el as HTMLInputElement).value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, token);

  console.log('[QA] OTP token injected.');
  await page.waitForTimeout(1000);

  const verifyBtn = page.locator('button:has-text("인증 및 로그인")');
  const isEnabled = await verifyBtn.isEnabled().catch(() => false);
  if (isEnabled) {
    await verifyBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForURL(/.*admin|.*mypage/, { timeout: 20000 });
  console.log('[QA] Admin login completed.');
}

export async function robustLogout(page: Page) {
  const headerLogoutLink = page.getByRole('banner').getByRole('link', { name: /로그아웃|Logout/i });

  if (await headerLogoutLink.isVisible().catch(() => false)) {
    await headerLogoutLink.click();
  } else {
    await page.getByRole('button', { name: /메뉴 열기|Open menu/i }).click();
    const mobileLogoutLink = page
      .getByRole('dialog', { name: /모바일 메뉴/i })
      .getByRole('link', { name: /로그아웃|Logout/i });
    await mobileLogoutLink.click();
  }

  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
}

export async function openAdminTab(page: Page, label: RegExp | string) {
  await page.goto('/admin');
  const tabButton = page.locator('aside button').filter({ hasText: label }).first();
  await tabButton.waitFor({ state: 'visible', timeout: 15000 });
  await tabButton.click();
}

export async function confirmAdminModal(page: Page) {
  const confirmButton = page.getByRole('button', { name: '확인' });
  await confirmButton.click();
  await expect(confirmButton).toBeHidden({ timeout: 20000 });
}
