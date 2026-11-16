import { Page, Locator, test, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * Abstract BasePage class implementing shared UI navigation, interaction, and Allure step logging.
 * All domain Page Objects (LoginPage, InventoryPage, CartPage, CheckoutPage) extend this class.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wraps any asynchronous UI action inside a named Playwright/Allure test step and logs it.
   */
  protected async step<T>(stepName: string, action: () => Promise<T>): Promise<T> {
    Logger.step(stepName);
    return await test.step(stepName, action);
  }

  /**
   * Navigates to a relative or absolute path and waits for DOM content to load.
   */
  public async navigateTo(path: string = '/'): Promise<void> {
    await this.step(`Navigate to URL path: "${path}"`, async () => {
      await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    });
  }

  /**
   * Returns the current browser URL.
   */
  public getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Asserts that the current page URL matches a substring or regular expression.
   */
  public async expectUrlToContain(expectedPath: string | RegExp): Promise<void> {
    await this.step(`Verify URL matches "${expectedPath}"`, async () => {
      if (typeof expectedPath === 'string') {
        await expect(this.page).toHaveURL(new RegExp(expectedPath));
      } else {
        await expect(this.page).toHaveURL(expectedPath);
      }
    });
  }

  /**
   * Safely fills an input field after clearing it, wrapped in a descriptive step.
   */
  protected async fillInput(locator: Locator, value: string, fieldDescription: string): Promise<void> {
    await this.step(`Fill "${fieldDescription}"`, async () => {
      await locator.fill(value);
    });
  }

  /**
   * Clicks an element using Playwright's built-in actionability checks, wrapped in a descriptive step.
   */
  protected async clickElement(locator: Locator, elementDescription: string): Promise<void> {
    await this.step(`Click "${elementDescription}"`, async () => {
      await locator.click();
    });
  }
}
