import { expect, test, type Page } from '@playwright/test';
import {
  confirmAdminModal,
  findByQaTitle,
  installQaFailureWatchdog,
  logoutIfNeeded,
  makeQaTitle,
  openAdminTab,
  robustLogin,
  robustUserLogin,
} from './utils/auth';

const eventTitle = makeQaTitle('user-event');

function getFutureDeadline(daysAhead = 14) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(23, 0, 0, 0);

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    hour: String(date.getHours()).padStart(2, '0'),
    minute: String(date.getMinutes()).padStart(2, '0'),
    display: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (QA) 18:00`,
  };
}

async function fillQuill(page: Page, content: string) {
  const editor = page.locator('.ql-editor, [contenteditable="true"]').first();
  await editor.click();
  await editor.fill(content);
}

async function findPostRow(page: Page, title: string) {
  const search = page.locator('input[placeholder*="검색"], input[type="search"]').first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(title);
  }

  const titleNode = findByQaTitle(page, title);
  await expect(titleNode).toBeVisible({ timeout: 20000 });
  const row = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="수정"] and .//button[normalize-space(.)="삭제"]][1]');
  await expect(row).toBeVisible({ timeout: 20000 });
  return row;
}

async function deleteEventPost(page: Page, title: string) {
  await openAdminTab(page, /게시물 관리/);
  const row = await findPostRow(page, title).catch(() => null);
  if (!row) return;
  await row.getByRole('button', { name: '삭제' }).click();
  await confirmAdminModal(page);
  await expect(findByQaTitle(page, title)).toHaveCount(0, { timeout: 20000 });
}

async function createEventForApplication(page: Page, title: string) {
  const deadline = getFutureDeadline();

  await openAdminTab(page, /게시물 작성/);
  await page.locator('form select').first().selectOption('events');
  await page.locator('input[placeholder="제목을 입력하세요"]').fill(title);

  const eventPanel = page.locator('p').filter({ hasText: '행사 상세 정보' }).locator('xpath=..');
  const panelSelects = eventPanel.locator('select');
  await panelSelects.nth(0).selectOption('접수중');
  await page.locator('input[placeholder="2026.05.08 (목) 18:00"]').fill(deadline.display);
  await page.locator('input[placeholder="서울 강남 NCF 센터"]').fill('QA 행사 신청 검증장');
  await page.locator('input[placeholder="200"]').fill('12');
  await panelSelects.nth(1).selectOption(deadline.year);
  await panelSelects.nth(2).selectOption(deadline.month);
  await panelSelects.nth(3).selectOption(deadline.day);
  await panelSelects.nth(4).selectOption(deadline.hour);
  await panelSelects.nth(5).selectOption(deadline.minute);

  await fillQuill(page, `${title} event content`);
  await page.getByRole('button', { name: '게시물 등록하기' }).click();
  await confirmAdminModal(page);
  await expect(page.getByRole('heading', { name: /게시물 관리/ })).toBeVisible({ timeout: 20000 });
}

async function cancelEventApplicationFromMyPage(page: Page, title: string) {
  await page.goto('/mypage');
  const cardTitle = findByQaTitle(page, title);
  if (!await cardTitle.isVisible({ timeout: 5000 }).catch(() => false)) return;

  const card = cardTitle.locator('xpath=ancestor::div[.//button[@aria-label="행사 신청 취소"]][1]');
  page.once('dialog', (dialog) => dialog.accept());
  await card.getByRole('button', { name: '행사 신청 취소' }).click();
  await expect(card.getByText('취소', { exact: true })).toBeVisible({ timeout: 20000 });
}

test.describe('User Event Application QA', () => {
  test.setTimeout(180000);

  test('일반 유저가 행사 신청 후 재진입 시 기존 신청 상태를 확인합니다', async ({ page }) => {
    const assertNoRuntimeFailures = installQaFailureWatchdog(page, 'user event application');
    let applicationUrl = '';

    try {
      await robustLogin(page);
      await deleteEventPost(page, eventTitle).catch(() => undefined);
      await createEventForApplication(page, eventTitle);

      await logoutIfNeeded(page);
      await robustUserLogin(page);

      await page.goto('/events');
      const titleNode = findByQaTitle(page, eventTitle);
      await expect(titleNode).toBeVisible({ timeout: 20000 });
      const card = titleNode.locator('xpath=ancestor::*[.//a[contains(normalize-space(.), "신청하기")]][1]');
      await card.getByRole('link', { name: /신청하기/ }).click();

      applicationUrl = page.url();

      await page.locator('input[placeholder*="기업명"]').fill('QA Event Company');
      await page.locator('input[placeholder*="성함"]').fill('QA Event User');
      await page.locator('input[placeholder*="직책"]').fill('QA Lead');
      await page.locator('input[placeholder*="이메일 주소"]').fill('qa-user@example.com');
      await page.locator('input[placeholder="연락처"]').fill('010-1111-2222');
      await page.locator('textarea').first().fill('행사 신청 자동화 회귀를 검증합니다.');
      await page.locator('input[type="checkbox"]').nth(0).check();
      await page.locator('input[type="checkbox"]').last().check();
      await page.getByRole('button', { name: '신청 제출' }).click();

      await expect(page.getByText('신청이 접수되었습니다.', { exact: true })).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole('link', { name: '내 신청 내역 보기' })).toBeVisible();

      await page.goto(applicationUrl);
      await expect(page.getByText('검토중', { exact: true })).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole('link', { name: '내 신청 내역 보기' })).toBeVisible();
      await expect(page.getByRole('button', { name: '신청 제출' })).toHaveCount(0);

      await assertNoRuntimeFailures();
    } finally {
      await cancelEventApplicationFromMyPage(page, eventTitle).catch(() => undefined);
      await logoutIfNeeded(page).catch(() => undefined);
      await robustLogin(page).catch(() => undefined);
      await deleteEventPost(page, eventTitle).catch(() => undefined);
    }
  });
});
