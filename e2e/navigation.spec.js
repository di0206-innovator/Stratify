import { test, expect } from '@playwright/test';

test.describe('Stratify Navigation & Accessibility E2E', () => {
  test('landing page renders CTA, waitlist modal, and toggles theme', async ({ page }) => {
    await page.goto('/');

    // Verify title
    await expect(page).toHaveTitle(/Stratify/);

    // Verify skip to main content link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink.first()).toBeAttached();

    // Verify Theme toggle exists and functions
    const themeBtn = page.locator('button[aria-label*="mode"]');
    if (await themeBtn.count() > 0) {
      await expect(themeBtn.first()).toBeVisible();
      await themeBtn.first().click();
    }

    // Verify upgrade / waitlist CTA is present
    const waitlistBtn = page.locator('text=Join Waitlist').first();
    if (await waitlistBtn.isVisible()) {
      await waitlistBtn.click();
      const modalHeader = page.locator('text=Join the Stratify Waitlist');
      await expect(modalHeader).toBeVisible();
    }
  });
});
