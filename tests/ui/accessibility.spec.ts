import { test, expect } from '@fixtures/customFixtures';
import AxeBuilder from '@axe-core/playwright';
import { Logger } from '@utils/logger';

/**
 * Automated Web Accessibility (a11y) Compliance Suite (@axe-core/playwright).
 * Scans core user-facing screens against WCAG 2.1 Level A & AA standards
 * and attaches full violation audit reports to Allure & Playwright HTML reports.
 */
test.describe('WCAG 2.1 Web Accessibility (a11y) Audit Suite @ui @a11y @regression', () => {
  test('TC-A11Y-001: Verify Login Screen has zero critical WCAG 2.1 A/AA accessibility violations @smoke', async ({
    page,
    loginPage,
  }, testInfo) => {
    await loginPage.open();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    Logger.info(
      `🔍 Login Page Accessibility Audit: ${accessibilityScanResults.passes.length} rules passed, ${accessibilityScanResults.violations.length} violations found.`
    );

    // Attach detailed a11y audit JSON to the report for observability
    await testInfo.attach('Login_Accessibility_Audit.json', {
      body: JSON.stringify(
        {
          url: page.url(),
          passedRulesCount: accessibilityScanResults.passes.length,
          violations: accessibilityScanResults.violations,
        },
        null,
        2
      ),
      contentType: 'application/json',
    });

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('TC-A11Y-002: Verify Product Inventory & Shopping Cart screens pass critical accessibility checks @smoke', async ({
    page,
    inventoryPage,
    cartPage,
  }, testInfo) => {
    await inventoryPage.open();

    // Scan Inventory Page (excluding known third-party demo select dropdown rule if needed)
    const inventoryScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['select-name'])
      .analyze();

    Logger.info(
      `🔍 Inventory Page Accessibility Audit: ${inventoryScan.passes.length} rules passed, ${inventoryScan.violations.length} violations found.`
    );

    await testInfo.attach('Inventory_Accessibility_Audit.json', {
      body: JSON.stringify(
        {
          url: page.url(),
          passedRulesCount: inventoryScan.passes.length,
          violations: inventoryScan.violations,
        },
        null,
        2
      ),
      contentType: 'application/json',
    });

    expect(inventoryScan.violations.filter((v) => v.impact === 'critical')).toEqual([]);

    // Navigate to Cart and scan Cart Page
    await inventoryPage.goToCart();
    await cartPage.expectLoaded();

    const cartScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    Logger.info(
      `🔍 Cart Page Accessibility Audit: ${cartScan.passes.length} rules passed, ${cartScan.violations.length} violations found.`
    );

    expect(cartScan.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });
});
