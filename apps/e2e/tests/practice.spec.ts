import { test, expect } from '@playwright/test';

test.describe('Practice page', () => {
  test('shows category selection screen', async ({ page }) => {
    await page.goto('/practice');
    await expect(page.getByText('Solo Practice')).toBeVisible();
    await expect(page.getByRole('button', { name: /Korean Words/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hangul Letters/ })).toBeVisible();
  });

  test('starts Korean Words practice session', async ({ page }) => {
    await page.goto('/practice');
    await page.getByRole('button', { name: /Korean Words/ }).click();
    // Should show question counter and a prompt
    await expect(page.getByText('1 / 15')).toBeVisible();
  });

  test('can answer a practice question', async ({ page }) => {
    await page.goto('/practice');
    await page.getByRole('button', { name: /Korean Words/ }).click();
    // Click first answer button
    const buttons = page.locator('button').filter({ hasText: /^[가-힣a-zA-Z\/\d]+$/ });
    await buttons.first().click();
    // After answering, "Next" button should appear
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible();
  });

  test('shows correct answer on reveal', async ({ page }) => {
    await page.goto('/practice');
    await page.getByRole('button', { name: /Korean Words/ }).click();
    const buttons = page.locator('button').filter({ hasText: /^[가-힣a-zA-Z\/\d]+$/ });
    await buttons.first().click();
    await expect(page.getByText('Correct Answer')).toBeVisible();
  });

  test('completes all rounds and shows results', async ({ page }) => {
    await page.goto('/practice');
    await page.getByRole('button', { name: /Korean Words/ }).click();

    for (let i = 0; i < 15; i++) {
      const buttons = page.locator('button').filter({ hasText: /^[가-힣a-zA-Z\/\d]+$/ });
      await buttons.first().click();
      const nextBtn = page.getByRole('button', { name: /Next|See Results/ });
      await nextBtn.click();
    }

    await expect(page.getByText('Practice Done!')).toBeVisible();
  });

  test('back button returns to category selection', async ({ page }) => {
    await page.goto('/practice');
    await page.getByRole('button', { name: /Korean Words/ }).click();
    await page.getByRole('button', { name: /← Exit/ }).click();
    await expect(page.getByText('Solo Practice')).toBeVisible();
  });
});
