import { expect, test, type Page } from '@playwright/test';
import { makeQaTitle, openAdminTab, robustLogin } from './utils/auth';

const consultantName = makeQaTitle('consultant');
const foundersTheme = makeQaTitle('founders');

async function chooseFirstSelectOption(page: Page, selectIndex: number) {
  const select = page.locator('select').nth(selectIndex);
  const options = await select.locator('option').evaluateAll((items) =>
    items.map((item) => (item as HTMLOptionElement).value).filter(Boolean),
  );
  if (options[0]) await select.selectOption(options[0]);
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

test.describe('Admin Program Management QA', () => {
  test.afterEach(async ({ page }) => {
    await openAdminTab(page, /컨설팅/).catch(() => undefined);
    await deleteVisibleItem(page, consultantName).catch(() => undefined);
    await openAdminTab(page, /Founder's Club/).catch(() => undefined);
    await deleteVisibleItem(page, foundersTheme).catch(() => undefined);
  });

  test('컨설팅 전문가/Founders Club 세션 CUD 기본 흐름을 검증합니다', async ({ page }) => {
    await robustLogin(page);

    await openAdminTab(page, /컨설팅/);
    await expect(page.getByRole('button', { name: '전문가 등록' })).toBeVisible();
    await page.locator('input').first().fill(consultantName);
    await chooseFirstSelectOption(page, 0);
    await page.locator('input[placeholder^="전문 분야"]').fill('QA expertise');
    await page.locator('input[placeholder^="소개"]').fill('QA consultant bio');
    await page.getByRole('button', { name: '전문가 등록' }).click();
    await expect(page.getByText(consultantName)).toBeVisible({ timeout: 15000 });
    await deleteVisibleItem(page, consultantName);

    await openAdminTab(page, /Founder's Club|파운더스/);
    await expect(page.getByText('새 세션 등록')).toBeVisible();
    await page.locator('input').first().fill(foundersTheme);
    await page.locator('textarea').first().fill('QA founders session');
    await chooseFirstSelectOption(page, 0);
    await chooseFirstSelectOption(page, 1);
    await chooseFirstSelectOption(page, 2);
    await page.getByRole('button', { name: '세션 등록' }).click();
    await expect(page.getByText(foundersTheme)).toBeVisible({ timeout: 15000 });
    await deleteVisibleItem(page, foundersTheme);
  });
});
