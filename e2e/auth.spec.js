import { test, expect } from '@playwright/test';

test('App landing page loads successfully and verifies title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Stratify/);
  
  // Verify that the brand header is visible
  const brand = page.locator('text=Stratify');
  await expect(brand.first()).toBeVisible();
});
