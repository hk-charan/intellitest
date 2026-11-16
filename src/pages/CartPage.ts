import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the SauceDemo Shopping Cart Screen (`/cart.html`).
 * Encapsulates cart item verification, item removal, and proceeding to checkout.
 */
export class CartPage extends BasePage {
  public readonly pageTitle: Locator;
  public readonly cartItems: Locator;
  public readonly cartItemNames: Locator;
  public readonly checkoutButton: Locator;
  public readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.cartItemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  /**
   * Verifies that the Cart page is loaded.
   */
  public async expectLoaded(): Promise<void> {
    await this.step('Verify Shopping Cart page is loaded', async () => {
      await expect(this.page).toHaveURL(/.*cart\.html/);
      await expect(this.pageTitle).toHaveText('Your Cart');
    });
  }

  /**
   * Asserts that a specific product is present in the shopping cart.
   */
  public async expectProductInCart(productName: string): Promise<void> {
    await this.step(`Verify product "${productName}" is in cart`, async () => {
      const item = this.cartItems.filter({ hasText: productName });
      await expect(item).toBeVisible();
    });
  }

  /**
   * Asserts the total number of line items currently in the cart.
   */
  public async expectCartItemCount(expectedCount: number): Promise<void> {
    await this.step(`Verify cart contains ${expectedCount} item(s)`, async () => {
      await expect(this.cartItems).toHaveCount(expectedCount);
    });
  }

  /**
   * Removes an item directly from the Cart page by product name.
   */
  public async removeProductFromCart(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from Cart page`, async () => {
      const item = this.cartItems.filter({ hasText: productName });
      await item.getByRole('button', { name: 'Remove' }).click();
    });
  }

  /**
   * Clicks the Checkout button to proceed to Checkout Step One.
   */
  public async proceedToCheckout(): Promise<void> {
    await this.clickElement(this.checkoutButton, 'Checkout Button');
  }
}
