import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Page Object for the SauceDemo Product Inventory Screen (`/inventory.html`).
 * Handles catalog browsing, sorting, adding/removing items, and navigating to the cart.
 */
export class InventoryPage extends BasePage {
  public readonly pageTitle: Locator;
  public readonly inventoryItems: Locator;
  public readonly itemNames: Locator;
  public readonly itemPrices: Locator;
  public readonly sortDropdown: Locator;
  public readonly shoppingCartLink: Locator;
  public readonly shoppingCartBadge: Locator;
  public readonly burgerMenuButton: Locator;
  public readonly logoutSidebarLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.shoppingCartLink = page.locator('[data-test="shopping-cart-link"]');
    this.shoppingCartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.burgerMenuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutSidebarLink = page.locator('[data-test="logout-sidebar-link"]');
  }

  /**
   * Opens the Inventory page directly (requires an authenticated session).
   */
  public async open(): Promise<void> {
    await this.navigateTo('/inventory.html');
    await this.expectLoaded();
  }

  /**
   * Asserts that the Inventory page is loaded and displaying products.
   */
  public async expectLoaded(): Promise<void> {
    await this.step('Verify Inventory page is loaded', async () => {
      await expect(this.page).toHaveURL(/.*inventory\.html/);
      await expect(this.pageTitle).toHaveText('Products');
      await expect(this.inventoryItems.first()).toBeVisible();
    });
  }

  /**
   * Dynamically locates and clicks "Add to cart" for a specific product by its name.
   */
  public async addProductToCartByName(productName: string): Promise<void> {
    await this.step(`Add product "${productName}" to cart`, async () => {
      const productCard = this.inventoryItems.filter({ hasText: productName });
      const addButton = productCard.getByRole('button', { name: 'Add to cart' });
      await addButton.click();
    });
  }

  /**
   * Dynamically locates and clicks "Remove" for a specific product by its name.
   */
  public async removeProductFromCartByName(productName: string): Promise<void> {
    await this.step(`Remove product "${productName}" from cart`, async () => {
      const productCard = this.inventoryItems.filter({ hasText: productName });
      const removeButton = productCard.getByRole('button', { name: 'Remove' });
      await removeButton.click();
    });
  }

  /**
   * Sorts the product catalog using the sort dropdown (`az`, `za`, `lohi`, `hilo`).
   */
  public async sortProductsBy(option: SortOption): Promise<void> {
    await this.step(`Sort products by option "${option}"`, async () => {
      await this.sortDropdown.selectOption(option);
    });
  }

  /**
   * Returns all displayed product names in their current visual order.
   */
  public async getAllProductNames(): Promise<string[]> {
    return await this.itemNames.allInnerTexts();
  }

  /**
   * Returns all displayed product prices as numeric values in their current visual order.
   */
  public async getAllProductPrices(): Promise<number[]> {
    const rawPrices = await this.itemPrices.allInnerTexts();
    return rawPrices.map((priceText) => parseFloat(priceText.replace('$', '')));
  }

  /**
   * Verifies the shopping cart badge count (0 means the badge should be hidden).
   */
  public async expectCartBadgeCount(expectedCount: number): Promise<void> {
    await this.step(`Verify shopping cart badge count is ${expectedCount}`, async () => {
      if (expectedCount === 0) {
        await expect(this.shoppingCartBadge).toBeHidden();
      } else {
        await expect(this.shoppingCartBadge).toBeVisible();
        await expect(this.shoppingCartBadge).toHaveText(String(expectedCount));
      }
    });
  }

  /**
   * Clicks the shopping cart icon to navigate to the Cart page.
   */
  public async goToCart(): Promise<void> {
    await this.clickElement(this.shoppingCartLink, 'Shopping Cart Icon');
  }

  /**
   * Logs out via the sidebar menu.
   */
  public async logout(): Promise<void> {
    await this.step('Logout user via navigation sidebar', async () => {
      await this.burgerMenuButton.click();
      await this.logoutSidebarLink.click();
    });
  }
}
