import { test, expect } from '@fixtures/customFixtures';
import * as rawUsersData from '@data/users.json';
import { UsersTestData } from '../../src/types/testData.types';

const usersData: UsersTestData = rawUsersData as UsersTestData;

/**
 * Login & Authentication Test Suite.
 * Resets `storageState` to an empty session so every test starts unauthenticated on the Login screen.
 */
test.describe('Authentication & Login Validation Suite @ui @auth @regression', () => {
  // Override global authenticated storageState so we can test the Login screen from a clean state
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('TC-UI-001: Valid standard user can log in and log out successfully @smoke', async ({
    loginPage,
    inventoryPage,
  }) => {
    const validUser = usersData.validUsers[0];

    await loginPage.login(validUser.username, validUser.password);
    await inventoryPage.expectLoaded();

    // Verify user can log out and return to login screen
    await inventoryPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
  });

  // Data-Driven Testing (DDT): Dynamically generate tests for all negative user personas in users.json
  for (const negativeUser of usersData.invalidAndLockedUsers) {
    test(`TC-UI-DDT [${negativeUser.id}]: ${negativeUser.description}`, async ({ loginPage }) => {
      await loginPage.login(negativeUser.username, negativeUser.password);
      await loginPage.expectErrorMessage(negativeUser.expectedErrorMessage!);
    });
  }

  test('TC-UI-002: Unauthenticated user cannot access Inventory URL directly', async ({
    loginPage,
    inventoryPage,
  }) => {
    await inventoryPage.navigateTo('/inventory.html');
    await loginPage.expectErrorMessage(
      "Epic sadface: You can only access '/inventory.html' when you are logged in."
    );
  });
});
