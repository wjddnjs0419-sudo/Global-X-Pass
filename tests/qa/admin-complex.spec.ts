import { test, expect, type Page } from '@playwright/test';
import { generateSync } from 'otplib';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[QA] Missing required environment variable: ${name}`);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv('QA_ADMIN_EMAIL');
const ADMIN_PW = requireEnv('QA_ADMIN_PASSWORD');
const MFA_SECRET = requireEnv('QA_ADMIN_MFA_SECRET');

async function robustLogin(page: Page) {
  await page.goto('/login');
  
  // 1. 이메일/비번 입력
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PW);
  
  // 2. 로그인 클릭
  await page.locator('button:has-text("로그인")').last().click();
  console.log('[QA] Login button clicked.');
  
  // 3. MFA 대기 및 처리
  await page.locator('text=2단계 인증').waitFor({ timeout: 15000 });
  const token = generateSync({ secret: MFA_SECRET });
  console.log(`[QA] MFA token generated: ${token}`);
  
  // input-otp 컴포넌트 대응: 더 강력한 입력 방식 사용
  const otpInput = page.locator('input').first();
  await otpInput.waitFor({ state: 'attached' });
  
  // 1. 직접 fill 시도 (대부분의 이벤트를 자동으로 발생시킴)
  await otpInput.fill(token);
  
  // 2. 브라우저 내부 스크립트로 input 이벤트 강제 트리거 (버튼 활성화 유도)
  await otpInput.evaluate((el, val) => {
    (el as HTMLInputElement).value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, token);
  
  console.log('[QA] OTP token injected and events dispatched.');
  await page.waitForTimeout(1000);
  
  // 4. 인증 버튼 클릭 및 대시보드 진입
  const verifyBtn = page.locator('button:has-text("인증 및 로그인")');
  
  // 버튼이 활성화될 때까지 기다리되, 안 되면 Enter 키로 전송 시도
  const isEnabled = await verifyBtn.isEnabled().catch(() => false);
  if (!isEnabled) {
    console.log('[QA] Button still disabled, pressing Enter key as fallback...');
    await page.keyboard.press('Enter');
  } else {
    await verifyBtn.click();
  }
  await page.waitForURL(/.*admin|.*mypage/, { timeout: 20000 });
  console.log('[QA] Successfully logged in and reached dashboard.');
}

async function robustLogout(page: Page) {
  const headerLogoutLink = page.getByRole('banner').getByRole('link', { name: /로그아웃|Logout/i });

  if (await headerLogoutLink.isVisible().catch(() => false)) {
    await headerLogoutLink.click();
  } else {
    console.log('[QA] Header logout hidden, opening mobile menu fallback...');
    await page.getByRole('button', { name: /메뉴 열기|Open menu/i }).click();
    const mobileLogoutLink = page.getByRole('dialog', { name: /모바일 메뉴/i }).getByRole('link', { name: /로그아웃|Logout/i });
    await mobileLogoutLink.click();
  }

  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
}

test.describe('Admin Master QA Suite (Sequential)', () => {
  
  test('관리자 풀 사이클 검증 (로그인 -> 시각적 무결성 -> 로그아웃)', async ({ page }) => {
    // 1. 로그인 단계
    await robustLogin(page);

    // 2. 게시물 관리 페이지로 이동
    console.log('[QA] Navigating to Post Management via Sidebar...');
    await page.goto('/admin');
    
    // 사이드바에서 '게시물 관리' 버튼 클릭 (더 정교한 셀렉터)
    const postManageBtn = page.locator('aside button:has-text("게시물 관리")').first();
    await postManageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await postManageBtn.click();
    await page.waitForTimeout(2000);
    
    // [사용자 힌트 반영] 검색어 입력 왼쪽의 탭(카테고리 필터) 눌러서 글 확인
    console.log('[QA] Interacting with category filter (left of search input)...');
    const categoryFilter = page.locator('select').first(); // 검색창 왼쪽의 카테고리 필터
    await categoryFilter.selectOption({ label: '공지사항' });
    await page.waitForTimeout(1000);
    
    // 게시물 목록 로드 확인 (제목 태그 명시)
    await expect(page.locator('h3:has-text("게시물 관리")')).toBeVisible();
    const postItems = await page.locator('div[style*="background: var(--color-surface-card)"]').count();
    console.log(`[QA] Found ${postItems} posts in notice category.`);

    // 3. 게시물 작성 페이지로 이동
    console.log('[QA] Moving to Post Create screen...');
    const postCreateBtn = page.locator('aside button:has-text("게시물 작성")').first();
    await postCreateBtn.click();
    await page.waitForTimeout(3000);
    
    console.log('[QA] Post Create screen reached. Checking for form components...');
    
    // 카테고리 선택 UI (작성 폼 내부)
    const categorySelector = page.locator('form select').first();
    if (await categorySelector.isVisible()) {
      const categories = ['notice', 'events', 'news'];
      for (const cat of categories) {
        console.log(`[QA] Testing form category transition: ${cat}`);
        await categorySelector.selectOption(cat);
        await page.waitForTimeout(1000);
        // 에디터 존재 확인
        await expect(page.locator('.quill, [contenteditable="true"]').first()).toBeVisible();
      }
    }
    console.log('[QA] Visual integrity check complete.');

    // 3. 로그아웃 및 권한 가드 검증
    await page.goto('/mypage');
    
    await robustLogout(page);
    
    // 관리자 페이지 재진입 시도 (차단되어야 함)
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
    console.log('[QA] Admin guard and logout verified.');
  });
});
