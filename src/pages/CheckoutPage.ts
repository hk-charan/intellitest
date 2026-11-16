import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CustomerCheckoutInfo } from '../types/testData.types';

/**
 * Page Object for the SauceDemo Multi-Step Checkout Flow:
 * - Step One (`/checkout-step-one.html`): Customer Information Form
 * - Step Two (`/checkout-step-two.html`): Order Overview & Price Calculation
 * - Complete (`/checkout-complete.html`): Order Confirmation Screen
 */
export class CheckoutPage extends BasePage {
  // Step 1 Locators
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly postalCodeInput: Locator;
  public readonly continueButton: Locator;
  public readonly errorMessageBanner: Locator;

  // Step 2 Locators
  public readonly summarySubtotalLabel: Locator;
  public readonly summaryTaxLabel: Locator;
  public readonly summaryTotalLabel: Locator;
  public readonly finishButton: Locator;

  // Checkout Complete Locators
  public readonly completeHeader: Locator;
  public readonly completeText: Locator;
  public readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    // Step 1
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.errorMessageBanner = page.locator('[data-test="error"]');

    // Step 2
    this.summarySubtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.summaryTaxLabel = page.locator('[data-test="tax-label"]');
    this.summaryTotalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');

    // Complete
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.completeText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  /**
   * Fills customer shipping details on Checkout Step One and clicks Continue.
   */
  public async fillCustomerInformation(customer: CustomerCheckoutInfo): Promise<void> {
    await this.step(
      `Fill customer checkout info (${customer.firstName} ${customer.lastName}, ZIP: ${customer.postalCode})`,
      async () => {
        await this.fillInput(this.firstNameInput, customer.firstName, 'First Name');
        await this.fillInput(this.lastNameInput, customer.lastName, 'Last Name');
        await this.fillInput(this.postalCodeInput, customer.postalCode, 'Postal Code');
        await this.clickElement(this.continueButton, 'Continue to Overview Button');
      }
    );
  }

  /**
   * Extracts the numeric Item Subtotal displayed on Checkout Step Two.
   */
  public async getSubtotalAmount(): Promise<number> {
    const text = await this.summarySubtotalLabel.innerText();
    // Format: "Item total: $39.98"
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  /**
   * Verifies that the displayed Item Subtotal matches the expected sum of item prices.
   */
  public async expectSubtotalToEqual(expectedSubtotal: number): Promise<void> {
    await this.step(`Verify order item subtotal equals $${expectedSubtotal.toFixed(2)}`, async () => {
      await expect(this.summarySubtotalLabel).toContainText(`$${expectedSubtotal.toFixed(2)}`);
    });
  }

  /**
   * Clicks Finish on Checkout Step Two to submit the order.
   */
  public async finishCheckout(): Promise<void> {
    await this.clickElement(this.finishButton, 'Finish Order Button');
  }

  /**
   * Asserts that the Order Confirmation screen is displayed with the thank-you header.
   */
  public async expectOrderConfirmation(): Promise<void> {
    await this.step('Verify Order Confirmation message is displayed', async () => {
      await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
      await expect(this.completeHeader).toBeVisible();
      await expect(this.completeHeader).toHaveText('Thank you for your order!');
    });
  }
}
