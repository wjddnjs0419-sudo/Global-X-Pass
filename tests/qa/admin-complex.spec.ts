import { expect, test } from '@playwright/test';
import { openAdminTab, robustLogin, robustLogout } from './utils/auth';

test.describe('Admin Smoke & Visual QA', () => {
  test('관리자 핵심 화면이 렌더링되고 동적 작성 폼이 전환됩니다', async ({ page }) => {
    await robustLogin(page);

    await openAdminTab(page, /게시물 관리/);
    await expect(page.locator('h3:has-text("게시물 관리")')).toBeVisible();

    const categoryFilter = page.locator('select').first();
    await categoryFilter.selectOption({ label: '공지사항' });
    await expect(page.locator('h3:has-text("게시물 관리")')).toBeVisible();

    await openAdminTab(page, /게시물 작성/);
    await expect(page.locator('h3:has-text("새 게시물 등록")')).toBeVisible();

    const categorySelector = page.locator('form select').first();
    for (const category of ['notice', 'events', 'news', 'media']) {
      await categorySelector.selectOption(category);
      await expect(page.locator('.quill, [contenteditable="true"]').first()).toBeVisible();
    }

    await page.goto('/mypage');
    await robustLogout(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });
});
