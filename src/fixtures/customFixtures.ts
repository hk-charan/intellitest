import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { AuthApi } from '@api/endpoints/AuthApi';
import { BookingApi } from '@api/endpoints/BookingApi';
import { Logger } from '@utils/logger';
import { AiFailureAnalyzer } from '@utils/aiFailureAnalyzer';

/**
 * Custom Fixture Types injected into IntelliTest specs.
 * Eliminates repetitive `new SomePage(page)` or `new SomeApi(request)` boilerplate across test files.
 */
export interface IntelliTestFixtures {
  // UI Page Object Fixtures
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  // REST API Service Fixtures
  authApi: AuthApi;
  bookingApi: BookingApi;
  // Auto Lifecycle & AI Diagnostic Hook
  testLifecycleLogger: void;
}

/**
 * Extended Playwright `test` object with Dependency Injection for Page Objects,
 * REST API Clients, automatic lifecycle logging, and Post-Failure AI Root Cause Analysis.
 */
export const test = base.extend<IntelliTestFixtures>({
  // Automatic fixture that runs before and after every test for observability & failure analysis
  testLifecycleLogger: [
    async ({ page }, use, testInfo) => {
      Logger.info(`🚀 STARTING TEST: "${testInfo.title}" [${testInfo.project.name}]`);
      await use();

      const failed = testInfo.status !== testInfo.expectedStatus;
      const statusIcon = failed ? '❌' : '✅';
      Logger.info(
        `${statusIcon} FINISHED TEST: "${testInfo.title}" | Status: ${testInfo.status?.toUpperCase()} (${testInfo.duration}ms)`
      );

      // Trigger AI / Heuristic Failure Analysis ONLY when a test fails
      if (failed) {
        const currentUrl = page && !page.isClosed() ? page.url() : undefined;
        await AiFailureAnalyzer.analyzeFailure(testInfo, currentUrl);
      }
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  bookingApi: async ({ request }, use) => {
    await use(new BookingApi(request));
  },
});

export { expect };
