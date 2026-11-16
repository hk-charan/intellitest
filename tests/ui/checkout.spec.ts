import { test, expect } from '@fixtures/customFixtures';
import * as rawProductsData from '@data/products.json';
import { ProductsTestData } from '../../src/types/testData.types';
import { DataGenerator } from '@utils/dataGenerator';

const productsData: ProductsTestData = rawProductsData as ProductsTestData;

/**
 * End-to-End Shopping Cart & Order Checkout Suite.
 * Reuses `.auth/standard_user.json` storageState automatically.
 */
test.describe('End-to-End Order Checkout Suite @ui @e2e @smoke', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('TC-UI-006: Complete E2E multi-item checkout and verify price calculation @smoke', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const selectedProducts = productsData.catalog.slice(0, 3); // Backpack, Bike Light, Bolt T-Shirt
    const expectedSubtotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
    const dynamicCustomer = DataGenerator.generateCheckoutCustomer();

    // 1. Add all 3 items from Inventory
    for (const product of selectedProducts) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.expectCartBadgeCount(selectedProducts.length);

    // 2. Navigate to Cart and verify all items are listed
    await inventoryPage.goToCart();
    await cartPage.expectLoaded();
    await cartPage.expectCartItemCount(selectedProducts.length);
    for (const product of selectedProducts) {
      await cartPage.expectProductInCart(product.name);
    }

    // 3. Proceed to Checkout & fill dynamic customer info
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInformation(dynamicCustomer);

    // 4. Verify item subtotal math on Checkout Overview
    await checkoutPage.expectSubtotalToEqual(expectedSubtotal);

    // 5. Complete Order & verify confirmation screen
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderConfirmation();
  });

  test('TC-UI-007: Verify user can remove an item from Cart before completing checkout', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const [itemToKeep, itemToRemove] = productsData.catalog;
    const customer = productsData.checkoutCustomers[0];

    await inventoryPage.addProductToCartByName(itemToKeep.name);
    await inventoryPage.addProductToCartByName(itemToRemove.name);
    await inventoryPage.goToCart();

    await cartPage.expectCartItemCount(2);
    await cartPage.removeProductFromCart(itemToRemove.name);
    await cartPage.expectCartItemCount(1);

    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInformation(customer);
    await checkoutPage.expectSubtotalToEqual(itemToKeep.price);
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderConfirmation();
  });

  test('TC-UI-008: Checkout form validates required customer postal code', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addProductToCartByName(productsData.catalog[0].name);
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInformation({
      firstName: 'Charan',
      lastName: 'HK',
      postalCode: '',
    });

    await expect(checkoutPage.errorMessageBanner).toContainText('Error: Postal Code is required');
  });
});
