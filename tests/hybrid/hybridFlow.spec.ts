import { test, expect } from '@fixtures/customFixtures';
import { DataGenerator } from '@utils/dataGenerator';
import { CreateBookingResponse } from '../../src/api/schemas/booking.schema';
import * as rawProductsData from '@data/products.json';
import { ProductsTestData } from '../../src/types/testData.types';

const productsData: ProductsTestData = rawProductsData as ProductsTestData;

/**
 * Hybrid Testing Suite (REST API + UI E2E + Network Interception).
 * Demonstrates how backend API state preparation, network mocking (`page.route`),
 * and frontend UI workflows work together in a single test architecture.
 */
test.describe('Hybrid (API + UI + Network Interception) Suite @hybrid @regression', () => {
  test('TC-HYB-001: Seed customer record via REST API and use verified backend profile to complete UI E2E Checkout @smoke', async ({
    bookingApi,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    // 1. BACKEND API STEP: Create customer reservation record via REST API
    const apiPayload = DataGenerator.generateBookingPayload({
      totalprice: 299,
      additionalneeds: 'Express Delivery',
    });
    const createRes = await bookingApi.createBooking(apiPayload);
    expect(createRes.status()).toBe(200);
    const { bookingid, booking } = (await createRes.json()) as CreateBookingResponse;

    // Verify record persists on backend via GET /booking/:id
    const verifyRes = await bookingApi.getBookingById(bookingid);
    expect(verifyRes.status()).toBe(200);

    // 2. FRONTEND UI STEP: Use the verified backend customer identity in the UI E2E Checkout flow
    await inventoryPage.open();
    await inventoryPage.addProductToCartByName(productsData.catalog[0].name);
    await inventoryPage.goToCart();
    await cartPage.expectLoaded();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInformation({
      firstName: booking.firstname,
      lastName: booking.lastname,
      postalCode: String(bookingid),
    });

    await checkoutPage.expectSubtotalToEqual(productsData.catalog[0].price);
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderConfirmation();
  });

  test('TC-HYB-002: Network Interception & Fulfill - Mock custom API response and validate UI session state', async ({
    page,
    inventoryPage,
  }) => {
    // 1. Register a Playwright network route interceptor for a simulated inventory status API endpoint
    const mockedInventoryStatus = {
      status: 'HEALTHY',
      warehouseRegion: 'IN-SOUTH-1',
      availableStockCount: 6,
    };

    await page.route('**/api/v1/inventory-health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedInventoryStatus),
      });
    });

    // 2. Open UI Inventory page (already authenticated via storageState)
    await inventoryPage.open();

    // 3. Trigger fetch from within the browser context to verify network interception works seamlessly
    const interceptedData = await page.evaluate(async () => {
      const res = await fetch('/api/v1/inventory-health');
      return await res.json();
    });

    expect(interceptedData).toEqual(mockedInventoryStatus);

    // 4. Verify UI catalog item count matches mocked stock count (6 items)
    await expect(inventoryPage.inventoryItems).toHaveCount(mockedInventoryStatus.availableStockCount);
  });
});
