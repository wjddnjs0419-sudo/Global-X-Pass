import { expect, test, type Page } from '@playwright/test';
import {
  findByQaTitle,
  installQaFailureWatchdog,
  logoutIfNeeded,
  makeQaTitle,
  openAdminTab,
  robustLogin,
  robustUserLogin,
} from './utils/auth';

const sessionTheme = makeQaTitle('user-founders');

function getPublicFoundersCard(page: Page, title: string) {
  return page
    .getByRole('heading', { name: title, exact: true })
    .locator('xpath=ancestor::div[3]');
}

function getFutureSessionParts(daysAhead = 12) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    hour: '16',
    minute: '00',
  };
}

async function createFoundersSession(page: Page) {
  const session = getFutureSessionParts();

  await openAdminTab(page, /Founder's Club|파운더스/);
  await page.locator('input[placeholder*="테마"]').fill(sessionTheme);
  await page.locator('input[placeholder^="설명"]').fill('QA founders user flow');
  await page.locator('input[placeholder*="장소 이름"]').fill('QA 라운지');
  await page.locator('input[placeholder*="주소 또는 링크"]').fill('서울 QA Founder 링크');

  const selects = page.locator('select');
  await selects.nth(0).selectOption(session.year);
  await selects.nth(1).selectOption(session.month);
  await selects.nth(2).selectOption(session.day);
  await selects.nth(3).selectOption(session.hour);
  await selects.nth(4).selectOption(session.minute);
  await selects.nth(5).selectOption('2');

  await page.getByRole('button', { name: '세션 등록' }).click();
  await expect(findByQaTitle(page, sessionTheme)).toBeVisible({ timeout: 15000 });
}

async function closeFoundersSession(page: Page) {
  await openAdminTab(page, /Founder's Club|파운더스/);
  const row = findByQaTitle(page, sessionTheme).locator('xpath=ancestor::div[.//button[normalize-space(.)="신청 보기"]][1]');
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.locator('select').first().selectOption('closed');
  await expect(row.locator('span').filter({ hasText: /^마감$/ }).first()).toBeVisible({ timeout: 15000 });
}

async function deleteFoundersArtifacts(page: Page) {
  await openAdminTab(page, /Founder's Club|파운더스/);
  await page.getByRole('button', { name: '세션 관리' }).click();
  const sessionRow = findByQaTitle(page, sessionTheme).locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]');
  if (!await sessionRow.isVisible({ timeout: 5000 }).catch(() => false)) return;

  const applicationsButton = sessionRow.getByRole('button', { name: '신청 보기' });
  if (await applicationsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applicationsButton.click();

    while (true) {
      const deleteApplicationButton = page.getByRole('button', { name: '삭제' }).first();
      if (!await deleteApplicationButton.isVisible({ timeout: 1000 }).catch(() => false)) break;
      page.once('dialog', (dialog) => dialog.accept());
      await deleteApplicationButton.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: '세션 관리' }).click();
  }

  page.once('dialog', (dialog) => dialog.accept());
  await findByQaTitle(page, sessionTheme)
    .locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]')
    .getByRole('button', { name: '삭제' })
    .click();
  await expect(findByQaTitle(page, sessionTheme)).toHaveCount(0, { timeout: 20000 });
}

test.describe('User Founders Club QA', () => {
  test.setTimeout(180000);

  test('일반 유저가 Founders Club 신청 후 재신청 불가 상태와 공개 마감 표시를 확인합니다', async ({ page }) => {
    const assertNoRuntimeFailures = installQaFailureWatchdog(page, 'user founders club');

    try {
      await robustLogin(page);
      await deleteFoundersArtifacts(page).catch(() => undefined);
      await createFoundersSession(page);

      await logoutIfNeeded(page);
      await robustUserLogin(page);

      await page.goto('/founders-club');
      const card = getPublicFoundersCard(page, sessionTheme);
      await expect(card).toBeVisible({ timeout: 20000 });
      await card.getByRole('button', { name: /^지금 신청/ }).click();
      await page.locator('textarea[placeholder*="참여 동기"]').fill('QA founders application message');
      await page.getByRole('button', { name: '신청하기 (선착순)' }).click();

      await expect(page.getByText('신청 완료!', { exact: true })).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: '닫기' }).click();
      const updatedCard = getPublicFoundersCard(page, sessionTheme);
      await expect(updatedCard.getByText('신청 완료 — 검토 중', { exact: true })).toBeVisible({ timeout: 20000 });
      await expect(updatedCard.getByRole('button', { name: /^지금 신청/ })).toHaveCount(0);

      await logoutIfNeeded(page);
      await robustLogin(page);
      await closeFoundersSession(page);
      await logoutIfNeeded(page);

      await page.goto('/founders-club');
      const publicCard = getPublicFoundersCard(page, sessionTheme);
      await expect(publicCard.getByText('모집 마감', { exact: true })).toBeVisible({ timeout: 20000 });

      await assertNoRuntimeFailures();
    } finally {
      await logoutIfNeeded(page).catch(() => undefined);
      await robustLogin(page).catch(() => undefined);
      await deleteFoundersArtifacts(page).catch(() => undefined);
    }
  });
});
