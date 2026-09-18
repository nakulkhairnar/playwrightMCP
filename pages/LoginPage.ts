import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  // URL
  private readonly url = 'https://www.saucedemo.com/';

  // Locators
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
  }

  /**
   * Navigate to the SauceDemo login page.
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  /**
   * Fill username and password, then click Login.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
