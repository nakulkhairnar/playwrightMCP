import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('SauceDemo - Product Verification', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
  });

  test('Verify Sauce Labs Onesie is listed after login', async () => {
    // Step 1: Navigate to SauceDemo
    await loginPage.navigate();

    // Step 2 & 3: Login with credentials
    await loginPage.login('standard_user', 'secret_sauce');

    // Verify inventory page loaded
    await inventoryPage.verifyPageLoaded();

    // Step 4: Verify "Sauce Labs Onesie" is in the product list
    await inventoryPage.verifyProductVisible('Sauce Labs Onesie');
  });
});
