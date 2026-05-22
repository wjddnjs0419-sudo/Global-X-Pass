import { expect, test, type Page } from '@playwright/test';
import { installQaFailureWatchdog, makeQaTitle, openAdminTab, robustLogin } from './utils/auth';

const consultantName = makeQaTitle('consultant');
const updatedConsultantName = `${consultantName}_updated`;
const foundersTheme = makeQaTitle('founders');

async function chooseFirstSelectOption(page: Page, selectIndex: number) {
  const select = page.locator('select').nth(selectIndex);
  const options = await select.locator('option').evaluateAll((items) =>
    items.map((item) => (item as HTMLOptionElement).value).filter(Boolean),
  );
  if (!options[0]) throw new Error(`[QA] select index ${selectIndex} has no selectable option`);
  await select.selectOption(options[0]);
  return options[0];
}

async function findVisibleItem(page: Page, title: string) {
  const titleNode = page.getByText(title, { exact: true }).first();
  await expect(titleNode).toBeVisible({ timeout: 15000 });
  const item = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]');
  await expect(item).toBeVisible();
  return item;
}

async function deleteVisibleItem(page: Page, title: string) {
  const titleNode = page.getByText(title, { exact: true }).first();
  if (!await titleNode.isVisible({ timeout: 1200 }).catch(() => false)) return;

  const item = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="삭제"]][1]');
  const deleteButton = item.getByRole('button', { name: '삭제' }).last();
  page.once('dialog', (dialog) => dialog.accept());
  await deleteButton.click();
  await expect(titleNode).toBeHidden({ timeout: 15000 }).catch(() => undefined);
}

async function updateConsultant(page: Page) {
  const item = await findVisibleItem(page, consultantName);
  await item.getByRole('button', { name: '수정' }).click();
  await item.locator('input[placeholder="이름"]').last().fill(updatedConsultantName);
  await item.locator('input[placeholder^="전문 분야"]').last().fill('QA updated expertise');
  await item.locator('input[placeholder^="소개"]').last().fill('QA updated consultant bio');
  await item.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText(updatedConsultantName, { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('QA updated expertise', { exact: true })).toBeVisible();
}

async function verifyConsultantPublicSurface(page: Page) {
  await page.goto('/consulting');
  const titleNode = page.getByText(updatedConsultantName, { exact: true }).first();
  await expect(titleNode).toBeVisible({ timeout: 20000 });
  const card = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="예약 신청"]][1]');
  await expect(card.getByText('QA updated consultant bio', { exact: true })).toBeVisible();
  await expect(card.getByText('QA updated expertise', { exact: true })).toBeVisible();
}

async function verifyFoundersPublicSurface(page: Page, expectedStatus: '모집중' | '마감') {
  await page.goto('/founders-club');
  const titleNode = page.getByText(foundersTheme, { exact: true }).first();
  await expect(titleNode).toBeVisible({ timeout: 20000 });
  const card = titleNode.locator('xpath=ancestor::div[.//span[contains(normalize-space(.), "확정")]][1]');
  await expect(card.getByText('QA founders session', { exact: true })).toBeVisible();
  await expect(card.getByText(expectedStatus, { exact: true })).toBeVisible();
}

test.describe('Admin Program Management QA', () => {
  test.afterEach(async ({ page }) => {
    await openAdminTab(page, /컨설팅/).catch(() => undefined);
    await deleteVisibleItem(page, updatedConsultantName).catch(() => undefined);
    await deleteVisibleItem(page, consultantName).catch(() => undefined);
    await openAdminTab(page, /Founder's Club/).catch(() => undefined);
    await deleteVisibleItem(page, foundersTheme).catch(() => undefined);
  });

  test('컨설팅 전문가/Founders Club 세션 CUD 기본 흐름을 검증합니다', async ({ page }) => {
    const assertNoRuntimeFailures = installQaFailureWatchdog(page, 'admin program management CUD');
    await robustLogin(page);

    await openAdminTab(page, /컨설팅/);
    await expect(page.getByRole('button', { name: '전문가 등록' })).toBeVisible();
    await page.locator('input').first().fill(consultantName);
    await chooseFirstSelectOption(page, 0);
    await page.locator('input[placeholder^="전문 분야"]').fill('QA expertise');
    await page.locator('input[placeholder^="소개"]').fill('QA consultant bio');
    await page.getByRole('button', { name: '전문가 등록' }).click();
    await expect(page.getByText(consultantName)).toBeVisible({ timeout: 15000 });
    await updateConsultant(page);
    await verifyConsultantPublicSurface(page);
    await openAdminTab(page, /컨설팅/);
    await deleteVisibleItem(page, updatedConsultantName);

    await openAdminTab(page, /Founder's Club|파운더스/);
    await expect(page.getByText('새 세션 등록')).toBeVisible();
    await page.locator('input').first().fill(foundersTheme);
    await page.locator('input[placeholder^="설명"]').fill('QA founders session');
    await chooseFirstSelectOption(page, 0);
    await chooseFirstSelectOption(page, 1);
    await chooseFirstSelectOption(page, 2);
    await page.getByRole('button', { name: '세션 등록' }).click();
    await expect(page.getByText(foundersTheme)).toBeVisible({ timeout: 15000 });
    await verifyFoundersPublicSurface(page, '모집중');
    await openAdminTab(page, /Founder's Club|파운더스/);
    const foundersItem = await findVisibleItem(page, foundersTheme);
    await foundersItem.locator('select').first().selectOption('closed');
    await expect(foundersItem.getByText('마감', { exact: true })).toBeVisible({ timeout: 15000 });
    await verifyFoundersPublicSurface(page, '마감');
    await openAdminTab(page, /Founder's Club|파운더스/);
    await deleteVisibleItem(page, foundersTheme);
    await assertNoRuntimeFailures();
  });
});
