import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows the game title and create/join tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('한글 퀘스트')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Room/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Join Room/ })).toBeVisible();
  });

  test('shows name input on create tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Enter your name...')).toBeVisible();
  });

  test('shows room code input when switching to join tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Join Room/ }).click();
    await expect(page.getByPlaceholder(/e\.g\. ABCD/i)).toBeVisible();
  });

  test('prefills room code from ?code= query param', async ({ page }) => {
    await page.goto('/?code=ABCD');
    const input = page.getByPlaceholder(/e\.g\. ABCD/i);
    await expect(input).toHaveValue('ABCD');
  });

  test('shows error when creating room without a name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '🏠 Create Room' }).click();
    await expect(page.getByText('Please enter your name')).toBeVisible();
  });

  test('shows practice link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Practice/ })).toBeVisible();
  });

  test('navigates to practice page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page).toHaveURL('/practice');
    await expect(page.getByText('Solo Practice')).toBeVisible();
  });

  test('dark mode toggle applies dark class', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTitle('Toggle dark mode');
    await toggle.click();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    // Toggle off
    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
