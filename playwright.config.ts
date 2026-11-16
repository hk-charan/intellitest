import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { ENV } from './src/utils/envConfig';

/**
 * Path to the saved browser authentication state (cookies & localStorage).
 * Created once by `tests/setup/auth.setup.ts` and reused by authenticated UI tests.
 */
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth/standard_user.json');

export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: ENV.execution.isCI,
  /* Retry on CI only (or via RETRIES env var) */
  retries: ENV.execution.retries,
  /* Opt out of parallel tests on CI if needed, otherwise use configured workers */
  workers: ENV.execution.isCI ? 2 : ENV.execution.workers,

  /* Multi-Reporter Setup: Console List + Playwright HTML + Allure Report */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
      },
    ],
  ],

  /* Shared settings for all projects below */
  use: {
    baseURL: ENV.uiBaseUrl,
    headless: ENV.execution.headless,
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
    /* Capture screenshot only when a test fails */
    screenshot: 'only-on-failure',
    /* Record video only when retrying or failing */
    video: 'retain-on-failure',
    /* Collect full Playwright trace (DOM snapshots, network, console) on failure */
    trace: 'retain-on-failure',
  },

  /* Configure projects for Auth Setup, UI Cross-Browser, REST API, and Hybrid suites */
  projects: [
    // 1. Global Authentication Setup Project
    {
      name: 'auth-setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. Primary UI E2E Suite (Chromium - depends on auth-setup)
    {
      name: 'chromium-ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
      dependencies: ['auth-setup'],
    },

    // 3. Cross-Browser UI Suite (Firefox)
    {
      name: 'firefox-ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE_PATH,
      },
      dependencies: ['auth-setup'],
    },

    // 4. Cross-Browser UI Suite (WebKit / Safari Engine)
    {
      name: 'webkit-ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Safari'],
        storageState: STORAGE_STATE_PATH,
      },
      dependencies: ['auth-setup'],
    },

    // 5. Pure REST API Test Suite (No browser window needed)
    {
      name: 'api-tests',
      testDir: './tests/api',
      use: {
        baseURL: ENV.apiBaseUrl,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },

    // 6. Hybrid (API + UI) Test Suite
    {
      name: 'hybrid-tests',
      testDir: './tests/hybrid',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
      dependencies: ['auth-setup'],
    },
  ],
});
