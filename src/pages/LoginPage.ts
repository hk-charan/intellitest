import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the SauceDemo Login Screen (`/`).
 * Encapsulates login inputs, authentication actions, and error banner validations.
 */
export class LoginPage extends BasePage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly errorMessageBanner: Locator;
  public readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessageBanner = page.locator('[data-test="error"]');
    this.loginLogo = page.locator('.login_logo');
  }

  /**
   * Navigates directly to the Login page and verifies the login button is visible.
   */
  public async open(): Promise<void> {
    await this.navigateTo('/');
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Performs login with the specified username and password.
   */
  public async login(username: string, password: string): Promise<void> {
    await this.step(`Authenticate user "${username || '<empty>'}"`, async () => {
      await this.fillInput(this.usernameInput, username, `Username (${username || 'empty'})`);
      await this.fillInput(this.passwordInput, password, 'Password (***)');
      await this.clickElement(this.loginButton, 'Login Button');
    });
  }

  /**
   * Asserts that the login error message banner is visible and contains the expected text.
   */
  public async expectErrorMessage(expectedMessage: string): Promise<void> {
    await this.step(`Verify login error message: "${expectedMessage}"`, async () => {
      await expect(this.errorMessageBanner).toBeVisible();
      await expect(this.errorMessageBanner).toContainText(expectedMessage);
    });
  }
}
