import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // socket.io rooms need serial execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // serial: game state is shared per room
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Uncomment to auto-start dev servers:
  // webServer: [
  //   { command: 'npm run dev:api', port: 4000, reuseExistingServer: true },
  //   { command: 'npm run dev:web', port: 3000, reuseExistingServer: true },
  // ],
});
