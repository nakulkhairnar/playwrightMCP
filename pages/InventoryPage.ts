import { type Page, type Locator, expect } from '@playwright/test';

export class InventoryPage {
  // Locators
  readonly page: Page;
  readonly inventoryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryList = page.locator('[data-test="inventory-list"]');
  }

  /**
   * Assert the browser landed on the inventory page.
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
  }

  /**
   * Assert a product with the given name is visible in the inventory list.
   */
  async verifyProductVisible(productName: string): Promise<void> {
    const product = this.inventoryList.getByText(productName);
    await expect(product).toBeVisible();
  }

  /**
   * Return all product names currently displayed.
   */
  async getProductNames(): Promise<string[]> {
    const items = this.page.locator('[data-test="inventory-item-name"]');
    return items.allTextContents();
  }
}
