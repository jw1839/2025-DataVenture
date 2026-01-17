/**
 * AI 인터뷰 플로우 E2E 테스트
 * 
 * 로그인 → 인터뷰 시작 → 대화 → 완료 시나리오 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('AI 인터뷰 플로우', () => {
  // 테스트용 계정 정보
  const testUser = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'Test1234!',
    name: 'E2E 테스트 사용자',
  };

  test.beforeAll(async ({ browser }) => {
    // 테스트 계정 생성
    const page = await browser.newPage();
    await page.goto('/auth/register');
    
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="passwordConfirm"]', testUser.password);
    await page.fill('input[name="name"]', testUser.name);
    await page.click('input[value="CANDIDATE"]');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('인터뷰 시작 → 메시지 전송 → 완료 플로우', async ({ page }) => {
    // 1. 인터뷰 페이지로 이동
    await page.goto('/interview');
    await expect(page).toHaveURL('/interview');

    // 2. 인터뷰 시작 버튼 클릭
    await page.click('button:has-text("인터뷰 시작")');

    // 3. AI 첫 질문이 표시될 때까지 대기
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 15000 });

    // 4. 사용자 답변 입력
    const answerInput = page.locator('textarea[placeholder*="답변"]');
    await answerInput.fill('저는 5년간 백엔드 개발을 해왔으며, Python과 FastAPI에 익숙합니다.');

    // 5. 답변 전송
    await page.click('button[type="submit"]:has-text("전송")');

    // 6. 사용자 메시지가 표시되는지 확인
    await expect(page.locator('.message.candidate').last()).toContainText('Python과 FastAPI');

    // 7. AI 다음 질문이 표시될 때까지 대기
    await expect(page.locator('.message.ai').nth(1)).toBeVisible({ timeout: 15000 });

    // 8. 인터뷰 종료 버튼 클릭
    await page.click('button:has-text("인터뷰 종료")');

    // 9. 확인 다이얼로그 (있다면)
    const confirmButton = page.locator('button:has-text("확인")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // 10. 평가 결과 페이지로 리다이렉트 확인 (또는 대시보드)
    await expect(page).toHaveURL(/\/evaluation\/|\/dashboard/, { timeout: 10000 });
  });

  test('빈 답변은 전송할 수 없어야 한다', async ({ page }) => {
    await page.goto('/interview');
    await page.click('button:has-text("인터뷰 시작")');

    // AI 첫 질문 대기
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 15000 });

    // 빈 답변 전송 시도
    const submitButton = page.locator('button[type="submit"]:has-text("전송")');
    
    // 전송 버튼이 비활성화되어 있거나, 클릭 시 에러 메시지 표시
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('인터뷰 재연결이 작동해야 한다', async ({ page }) => {
    // 인터뷰 시작
    await page.goto('/interview');
    await page.click('button:has-text("인터뷰 시작")');
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 15000 });

    // 인터뷰 ID 저장 (URL이나 localStorage에서)
    const interviewId = await page.evaluate(() => {
      return localStorage.getItem('currentInterviewId');
    });

    // 페이지 새로고침 (연결 끊김 시뮬레이션)
    await page.reload();

    // 재연결 메시지 또는 이전 대화 기록이 표시되는지 확인
    await expect(page.locator('.message').first()).toBeVisible({ timeout: 10000 });
  });
});

