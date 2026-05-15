import { test, expect } from '@playwright/test';

test.describe('Production Smoke Test', () => {
  test('홈페이지가 정상적으로 로드되어야 합니다', async ({ page }) => {
    await page.goto('/');
    
    // 타이틀 확인 (Global X Pass가 포함되어 있는지)
    await expect(page).toHaveTitle(/Global X Pass/);
    
    // 핵심 네비게이션 요소 확인
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // 주요 섹션 확인 (공지사항, 뉴스 등 메인 요소 중 하나)
    // 사이트의 실제 텍스트나 요소를 기반으로 보정 필요
    await expect(page.locator('body')).toContainText('Global X Pass');
  });

  test('주요 메뉴 접근성 확인', async ({ page }) => {
    await page.goto('/');
    
    // 공지사항 페이지 이동 확인
    const noticeLink = page.getByRole('link', { name: /공지사항|Notice/i }).first();
    if (await noticeLink.isVisible()) {
      await noticeLink.click();
      await expect(page).toHaveURL(/.*notice/);
    }
  });

  test('로그인 페이지 진입 확인', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
