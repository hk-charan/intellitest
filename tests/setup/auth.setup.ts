import { test as setup } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { ENV } from '@utils/envConfig';
import { Logger } from '@utils/logger';
import { STORAGE_STATE_PATH } from '../../playwright.config';

/**
 * Global Authentication Setup (`auth-setup` project).
 * Authenticates once as `standard_user` and persists browser cookies/localStorage to `.auth/standard_user.json`.
 * All dependent UI & Hybrid test projects reuse this session state automatically.
 */
setup('Authenticate standard_user and save storageState', async ({ page }) => {
  Logger.info('Starting global authentication setup for standard_user...');

  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  await loginPage.open();
  await loginPage.login(ENV.credentials.standardUser, ENV.credentials.password);

  // Verify login succeeded before saving state
  await inventoryPage.expectLoaded();

  // Save authenticated session state (cookies & localStorage) to disk
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  Logger.info(`Saved authenticated storageState to: ${STORAGE_STATE_PATH}`);
});
