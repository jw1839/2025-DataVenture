/**
 * 인증 플로우 E2E 테스트
 * 
 * 회원가입 → 로그인 → 로그아웃 시나리오 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto('/');
  });

  test('회원가입 → 로그인 플로우', async ({ page }) => {
    // 1. 회원가입 페이지로 이동
    await page.click('text=회원가입');
    await expect(page).toHaveURL('/auth/register');

    // 2. 회원가입 폼 작성
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'Test1234!';
    const name = '테스트사용자';

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="passwordConfirm"]', password);
    await page.fill('input[name="name"]', name);
    
    // CANDIDATE 역할 선택
    await page.click('input[value="CANDIDATE"]');

    // 3. 회원가입 제출
    await page.click('button[type="submit"]');

    // 4. 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // 5. 사용자 정보가 표시되는지 확인
    await expect(page.locator(`text=${name}`)).toBeVisible();

    // 6. 로그아웃
    await page.click('text=로그아웃');
    
    // 7. 홈페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/');

    // 8. 다시 로그인
    await page.click('text=로그인');
    await expect(page).toHaveURL('/auth/login');

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 9. 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.locator(`text=${name}`)).toBeVisible();
  });

  test('잘못된 이메일 형식은 에러를 표시해야 한다', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="passwordConfirm"]', 'Test1234!');
    await page.fill('input[name="name"]', '테스트');
    await page.click('input[value="CANDIDATE"]');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator('text=/유효한 이메일/i')).toBeVisible();
  });

  test('비밀번호가 일치하지 않으면 에러를 표시해야 한다', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="passwordConfirm"]', 'DifferentPassword!');
    await page.fill('input[name="name"]', '테스트');
    await page.click('input[value="CANDIDATE"]');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator('text=/비밀번호가 일치/i')).toBeVisible();
  });

  test('로그인 실패 시 에러 메시지를 표시해야 한다', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (401 또는 인증 실패 메시지)
    await expect(page.locator('text=/로그인 실패|인증 실패|이메일 또는 비밀번호/i')).toBeVisible();
  });

  test('인증되지 않은 사용자는 보호된 페이지에 접근할 수 없어야 한다', async ({ page }) => {
    // 로그인하지 않고 대시보드 접근 시도
    await page.goto('/dashboard');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/auth/login');
  });
});

