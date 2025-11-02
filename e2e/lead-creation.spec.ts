/**
 * E2E Tests for Lead Creation Flow
 */

import { test, expect } from '@playwright/test';
import { RoofScoutPage } from './helpers/page-objects';
import { TEST_DATA, generateUniqueLead } from './fixtures/test-data';
import { clearStorage, mockAPIResponses } from './helpers/test-helpers';

test.describe('Lead Creation Flow', () => {
  let page: RoofScoutPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new RoofScoutPage(playwrightPage);
    
    // Navigate to page first
    await page.page.goto('/');
    
    // Wait for Angular to load
    await page.page.waitForLoadState('networkidle');
    
    // Clear storage before each test
    await clearStorage(playwrightPage);

    // Mock API responses to avoid real API calls
    await mockAPIResponses(playwrightPage);
  });

  test('should open add lead modal when clicking Add Lead button', async () => {
    await page.navigateTo('map');
    await page.openLeadModal();

    // Verify modal is visible
    await expect(page.leadModal).toBeVisible();

    // Verify all form fields are present
    await expect(page.addressInput).toBeVisible();
    await expect(page.homeownerInput).toBeVisible();
    await expect(page.phoneInput).toBeVisible();
    await expect(page.emailInput).toBeVisible();
    await expect(page.roofAgeSelect).toBeVisible();
    await expect(page.roofMaterialSelect).toBeVisible();
    await expect(page.notesInput).toBeVisible();
  });

  test('should create a lead with required fields only', async () => {
    await page.navigateTo('map');
    await page.openLeadModal();

    const lead = generateUniqueLead({
      address: '123 Test Street, Test City, TX 77001',
      homeownerName: 'Test Homeowner',
      phone: '555-0123',
      email: 'test@example.com',
    });

    await page.fillLeadForm(lead);
    await page.saveLead();

    // Verify lead count increased
    const leadCountText = await page.getLeadCount();
    expect(parseInt(leadCountText || '0')).toBeGreaterThan(0);

    // Navigate to list view to verify lead was saved
    await page.navigateTo('list');

    // Verify lead appears in list
    await expect(page.leadListItems.first()).toBeVisible();

    // Check if lead data is present (address is usually displayed)
    const leadItems = await page.leadListItems.allTextContents();
    const hasAddress = leadItems.some(item => item.includes('Test Street'));
    expect(hasAddress).toBeTruthy();
  });

  test('should create a lead with all fields filled', async () => {
    await page.navigateTo('map');
    await page.openLeadModal();

    const lead = generateUniqueLead({
      address: '456 Complete Street, Full City, CA 90001',
      homeownerName: 'Complete Test User',
      phone: '555-9999',
      email: 'complete@example.com',
      roofAge: '10-15 years',
      roofMaterial: 'Asphalt Shingle',
      visibleDamage: 'Hail damage from recent storm',
      notes: 'Very interested in replacement, insurance claim filed',
      priority: 'High',
      status: 'Interested',
    });

    await page.fillLeadForm(lead);
    await page.saveLead();

    // Navigate to list view
    await page.navigateTo('list');

    // Verify lead appears in list
    await expect(page.leadListItems.first()).toBeVisible();

    // Check for homeowner name in the list
    const leadItems = await page.leadListItems.allTextContents();
    const hasHomeowner = leadItems.some(item => item.includes('Complete Test User'));
    expect(hasHomeowner).toBeTruthy();
  });

  test('should validate required fields', async () => {
    await page.navigateTo('map');
    await page.openLeadModal();

    // Try to save without filling required fields
    await page.saveLeadBtn.click();

    // Form should still be visible (validation prevents save)
    await expect(page.leadModal).toBeVisible();

    // Fill only one field and try again
    await page.addressInput.fill('123 Test Street');
    await page.saveLeadBtn.click();

    // Modal should still be visible
    await expect(page.leadModal).toBeVisible();
  });

  test('should cancel lead creation', async () => {
    await page.navigateTo('map');
    await page.openLeadModal();

    const lead = generateUniqueLead({
      address: '789 Cancel Street, Abort City, FL 30001',
      homeownerName: 'Cancel Test',
    });

    await page.fillLeadForm(lead);
    await page.cancelLead();

    // Modal should be hidden
    await expect(page.leadModal).toBeHidden();

    // Navigate to list view to verify lead was NOT saved
    await page.navigateTo('list');

    // Check that the cancelled lead is not in the list
    const leadItems = await page.leadListItems.allTextContents();
    const hasCancelledLead = leadItems.some(item => item.includes('Cancel Street'));
    expect(hasCancelledLead).toBeFalsy();
  });

  test('should create multiple leads in succession', async () => {
    await page.navigateTo('map');

    // Create first lead
    await page.openLeadModal();
    await page.fillLeadForm(generateUniqueLead({
      address: '100 Lead 1 Street',
      homeownerName: 'Lead One',
    }));
    await page.saveLead();

    // Create second lead
    await page.openLeadModal();
    await page.fillLeadForm(generateUniqueLead({
      address: '200 Lead 2 Street',
      homeownerName: 'Lead Two',
    }));
    await page.saveLead();

    // Navigate to list view
    await page.navigateTo('list');

    // Verify both leads appear
    const leadItems = await page.leadListItems.allTextContents();
    expect(leadItems.length).toBeGreaterThanOrEqual(2);

    const hasLeadOne = leadItems.some(item => item.includes('Lead One'));
    const hasLeadTwo = leadItems.some(item => item.includes('Lead Two'));
    expect(hasLeadOne).toBeTruthy();
    expect(hasLeadTwo).toBeTruthy();
  });

  test('should persist leads across view switches', async () => {
    // Create a lead
    await page.navigateTo('map');
    await page.openLeadModal();
    const lead = generateUniqueLead({
      address: '300 Persist Street, Save City, CO 80001',
      homeownerName: 'Persist Test',
    });
    await page.fillLeadForm(lead);
    await page.saveLead();

    // Switch to different views
    await page.navigateTo('list');
    await page.navigateTo('sessions');
    await page.navigateTo('map');

    // Switch back to list
    await page.navigateTo('list');

    // Verify lead is still present
    const leadItems = await page.leadListItems.allTextContents();
    const hasPersistLead = leadItems.some(item => item.includes('Persist Street'));
    expect(hasPersistLead).toBeTruthy();
  });

  test('should update lead count in dashboard', async () => {
    await page.navigateTo('map');

    // Check initial count
    const initialCount = await page.getLeadCount();
    const initialNum = parseInt(initialCount || '0');

    // Create a lead
    await page.openLeadModal();
    await page.fillLeadForm(generateUniqueLead({
      address: '400 Count Street, Track City, WA 90001',
      homeownerName: 'Count Test',
    }));
    await page.saveLead();

    // Verify count increased by 1
    const newCount = await page.getLeadCount();
    const newNum = parseInt(newCount || '0');
    expect(newNum).toBe(initialNum + 1);
  });
});
