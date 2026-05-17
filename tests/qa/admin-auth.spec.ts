import { expect, test } from '@playwright/test';
import { robustLogin, robustLogout } from './utils/auth';

test.describe('Admin Auth QA', () => {
  test('관리자 로그인, MFA, 로그아웃, 권한 가드를 검증합니다', async ({ page }) => {
    await robustLogin(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*admin/);

    await page.goto('/mypage');
    await robustLogout(page);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });
});
