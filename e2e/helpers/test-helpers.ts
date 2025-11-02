/**
 * Test helpers for Roof Scout E2E tests
 * Common utilities and setup functions
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Clear localStorage and sessionStorage before each test
 */
export async function clearStorage(page: Page): Promise<void> {
  // Only clear storage if page is loaded
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore errors if localStorage is not accessible yet
    console.warn('Could not clear storage:', error);
  }
}

/**
 * Wait for Angular to be ready
 */
export async function waitForAngular(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const appRoot = document.querySelector('app-root');
    return appRoot !== null && appRoot.children.length > 0;
  }, { timeout: 10000 });
}

/**
 * Mock geolocation for map testing
 */
export async function mockGeolocation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock geolocation for testing
    // Default to New York City coordinates
    // @ts-ignore
    delete window.navigator.geolocation;
    // @ts-ignore
    window.navigator.geolocation = {
      getCurrentPosition: (success: any) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
          },
        });
      },
      getWatchPosition: () => {},
      clearWatch: () => {},
    };
  });
}

/**
 * Wait for network requests to settle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `e2e-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Check if element is visible and contains text
 */
export async function checkElementWithText(
  page: Page,
  selector: string,
  expectedText: string
): Promise<boolean> {
  const element = page.locator(selector);
  const text = await element.textContent();
  return text?.includes(expectedText) || false;
}

/**
 * Wait for element to be visible
 */
export async function waitForElementVisible(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const field = page.locator(selector);
  await field.waitFor({ state: 'visible' });
  await field.fill(value);
  await field.blur();
}

/**
 * Select dropdown option
 */
export async function selectDropdownOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const dropdown = page.locator(selector);
  await dropdown.waitFor({ state: 'visible' });
  await dropdown.selectOption(value);
}

/**
 * Click button and wait for action to complete
 */
export async function clickButton(
  page: Page,
  selector: string,
  waitForSelector?: string
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible' });
  await page.click(selector);

  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { state: 'visible' });
  }
}

/**
 * Verify localStorage has expected data
 */
export async function checkLocalStorage(
  page: Page,
  key: string,
  expectedValue?: any
): Promise<boolean> {
  const value = await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);

  if (expectedValue) {
    return value === JSON.stringify(expectedValue);
  }

  return value !== null;
}

/**
 * Mock API responses for testing
 */
export async function mockAPIResponses(page: Page): Promise<void> {
  // Mock geocoding API
  await page.route('**/nominatim/**', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        {
          lat: '40.7128',
          lon: '-74.0060',
          display_name: '123 Main Street, Anytown, NY 10001',
        },
      ]),
    });
  });

  // Mock satellite image API
  await page.route('**/arcgis/**', (route) => {
    route.fulfill({
      status: 200,
      body: TEST_IMAGES.small,
      headers: { 'Content-Type': 'image/png' },
    });
  });
}

/**
 * Export test images for reuse
 */
const TEST_IMAGES = {
  small: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};
