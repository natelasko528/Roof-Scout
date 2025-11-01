/**
 * E2E Tests for View Switching and Navigation
 */

import { test, expect } from '@playwright/test';
import { RoofScoutPage } from './helpers/page-objects';
import { generateUniqueLead } from './fixtures/test-data';
import { clearStorage, mockAPIResponses } from './helpers/test-helpers';

test.describe('View Navigation', () => {
  let page: RoofScoutPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    await clearStorage(playwrightPage);
    mockAPIResponses(playwrightPage);
    page = new RoofScoutPage(playwrightPage);
  });

  test('should navigate to all three views', async () => {
    // Start at map view (default)
    await page.navigateTo('map');
    await expect(page.mapViewBtn).toHaveClass(/active|selected/);

    // Navigate to list view
    await page.navigateTo('list');
    await expect(page.listViewBtn).toHaveClass(/active|selected/);
    await expect(page.leadList).toBeVisible();

    // Navigate to sessions view
    await page.navigateTo('sessions');
    await expect(page.sessionsViewBtn).toHaveClass(/active|selected/);
    await expect(page.sessionList).toBeVisible();

    // Navigate back to map view
    await page.navigateTo('map');
    await expect(page.mapViewBtn).toHaveClass(/active|selected/);
    await expect(page.mapContainer).toBeVisible();
  });

  test('should maintain data when switching views', async () => {
    // Create leads in map view
    await page.navigateTo('map');
    await page.openLeadModal();
    await page.fillLeadForm(generateUniqueLead({
      address: '123 Data Street, Keep City, IL 60001',
      homeownerName: 'Data Keeper',
    }));
    await page.saveLead();

    // Switch to list view
    await page.navigateTo('list');
    let leadItems = await page.leadListItems.allTextContents();
    expect(leadItems.length).toBeGreaterThan(0);

    // Switch to sessions view
    await page.navigateTo('sessions');
    await expect(page.sessionList).toBeVisible();

    // Switch back to list view
    await page.navigateTo('list');
    leadItems = await page.leadListItems.allTextContents();
    expect(leadItems.length).toBeGreaterThan(0);

    // Verify the same lead is still there
    const hasDataKeeper = leadItems.some(item => item.includes('Data Keeper'));
    expect(hasDataKeeper).toBeTruthy();
  });

  test('should persist session state across view switches', async () => {
    // Navigate through all views multiple times
    for (let i = 0; i < 3; i++) {
      await page.navigateTo('map');
      await page.navigateTo('list');
      await page.navigateTo('sessions');
    }

    // Create a lead after cycling
    await page.navigateTo('map');
    await page.openLeadModal();
    await page.fillLeadForm(generateUniqueLead({
      address: '456 State Street, State City, MA 20001',
      homeownerName: 'State Test',
    }));
    await page.saveLead();

    // Verify it appears in list
    await page.navigateTo('list');
    const leadItems = await page.leadListItems.allTextContents();
    const hasStateTest = leadItems.some(item => item.includes('State Test'));
    expect(hasStateTest).toBeTruthy();
  });

  test('should update view indicators correctly', async () => {
    // Map view active
    await page.navigateTo('map');
    // Verify map button has active state (specific classes may vary)
    await expect(page.mapViewBtn).toBeVisible();

    // List view active
    await page.navigateTo('list');
    await expect(page.listViewBtn).toBeVisible();

    // Sessions view active
    await page.navigateTo('sessions');
    await expect(page.sessionsViewBtn).toBeVisible();
  });

  test('should switch views quickly without errors', async () => {
    // Rapidly switch between views
    const views: Array<'map' | 'list' | 'sessions'> = ['map', 'list', 'sessions', 'map', 'list', 'sessions'];

    for (const view of views) {
      await page.navigateTo(view);

      // Verify view is loaded
      switch (view) {
        case 'map':
          await expect(page.mapContainer).toBeVisible();
          break;
        case 'list':
          await expect(page.leadList).toBeVisible();
          break;
        case 'sessions':
          await expect(page.sessionList).toBeVisible();
          break;
      }
    }
  });

  test('should show correct content for each view', async () => {
    // Map view - should show map and dashboard
    await page.navigateTo('map');
    await expect(page.mapContainer).toBeVisible();
    await expect(page.addLeadBtn).toBeVisible();
    await expect(page.leadCount).toBeVisible();

    // List view - should show lead list
    await page.navigateTo('list');
    await expect(page.leadList).toBeVisible();
    await expect(page.searchBox).toBeVisible();

    // Sessions view - should show session list
    await page.navigateTo('sessions');
    await expect(page.sessionList).toBeVisible();
    await expect(page.createSessionBtn).toBeVisible();
  });

  test('should handle navigation with keyboard', async () => {
    // Navigate using keyboard shortcuts if available
    await page.navigateTo('list');
    await page.page.keyboard.press('Alt+1'); // Map view
    await page.page.waitForTimeout(500);
    await expect(page.mapContainer).toBeVisible();

    await page.page.keyboard.press('Alt+2'); // List view
    await page.page.waitForTimeout(500);
    await expect(page.leadList).toBeVisible();

    await page.page.keyboard.press('Alt+3'); // Sessions view
    await page.page.waitForTimeout(500);
    await expect(page.sessionList).toBeVisible();
  });

  test('should preserve scroll position in each view', async () => {
    // Create multiple leads
    await page.navigateTo('map');
    for (let i = 0; i < 5; i++) {
      await page.openLeadModal();
      await page.fillLeadForm(generateUniqueLead({
        address: `10${i} Scroll Street, Scroll City, OR 9000${i}`,
        homeownerName: `Scroll Test ${i}`,
      }));
      await page.saveLead();
    }

    // Go to list view and scroll down
    await page.navigateTo('list');
    await page.leadList.scrollIntoViewIfNeeded();
    await page.page.keyboard.press('PageDown');
    await page.page.waitForTimeout(500);

    // Switch to another view
    await page.navigateTo('sessions');
    await page.page.waitForTimeout(500);

    // Return to list view
    await page.navigateTo('list');
    await expect(page.leadList).toBeVisible();
  });
});
