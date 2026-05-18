import { expect, test } from '@playwright/test';
import {
  beginAdminOtpChallenge,
  getAdminCredentials,
  installQaFailureWatchdog,
  logoutIfNeeded,
  robustUserLogin,
  submitOtpCode,
} from './utils/auth';

test.describe('Admin Auth Negative QA', () => {
  test('잘못된 관리자 인증과 비관리자 접근 차단을 검증합니다', async ({ page }) => {
    const assertNoRuntimeFailures = installQaFailureWatchdog(page, 'admin auth negative');
    const admin = getAdminCredentials();

    let invalidPasswordAlert = '';
    page.once('dialog', async (dialog) => {
      invalidPasswordAlert = dialog.message();
      await dialog.accept();
    });
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill(admin.email);
    await page.locator('input[type="password"]').first().fill(`${admin.password}__wrong`);
    await page.getByRole('button', { name: '로그인' }).last().click();
    await expect.poll(() => invalidPasswordAlert, { timeout: 10000 }).toContain('로그인 실패');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('2단계 인증')).toHaveCount(0);

    await beginAdminOtpChallenge(page);
    let invalidOtpAlert = '';
    page.once('dialog', async (dialog) => {
      invalidOtpAlert = dialog.message();
      await dialog.accept();
    });
    await submitOtpCode(page, '000000');
    await expect.poll(() => invalidOtpAlert, { timeout: 10000 }).toContain('인증 오류');
    await expect(page.getByRole('button', { name: '인증 및 로그인' })).toBeVisible({ timeout: 10000 });

    await page.goto('/mypage');
    await logoutIfNeeded(page);

    await robustUserLogin(page);
    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });

    await assertNoRuntimeFailures();
  });
});
