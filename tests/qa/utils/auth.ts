import { expect, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';
import { generateSync } from 'otplib';

type AdminCredentials = {
  email: string;
  password: string;
  mfaSecret: string;
};

type UserCredentials = {
  email: string;
  password: string;
};

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[QA] Missing required environment variable: ${name}`);
  }
  return value;
}

export function getQaRunId() {
  return process.env.GITHUB_RUN_ID?.trim() || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeQaTitle(label: string) {
  return `QA_E2E_${getQaRunId()}_${label}`;
}

export function getAdminCredentials(): AdminCredentials {
  return {
    email: requireEnv('QA_ADMIN_EMAIL'),
    password: requireEnv('QA_ADMIN_PASSWORD'),
    mfaSecret: requireEnv('QA_ADMIN_MFA_SECRET'),
  };
}

export function getUserCredentials(): UserCredentials {
  return {
    email: requireEnv('QA_USER_EMAIL'),
    password: requireEnv('QA_USER_PASSWORD'),
  };
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.click();
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.fill(password);
  await expect(emailInput).toHaveValue(email);
  await expect(passwordInput).not.toHaveValue('');
}

async function submitPrimaryLogin(page: Page) {
  await page.locator('button:has-text("로그인")').last().click();
  console.log('[QA] Login submitted.');
}

export async function beginAdminOtpChallenge(
  page: Page,
  overrides: Partial<Pick<AdminCredentials, 'email' | 'password'>> = {},
) {
  const credentials = getAdminCredentials();
  const email = overrides.email ?? credentials.email;
  const password = overrides.password ?? credentials.password;

  await fillLoginForm(page, email, password);
  await submitPrimaryLogin(page);
  await page.locator('text=2단계 인증').waitFor({ timeout: 15000 });

  return {
    email,
    password,
    mfaSecret: credentials.mfaSecret,
  };
}

export async function submitOtpCode(page: Page, code: string) {
  const otpInput = page.locator('input').first();
  await otpInput.waitFor({ state: 'attached' });
  await otpInput.fill(code);
  await otpInput.evaluate((el, val) => {
    (el as HTMLInputElement).value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, code);

  await page.waitForTimeout(1000);

  const verifyBtn = page.locator('button:has-text("인증 및 로그인")');
  const isEnabled = await verifyBtn.isEnabled().catch(() => false);
  if (isEnabled) {
    await verifyBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }
}

export async function robustLogin(page: Page) {
  const credentials = await beginAdminOtpChallenge(page);
  const token = generateSync({ secret: credentials.mfaSecret });
  console.log('[QA] OTP token injected.');
  await submitOtpCode(page, token);
  await page.waitForURL(/.*admin|.*mypage/, { timeout: 20000 });
  console.log('[QA] Admin login completed.');
}

export async function robustUserLogin(page: Page) {
  const credentials = getUserCredentials();
  await fillLoginForm(page, credentials.email, credentials.password);
  await submitPrimaryLogin(page);
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 20000 });
  console.log('[QA] User login completed.');
}

function getHeaderLogoutLink(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: /로그아웃|Logout/i });
}

function getHeaderLoginLink(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: /로그인|Login/i });
}

export async function logoutIfNeeded(page: Page) {
  if (page.url().includes('/login')) return false;

  const headerLogoutLink = getHeaderLogoutLink(page);
  if (await headerLogoutLink.isVisible().catch(() => false)) {
    await robustLogout(page);
    return true;
  }

  const headerLoginLink = getHeaderLoginLink(page);
  if (await headerLoginLink.isVisible().catch(() => false)) {
    return false;
  }

  const mobileMenuButton = page.getByRole('button', { name: /메뉴 열기|Open menu/i });
  if (!await mobileMenuButton.isVisible().catch(() => false)) {
    return false;
  }

  await mobileMenuButton.click();
  const mobileLogoutLink = page
    .getByRole('dialog', { name: /모바일 메뉴/i })
    .getByRole('link', { name: /로그아웃|Logout/i });

  if (await mobileLogoutLink.isVisible().catch(() => false)) {
    await mobileLogoutLink.click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
    return true;
  }

  return false;
}

export async function robustLogout(page: Page) {
  const headerLogoutLink = getHeaderLogoutLink(page);

  if (await headerLogoutLink.isVisible().catch(() => false)) {
    await headerLogoutLink.click();
  } else {
    await page.getByRole('button', { name: /메뉴 열기|Open menu/i }).click();
    const mobileLogoutLink = page
      .getByRole('dialog', { name: /모바일 메뉴/i })
      .getByRole('link', { name: /로그아웃|Logout/i });
    await mobileLogoutLink.click();
  }

  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
}

export async function openAdminTab(page: Page, label: RegExp | string) {
  await page.goto('/admin');
  const tabButton = page.locator('aside button').filter({ hasText: label }).first();
  await tabButton.waitFor({ state: 'visible', timeout: 15000 });
  await tabButton.click();
}

export async function confirmAdminModal(page: Page) {
  const confirmButton = page.getByRole('button', { name: '확인' });
  await confirmButton.click();
  await expect(confirmButton).toBeHidden({ timeout: 20000 });
}

export function findByQaTitle(page: Page, title: string) {
  return page.getByText(title, { exact: true }).first();
}

function isMonitoredRequest(request: Request) {
  return ['document', 'script', 'xhr', 'fetch'].includes(request.resourceType());
}

function isIgnoredConsoleError(message: ConsoleMessage) {
  const text = message.text();
  return text.includes('Failed to load resource:');
}

function formatRequestFailure(request: Request) {
  const failure = request.failure();
  return `${request.method()} ${request.url()} failed${failure?.errorText ? `: ${failure.errorText}` : ''}`;
}

function formatResponseFailure(response: Response) {
  const request = response.request();
  return `${response.status()} ${request.method()} ${response.url()}`;
}

export function installQaFailureWatchdog(page: Page, label: string) {
  const failures: string[] = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error' && !isIgnoredConsoleError(message)) {
      failures.push(`console.error: ${message.text()}`);
    }
  });

  page.on('requestfailed', (request) => {
    if (isMonitoredRequest(request)) {
      failures.push(`requestfailed: ${formatRequestFailure(request)}`);
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 500 && isMonitoredRequest(response.request())) {
      failures.push(`response ${formatResponseFailure(response)}`);
    }
  });

  return async () => {
    if (failures.length > 0) {
      throw new Error(`[QA] ${label} runtime failures:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
    }
  };
}
