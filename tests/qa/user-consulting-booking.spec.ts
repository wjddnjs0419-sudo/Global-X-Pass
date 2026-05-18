import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  findByQaTitle,
  installQaFailureWatchdog,
  logoutIfNeeded,
  makeQaTitle,
  openAdminTab,
  robustLogin,
  robustUserLogin,
} from './utils/auth';

const consultantName = makeQaTitle('user-consulting');

function getFutureSlotParts(daysAhead = 10) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    timeLabel: '14:00',
    hour: '14',
    minute: '00',
  };
}

function getConsultingCard(page: Page, title: string) {
  const titleNode = findByQaTitle(page, title);
  return {
    titleNode,
    card: titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="예약 신청"]][1]'),
  };
}

async function openConsultingBookingModal(page: Page, title: string, slotTimeLabel?: string) {
  const { titleNode, card } = getConsultingCard(page, title);
  await expect(titleNode).toBeVisible({ timeout: 20000 });
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.getByRole('button', { name: '예약 신청' }).click();

  const modalHeading = page.getByText('예약 가능한 시간 선택', { exact: true });
  const emptyState = page.getByText('현재 예약 가능한 슬롯이 없습니다.', { exact: true });

  await expect(modalHeading).toBeVisible({ timeout: 20000 });
  if (slotTimeLabel) {
    const slotButton = page.getByRole('button', { name: new RegExp(slotTimeLabel) });
    await expect.poll(
      async () => ({
        hasSlot: await slotButton.count(),
        hasEmptyState: await emptyState.count(),
      }),
      { timeout: 20000, intervals: [250, 500, 1000] },
    ).toEqual({ hasSlot: 1, hasEmptyState: 0 });
    return;
  }

  await expect(emptyState).toBeVisible({ timeout: 20000 });
}

async function selectFirstNonEmptyOption(select: Locator) {
  const value = await select.locator('option').evaluateAll((options) => {
    const option = options.find((item) => Boolean((item as HTMLOptionElement).value));
    return (option as HTMLOptionElement | undefined)?.value ?? '';
  });
  if (!value) throw new Error('[QA] No selectable option found');
  await select.selectOption(value);
}

async function selectOptionContaining(select: Locator, text: string) {
  const value = await select.locator('option').evaluateAll((options, needle) => {
    const option = options.find((item) => {
      const element = item as HTMLOptionElement;
      return Boolean(element.value) && (element.textContent || '').includes(String(needle));
    });
    return (option as HTMLOptionElement | undefined)?.value ?? '';
  }, text);
  if (!value) throw new Error(`[QA] Option containing "${text}" not found`);
  await select.selectOption(value);
}

async function createConsultantAndSlot(page: Page) {
  const slot = getFutureSlotParts();

  await openAdminTab(page, /컨설팅/);
  await page.locator('input[placeholder="이름"]').fill(consultantName);
  await selectFirstNonEmptyOption(page.locator('select').first());
  await page.locator('input[placeholder^="전문 분야"]').fill('QA booking expertise');
  await page.locator('input[placeholder^="소개"]').fill('QA consulting booking flow');
  await page.getByRole('button', { name: '전문가 등록' }).click();
  await expect(findByQaTitle(page, consultantName)).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: '슬롯 관리' }).click();
  const slotSelects = page.locator('select');
  await selectOptionContaining(slotSelects.nth(0), consultantName);
  await page.locator('input[placeholder*="장소 이름"]').fill('QA 상담실');
  await page.locator('input[placeholder*="주소 또는 링크"]').fill('서울 QA 상담 링크');
  await slotSelects.nth(1).selectOption(slot.year);
  await slotSelects.nth(2).selectOption(slot.month);
  await slotSelects.nth(3).selectOption(slot.day);
  await slotSelects.nth(4).selectOption(slot.hour);
  await slotSelects.nth(5).selectOption(slot.minute);
  await page.getByRole('button', { name: '슬롯 추가' }).click();

  await expect(page.getByText(`${slot.year}-${slot.month}-${slot.day} ${slot.timeLabel}`, { exact: false })).toBeVisible({ timeout: 20000 });
}

async function cancelConsultingReservation(page: Page) {
  await page.goto('/mypage');
  const cardTitle = findByQaTitle(page, consultantName);
  if (!await cardTitle.isVisible({ timeout: 5000 }).catch(() => false)) return;

  const card = cardTitle.locator('xpath=ancestor::div[.//button[@aria-label="컨설팅 신청 취소"]][1]');
  page.once('dialog', (dialog) => dialog.accept());
  await card.getByRole('button', { name: '컨설팅 신청 취소' }).click();
  await expect(card.getByText('취소', { exact: true })).toBeVisible({ timeout: 20000 });
}

async function cleanupConsultant(page: Page, slot = getFutureSlotParts()) {
  await openAdminTab(page, /컨설팅/);
  await page.getByRole('button', { name: '슬롯 관리' }).click();

  const slotSelect = page.locator('select').first();
  if (await slotSelect.isVisible().catch(() => false)) {
    await selectOptionContaining(slotSelect, consultantName).catch(() => undefined);
    const slotRow = page.getByText(`${slot.year}-${slot.month}-${slot.day} ${slot.timeLabel}`, { exact: false })
      .locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]')
      .first();
    if (await slotRow.isVisible({ timeout: 1000 }).catch(() => false)) {
      const deleteButton = slotRow.getByRole('button', { name: '삭제' }).first();
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
      }
    }
  }

  await page.getByRole('button', { name: '전문가 관리' }).click();
  const titleNode = findByQaTitle(page, consultantName);
  if (!await titleNode.isVisible({ timeout: 5000 }).catch(() => false)) return;

  const row = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]');
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: '삭제' }).click();
  await expect(findByQaTitle(page, consultantName)).toHaveCount(0, { timeout: 20000 });
}

test.describe('User Consulting Booking QA', () => {
  test.setTimeout(180000);

  test('일반 유저가 컨설팅을 예약하고 같은 슬롯이 다시 노출되지 않는지 확인합니다', async ({ page }) => {
    const assertNoRuntimeFailures = installQaFailureWatchdog(page, 'user consulting booking');
    const slot = getFutureSlotParts();

    try {
      await robustLogin(page);
      await cleanupConsultant(page, slot).catch(() => undefined);
      await createConsultantAndSlot(page);

      await logoutIfNeeded(page);
      await robustUserLogin(page);

      await page.goto('/consulting');
      await openConsultingBookingModal(page, consultantName, slot.timeLabel);
      await page.getByRole('button', { name: new RegExp(slot.timeLabel) }).click();
      await page.locator('textarea[placeholder*="상담 받고 싶은 내용"]').fill('QA consulting reservation validation');
      await page.getByRole('button', { name: '컨설팅 신청하기' }).click();

      await expect(page.getByText('신청 완료!', { exact: true })).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: '닫기' }).click();

      await page.goto('/mypage');
      await expect(findByQaTitle(page, consultantName)).toBeVisible({ timeout: 20000 });

      await page.goto('/consulting');
      await openConsultingBookingModal(page, consultantName);

      await assertNoRuntimeFailures();
    } finally {
      await cancelConsultingReservation(page).catch(() => undefined);
      await logoutIfNeeded(page).catch(() => undefined);
      await robustLogin(page).catch(() => undefined);
      await cleanupConsultant(page, slot).catch(() => undefined);
    }
  });
});
