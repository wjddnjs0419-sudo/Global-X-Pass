import { expect, test, type Page } from '@playwright/test';
import { confirmAdminModal, makeQaTitle, openAdminTab, robustLogin } from './utils/auth';

const postCases = [
  { category: 'notice', title: makeQaTitle('notice') },
  { category: 'news', title: makeQaTitle('news') },
  { category: 'events', title: makeQaTitle('events') },
  { category: 'media', title: makeQaTitle('media') },
];

async function fillQuill(page: Page, content: string) {
  const editor = page.locator('.ql-editor, [contenteditable="true"]').first();
  await editor.click();
  await editor.fill(content);
}

async function createPost(page: Page, category: string, title: string) {
  await openAdminTab(page, /게시물 작성/);
  await page.locator('form select').first().selectOption(category);
  await page.locator('input[placeholder="제목을 입력하세요"]').fill(title);

  if (category === 'media') {
    await page.getByRole('button', { name: /영상/ }).first().click();
    await page.locator('input[placeholder*="YouTube"], input[placeholder*="URL"]').first().fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }

  if (category === 'events') {
    const eventDateInput = page.locator('input[placeholder*="행사"], input[placeholder*="일시"]').first();
    if (await eventDateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await eventDateInput.fill('2026.05.17 QA');
    }
  }

  await fillQuill(page, `${title} content`);
  await page.getByRole('button', { name: '게시물 등록하기' }).click();
  await confirmAdminModal(page);
  await expect(page.getByRole('heading', { name: /게시물 관리/ })).toBeVisible({ timeout: 20000 });
  await findPostRow(page, title, { timeout: 20000 });
}

async function findPostRow(page: Page, title: string, options: { timeout?: number } = {}) {
  const timeout = options.timeout ?? 15000;
  const search = page.locator('input[placeholder*="검색"], input[type="search"]').first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(title);
  }
  const titleNode = page.getByText(title, { exact: true }).first();
  await expect(titleNode).toBeVisible({ timeout });
  const row = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="수정"] and .//button[normalize-space(.)="삭제"]][1]');
  await expect(row).toBeVisible({ timeout });
  return row;
}

async function maybeFindPostRow(page: Page, title: string) {
  await openAdminTab(page, /게시물 관리/);
  const search = page.locator('input[placeholder*="검색"], input[type="search"]').first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(title);
  }
  const titleNode = page.getByText(title, { exact: true }).first();
  if (!await titleNode.isVisible({ timeout: 1200 }).catch(() => false)) return null;
  const row = titleNode.locator('xpath=ancestor::div[.//button[normalize-space(.)="수정"] and .//button[normalize-space(.)="삭제"]][1]');
  return await row.isVisible({ timeout: 1200 }).catch(() => false) ? row : null;
}

async function deletePost(page: Page, title: string, options: { required?: boolean } = {}) {
  const row = options.required ? await findPostRow(page, title) : await maybeFindPostRow(page, title);
  if (!row) return;
  await row.getByRole('button', { name: '삭제' }).click();
  await confirmAdminModal(page);
  await expect(page.locator(`text=${title}`)).toHaveCount(0, { timeout: 20000 });
}

async function updatePostTitle(page: Page, title: string, updatedTitle: string) {
  await openAdminTab(page, /게시물 관리/);
  const row = await findPostRow(page, title);
  await row.getByRole('button', { name: '수정' }).click();
  await page.locator('input[placeholder="제목을 입력하세요"]').fill(updatedTitle);
  await page.getByRole('button', { name: '변경사항 저장' }).click();
  await confirmAdminModal(page);
  await findPostRow(page, updatedTitle, { timeout: 20000 });
}

test.describe('Admin Post CUD QA', () => {
  test.afterEach(async ({ page }) => {
    for (const item of postCases) {
      await deletePost(page, `${item.title}_updated`).catch(() => undefined);
      await deletePost(page, item.title).catch(() => undefined);
    }
  });

  test('공지/뉴스/행사/미디어 게시물을 생성하고 정리합니다', async ({ page }) => {
    await robustLogin(page);

    for (const item of postCases) {
      await createPost(page, item.category, item.title);
      await updatePostTitle(page, item.title, `${item.title}_updated`);
      await openAdminTab(page, /게시물 관리/);
      const search = page.locator('input[placeholder*="검색"], input[type="search"]').first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill(`${item.title}_updated`);
      }
      await findPostRow(page, `${item.title}_updated`);
    }
  });
});
