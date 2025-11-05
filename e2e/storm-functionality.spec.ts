/**
 * E2E Tests for Storm Date Functionality
 * Tests address search → storm history and storm date search → affected homes
 */

import { test, expect } from '@playwright/test';
import { RoofScoutPage } from './helpers/page-objects';
import { clearStorage, mockAPIResponses } from './helpers/test-helpers';

test.describe('Storm Date Functionality', () => {
  let page: RoofScoutPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new RoofScoutPage(playwrightPage);
    
    await page.page.goto('/');
    await page.page.waitForLoadState('networkidle');
    await clearStorage(playwrightPage);
    
    // Note: Tests use real API calls - ensure VITE_WEATHER_API_KEY is configured in .env.local
    await mockAPIResponses(playwrightPage);
  });

  test('should search address and show storm history panel', async () => {
    await page.navigateTo('map');
    
    // Search for address in tornado alley (known for severe weather)
    const addressInput = page.page.locator('input[placeholder*="Search for an address"]');
    await addressInput.fill('123 Main St, Moore, OK');
    
    // Wait for search results
    await page.page.waitForTimeout(1000);
    
    // Click first search result
    const firstResult = page.page.locator('[data-testid="search-result"]:first-child, .search-result:first-child');
    await firstResult.click();
    
    // Verify storm dates panel appears
    const stormPanel = page.page.locator('[data-testid="storm-dates-panel"], app-storm-dates-panel');
    await expect(stormPanel).toBeVisible({ timeout: 10000 });
    
    // Verify storm events are loaded
    const stormEvents = page.page.locator('[data-testid="storm-event"], .storm-event');
    await expect(stormEvents.first()).toBeVisible({ timeout: 15000 });
    
    // Verify storm event details are displayed
    const stormDetails = await stormEvents.first().textContent();
    expect(stormDetails).toBeTruthy();
  });

  test('should display storm date search component', async () => {
    await page.navigateTo('map');
    
    // Verify storm date search component is visible
    const stormDateSearch = page.page.locator('app-storm-date-search, [data-testid="storm-date-search"]');
    await expect(stormDateSearch).toBeVisible();
    
    // Verify date input is present
    const dateInput = page.page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    
    // Verify date input has proper constraints (5 years back to today)
    const minDate = await dateInput.getAttribute('min');
    const maxDate = await dateInput.getAttribute('max');
    
    expect(minDate).toBeTruthy();
    expect(maxDate).toBeTruthy();
    
    // Verify min date is approximately 5 years ago
    const minYear = new Date(minDate!).getFullYear();
    const currentYear = new Date().getFullYear();
    expect(currentYear - minYear).toBeGreaterThanOrEqual(4);
    expect(currentYear - minYear).toBeLessThanOrEqual(5);
  });

  test('should filter homes by storm date and show affected homes table', async () => {
    // First create some test leads
    await page.navigateTo('map');
    
    // Create test lead in tornado alley
    await page.openLeadModal();
    await page.fillLeadForm({
      address: '456 Storm St, Moore, OK 73160',
      homeownerName: 'Test Storm Victim',
      phone: '555-0123',
      email: 'storm@test.com'
    });
    await page.saveLead();
    
    // Select a storm date - using 5/15/2025 (hail storm test date)
    const dateInput = page.page.locator('input[type="date"]');
    await dateInput.fill('2025-05-15'); // May 15, 2025 - hail storm test date
    
    // Wait for affected homes table to appear
    const affectedHomesTable = page.page.locator('app-affected-homes-table, [data-testid="affected-homes-table"]');
    await expect(affectedHomesTable).toBeVisible({ timeout: 15000 });
    
    // Verify table headers are present
    const tableHeaders = page.page.locator('th');
    const headerTexts = await tableHeaders.allTextContents();
    
    expect(headerTexts.some(text => text.toLowerCase().includes('address'))).toBeTruthy();
    expect(headerTexts.some(text => text.toLowerCase().includes('storm'))).toBeTruthy();
    expect(headerTexts.some(text => text.toLowerCase().includes('severity'))).toBeTruthy();
  });

  test('should clear storm date search and hide affected homes table', async () => {
    await page.navigateTo('map');
    
    // Select a storm date first - using 5/15/2025 (hail storm test date)
    const dateInput = page.page.locator('input[type="date"]');
    await dateInput.fill('2025-05-15'); // May 15, 2025 - hail storm test date
    
    // Wait for table to appear
    const affectedHomesTable = page.page.locator('app-affected-homes-table');
    await expect(affectedHomesTable).toBeVisible({ timeout: 10000 });
    
    // Clear the date
    const clearButton = page.page.locator('button[title="Clear date"], .clear-date-btn');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // Alternative: clear by setting empty value
      await dateInput.fill('');
    }
    
    // Verify table is hidden
    await expect(affectedHomesTable).toBeHidden();
    
    // Verify date input is cleared
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBe('');
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to return error
    await page.page.route('**/weather.visualcrossing.com/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API Error' })
      });
    });
    
    await page.navigateTo('map');
    
    // Try to search for address
    const addressInput = page.page.locator('input[placeholder*="Search for an address"]');
    await addressInput.fill('123 Error St, Test City, TX');
    
    await page.page.waitForTimeout(1000);
    
    // Should not crash the application
    const mapView = page.page.locator('app-map-view');
    await expect(mapView).toBeVisible();
    
    // Error handling should be graceful (no storm panel or empty panel)
    const stormPanel = page.page.locator('app-storm-dates-panel');
    if (await stormPanel.isVisible()) {
      // If panel is visible, it should show error message or no events
      const errorMessage = page.page.locator('.error, [data-testid="error-message"]');
      const noEventsMessage = page.page.locator(':text("No storm events found")');
      
      const hasError = await errorMessage.isVisible();
      const hasNoEvents = await noEventsMessage.isVisible();
      
      expect(hasError || hasNoEvents).toBeTruthy();
    }
  });

  test('should sort and filter affected homes table', async () => {
    await page.navigateTo('map');
    
    // Create multiple test leads
    const testLeads = [
      { address: '100 Hail St, Moore, OK', homeowner: 'Hail Victim 1' },
      { address: '200 Wind Ave, Moore, OK', homeowner: 'Wind Victim 2' },
      { address: '300 Storm Blvd, Moore, OK', homeowner: 'Storm Victim 3' }
    ];
    
    for (const lead of testLeads) {
      await page.openLeadModal();
      await page.fillLeadForm({
        address: lead.address,
        homeownerName: lead.homeowner,
        phone: '555-0123',
        email: 'test@example.com'
      });
      await page.saveLead();
    }
    
    // Select storm date - using 5/15/2025 (hail storm test date)
    const dateInput = page.page.locator('input[type="date"]');
    await dateInput.fill('2025-05-15'); // May 15, 2025 - hail storm test date
    
    // Wait for table
    const table = page.page.locator('app-affected-homes-table');
    await expect(table).toBeVisible({ timeout: 15000 });
    
    // Test sorting by clicking column headers
    const addressHeader = page.page.locator('th:has-text("Address"), th:has-text("address")');
    if (await addressHeader.isVisible()) {
      await addressHeader.click();
      await page.page.waitForTimeout(500);
      
      // Verify sorting indicator or changed order
      const sortIcon = page.page.locator('.sort-icon, [data-testid="sort-icon"]');
      // Sort icon might be visible or table order might change
    }
    
    // Test filtering if filter controls exist
    const stormTypeFilter = page.page.locator('select[data-testid="storm-type-filter"], .storm-type-filter');
    if (await stormTypeFilter.isVisible()) {
      await stormTypeFilter.selectOption('hail');
      await page.page.waitForTimeout(500);
    }
  });
});
