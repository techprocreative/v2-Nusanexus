import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  // Expect brand name on landing page
  await expect(page.getByText(/Nusanexus/i)).toBeVisible();
});

test('unauthenticated user is redirected to login from dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});