import { test, expect } from '@fixtures/customFixtures';
import * as rawProductsData from '@data/products.json';
import { ProductsTestData } from '../../src/types/testData.types';

const productsData: ProductsTestData = rawProductsData as ProductsTestData;

/**
 * Product Catalog & Cart Badge Test Suite.
 * Reuses `.auth/standard_user.json` storageState automatically—no UI login needed!
 */
test.describe('Product Catalog Sorting & Cart Management Suite @ui @regression', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('TC-UI-003: Verify product catalog sorts accurately by Name (A to Z and Z to A)', async ({
    inventoryPage,
  }) => {
    // Sort Z to A
    await inventoryPage.sortProductsBy('za');
    const namesZA = await inventoryPage.getAllProductNames();
    const expectedZA = [...namesZA].sort().reverse();
    expect(namesZA).toEqual(expectedZA);

    // Sort A to Z
    await inventoryPage.sortProductsBy('az');
    const namesAZ = await inventoryPage.getAllProductNames();
    const expectedAZ = [...namesAZ].sort();
    expect(namesAZ).toEqual(expectedAZ);
  });

  test('TC-UI-004: Verify product catalog sorts accurately by Price (Low to High and High to Low)', async ({
    inventoryPage,
  }) => {
    // Sort Price: Low to High
    await inventoryPage.sortProductsBy('lohi');
    const pricesLowToHigh = await inventoryPage.getAllProductPrices();
    const expectedLowToHigh = [...pricesLowToHigh].sort((a, b) => a - b);
    expect(pricesLowToHigh).toEqual(expectedLowToHigh);

    // Sort Price: High to Low
    await inventoryPage.sortProductsBy('hilo');
    const pricesHighToLow = await inventoryPage.getAllProductPrices();
    const expectedHighToLow = [...pricesHighToLow].sort((a, b) => b - a);
    expect(pricesHighToLow).toEqual(expectedHighToLow);
  });

  test('TC-UI-005: Adding and removing multiple products updates cart badge dynamically @smoke', async ({
    inventoryPage,
  }) => {
    const [firstProduct, secondProduct] = productsData.catalog;

    await inventoryPage.expectCartBadgeCount(0);

    await inventoryPage.addProductToCartByName(firstProduct.name);
    await inventoryPage.expectCartBadgeCount(1);

    await inventoryPage.addProductToCartByName(secondProduct.name);
    await inventoryPage.expectCartBadgeCount(2);

    await inventoryPage.removeProductFromCartByName(firstProduct.name);
    await inventoryPage.expectCartBadgeCount(1);

    await inventoryPage.removeProductFromCartByName(secondProduct.name);
    await inventoryPage.expectCartBadgeCount(0);
  });
});
