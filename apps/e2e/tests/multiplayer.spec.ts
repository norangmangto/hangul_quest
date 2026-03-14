/**
 * Multiplayer E2E tests.
 *
 * These tests require both the API server (port 4000) and web server (port 3000) to be running.
 * Start them with: npm run dev
 *
 * Each test uses two browser contexts to simulate a host and a player.
 */
import { test, expect, Browser } from '@playwright/test';

async function createRoom(browser: Browser, hostName: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('Enter your name...').fill(hostName);
  await page.getByRole('button', { name: '🏠 Create Room' }).click();
  await page.waitForURL(/\/room\//);
  // Extract room code from the large display
  const code = await page.locator('p.text-6xl').textContent();
  return { page, ctx, roomCode: code?.trim() ?? '' };
}

async function joinRoom(browser: Browser, playerName: string, roomCode: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: /Join Room/ }).click();
  await page.getByPlaceholder('Enter your name...').fill(playerName);
  await page.getByPlaceholder(/e\.g\. ABCD/i).fill(roomCode);
  await page.getByRole('button', { name: '🚀 Join Room' }).click();
  await page.waitForURL(/\/room\//);
  return { page, ctx };
}

test.describe('Multiplayer game', () => {
  test('host creates room, player joins, game starts', async ({ browser }) => {
    const { page: hostPage, roomCode } = await createRoom(browser, 'TestHost');
    expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

    const { page: playerPage } = await joinRoom(browser, 'TestPlayer', roomCode);

    // Player lobby shows host name
    await expect(playerPage.getByText(/Hosted by TestHost/)).toBeVisible();

    // Host sees player in lobby
    await expect(hostPage.getByText('TestPlayer')).toBeVisible();

    // Host starts game
    await hostPage.getByRole('button', { name: /Start Game/ }).click();

    // Both should transition to game view
    await expect(hostPage.getByText(/Round 1/)).toBeVisible({ timeout: 5000 });
    await expect(playerPage.getByText(/Round 1/)).toBeVisible({ timeout: 5000 });
  });

  test('player can submit an answer', async ({ browser }) => {
    const { page: hostPage, roomCode } = await createRoom(browser, 'AnswerHost');
    const { page: playerPage } = await joinRoom(browser, 'AnswerPlayer', roomCode);

    await hostPage.getByRole('button', { name: /Start Game/ }).click();
    await playerPage.waitForURL(/\/room\//);

    // Wait for countdown to finish (up to 5s)
    await playerPage.waitForTimeout(4000);

    // Click any answer button
    const answerButtons = playerPage.locator('button').filter({ hasText: /^[가-힣a-zA-Z\/\d]+$/ });
    await answerButtons.first().click({ timeout: 10000 });

    // Should show "Waiting for others" or result
    const waitingOrResult = playerPage.locator('text=Waiting for others').or(playerPage.locator('text=Correct Answer'));
    await expect(waitingOrResult).toBeVisible({ timeout: 5000 });
  });

  test('play again resets the game', async ({ browser }) => {
    const { page: hostPage, roomCode } = await createRoom(browser, 'PlayAgainHost');
    await joinRoom(browser, 'PlayAgainPlayer', roomCode);

    await hostPage.getByRole('button', { name: /Start Game/ }).click();

    // Fast-forward through all rounds (5 rounds, use next-round)
    for (let i = 0; i < 5; i++) {
      // Wait for ROUND_RESULT state
      await hostPage.waitForSelector('button:has-text("Next Round")', { timeout: 15000 });
      await hostPage.getByRole('button', { name: /Next Round/ }).click();
    }

    // After last round, host sees Game Over + Play Again
    await expect(hostPage.getByText('Game Over')).toBeVisible({ timeout: 5000 });
    await hostPage.getByRole('button', { name: /Play Again/ }).click();

    // Should return to lobby
    await expect(hostPage.getByText('Room Code')).toBeVisible({ timeout: 5000 });
  });
});
