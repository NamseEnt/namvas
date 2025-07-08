import { test, expect } from '@playwright/test';

test('홈페이지 로드 테스트', async ({ page }) => {
  await page.goto('/');
  
  // 페이지가 정상적으로 로드되었는지 확인
  await expect(page.locator('body')).toBeVisible();
});

test('getMe API 호출 확인', async ({ page }) => {
  // getMe API 호출을 감시
  const getMeResponsePromise = page.waitForResponse(response => 
    response.url().includes('/api/getMe') && response.status() === 200
  );
  
  // 홈페이지 접속 (이때 getMe가 호출되어야 함)
  await page.goto('/');
  
  // getMe 응답 대기 및 확인
  const response = await getMeResponsePromise;
  const responseBody = await response.json();
  
  console.log('getMe 응답:', responseBody);
  
  // 응답이 {ok: false} 형태인지 확인
  expect(responseBody).toHaveProperty('ok', false);
});