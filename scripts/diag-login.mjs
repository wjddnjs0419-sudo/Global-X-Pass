import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('[Diagnostic] Navigating to login page...');
  await page.goto('https://google-play-changgoo-program.netlify.app/login');
  await page.waitForLoadState('networkidle');
  
  console.log('[Diagnostic] Page Title:', await page.title());
  
  // 모든 버튼 텍스트 확인
  const buttons = await page.locator('button').allTextContents();
  console.log('[Diagnostic] Found Buttons:', buttons);
  
  // 모든 입력란 확인
  const inputs = await page.locator('input').evaluateAll(els => els.map(el => ({
    type: el.getAttribute('type'),
    placeholder: el.getAttribute('placeholder'),
    name: el.getAttribute('name')
  })));
  console.log('[Diagnostic] Found Inputs:', inputs);
  
  // 페이지 내 모든 텍스트 확인 (에러 메시지 등)
  const bodyText = await page.innerText('body');
  console.log('[Diagnostic] Page Text Snippet:', bodyText.substring(0, 500));
  
  await browser.close();
})();
