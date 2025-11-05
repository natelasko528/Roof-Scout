/**
 * Page Object Model for Roof Scout Application
 */

import { Page, Locator } from '@playwright/test';

export class RoofScoutPage {
  readonly page: Page;

  // Navigation
  readonly mapViewBtn: Locator;
  readonly listViewBtn: Locator;
  readonly sessionsViewBtn: Locator;
  readonly chatbotBtn: Locator;

  // Dashboard
  readonly leadCount: Locator;
  readonly sessionCount: Locator;
  readonly addLeadBtn: Locator;

  // Lead Modal
  readonly leadModal: Locator;
  readonly addressInput: Locator;
  readonly homeownerInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly roofAgeSelect: Locator;
  readonly roofMaterialSelect: Locator;
  readonly visibleDamageInput: Locator;
  readonly notesInput: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;
  readonly saveLeadBtn: Locator;
  readonly cancelLeadBtn: Locator;

  // List View
  readonly leadList: Locator;
  readonly leadListItems: Locator;
  readonly searchBox: Locator;
  readonly statusFilter: Locator;

  // Map View
  readonly mapContainer: Locator;
  readonly mapZoomIn: Locator;
  readonly mapZoomOut: Locator;

  // Sessions View
  readonly sessionList: Locator;
  readonly createSessionBtn: Locator;
  readonly newSessionNameInput: Locator;
  readonly saveSessionBtn: Locator;

  // Chatbot
  readonly chatbotModal: Locator;
  readonly chatInput: Locator;
  readonly sendChatBtn: Locator;
  readonly chatMessages: Locator;

  // Storm Functionality
  readonly addressSearchInput: Locator;
  readonly searchResults: Locator;
  readonly stormDatesPanel: Locator;
  readonly stormEvents: Locator;
  readonly stormDateInput: Locator;
  readonly clearDateBtn: Locator;
  readonly affectedHomesTable: Locator;
  readonly affectedHomeRows: Locator;
  readonly stormTypeFilter: Locator;
  readonly severityFilter: Locator;
  readonly sortHeaders: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation - use exact text matching to avoid matching "Heatmap" when looking for "Map"
    this.mapViewBtn = page.locator('[data-testid="map-view-btn"]').or(page.getByRole('button', { name: 'Map', exact: true }));
    this.listViewBtn = page.locator('[data-testid="list-view-btn"]').or(page.getByRole('button', { name: 'List', exact: true }));
    this.sessionsViewBtn = page.locator('[data-testid="sessions-view-btn"]').or(page.getByRole('button', { name: 'Sessions', exact: true }));
    this.chatbotBtn = page.locator('[data-testid="chatbot-btn"], button:has-text("Chat")');

    // Dashboard
    this.leadCount = page.locator('[data-testid="lead-count"], .lead-count');
    this.sessionCount = page.locator('[data-testid="session-count"], .session-count');
    this.addLeadBtn = page.locator('[data-testid="add-lead-btn"], button:has-text("Add Lead")');

    // Lead Modal
    this.leadModal = page.locator('[data-testid="lead-modal"], .modal, .dialog');
    this.addressInput = page.locator('input[placeholder*="address" i], input[name="address"]');
    this.homeownerInput = page.locator('input[placeholder*="homeowner" i], input[name="homeownerName"]');
    this.phoneInput = page.locator('input[type="tel"], input[name="phone"]');
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.roofAgeSelect = page.locator('select[name="roofAge"], select:has-text("Age")');
    this.roofMaterialSelect = page.locator('select[name="roofMaterial"], select:has-text("Material")');
    this.visibleDamageInput = page.locator('textarea[name="visibleDamage"], input[name="visibleDamage"]');
    this.notesInput = page.locator('textarea[name="notes"]');
    this.prioritySelect = page.locator('select[name="priority"]');
    this.statusSelect = page.locator('select[name="status"]');
    this.saveLeadBtn = page.locator('[data-testid="save-lead-btn"], button:has-text("Save")');
    this.cancelLeadBtn = page.locator('[data-testid="cancel-lead-btn"], button:has-text("Cancel")');

    // List View
    this.leadList = page.locator('[data-testid="lead-list"], .lead-list');
    this.leadListItems = page.locator('[data-testid="lead-list-item"], .lead-list-item');
    this.searchBox = page.locator('input[placeholder*="search" i]');
    this.statusFilter = page.locator('select[placeholder*="status" i], select[name="statusFilter"]');

    // Map View
    this.mapContainer = page.locator('#map, .leaflet-container, [data-testid="map"]');
    this.mapZoomIn = page.locator('.leaflet-control-zoom-in, [title*="zoom in"]');
    this.mapZoomOut = page.locator('.leaflet-control-zoom-out, [title*="zoom out"]');

    // Sessions View
    this.sessionList = page.locator('[data-testid="session-list"], .session-list');
    this.createSessionBtn = page.locator('[data-testid="create-session-btn"], button:has-text("Create Session")');
    this.newSessionNameInput = page.locator('input[name="sessionName"], input[placeholder*="session" i]');
    this.saveSessionBtn = page.locator('button:has-text("Save"), button:has-text("Create")');

    // Chatbot
    this.chatbotModal = page.locator('[data-testid="chatbot-modal"], .chatbot-modal, .chat-modal');
    this.chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
    this.sendChatBtn = page.locator('button:has-text("Send"), [data-testid="send-chat-btn"]');
    this.chatMessages = page.locator('[data-testid="chat-messages"], .chat-messages, .message-list');

    // Storm Functionality
    this.addressSearchInput = page.locator('input[placeholder*="Search for an address"], [data-testid="address-search"]');
    this.searchResults = page.locator('[data-testid="search-result"], .search-result');
    this.stormDatesPanel = page.locator('app-storm-dates-panel, [data-testid="storm-dates-panel"]');
    this.stormEvents = page.locator('[data-testid="storm-event"], .storm-event');
    this.stormDateInput = page.locator('input[type="date"], [data-testid="storm-date-input"]');
    this.clearDateBtn = page.locator('button[title="Clear date"], [data-testid="clear-date-btn"]');
    this.affectedHomesTable = page.locator('app-affected-homes-table, [data-testid="affected-homes-table"]');
    this.affectedHomeRows = page.locator('[data-testid="affected-home-row"], .affected-home-row');
    this.stormTypeFilter = page.locator('select[data-testid="storm-type-filter"], .storm-type-filter');
    this.severityFilter = page.locator('select[data-testid="severity-filter"], .severity-filter');
    this.sortHeaders = page.locator('th[data-sortable], th.sortable');
  }

  async navigateTo(view: 'map' | 'list' | 'sessions'): Promise<void> {
    switch (view) {
      case 'map':
        await this.mapViewBtn.click();
        break;
      case 'list':
        await this.listViewBtn.click();
        break;
      case 'sessions':
        await this.sessionsViewBtn.click();
        break;
    }
    await this.page.waitForLoadState('networkidle');
  }

  async openChatbot(): Promise<void> {
    await this.chatbotBtn.click();
    await this.chatbotModal.waitFor({ state: 'visible' });
  }

  async sendChatMessage(message: string): Promise<void> {
    await this.chatInput.fill(message);
    await this.sendChatBtn.click();
  }

  async getChatMessages(): Promise<string[]> {
    const messages = await this.chatMessages.locator('.message, .chat-message').allTextContents();
    return messages;
  }

  async openLeadModal(): Promise<void> {
    await this.addLeadBtn.click();
    await this.leadModal.waitFor({ state: 'visible' });
  }

  async fillLeadForm(leadData: {
    address: string;
    homeownerName: string;
    phone: string;
    email: string;
    roofAge?: string;
    roofMaterial?: string;
    visibleDamage?: string;
    notes?: string;
    priority?: string;
    status?: string;
  }): Promise<void> {
    if (leadData.address) await this.addressInput.fill(leadData.address);
    if (leadData.homeownerName) await this.homeownerInput.fill(leadData.homeownerName);
    if (leadData.phone) await this.phoneInput.fill(leadData.phone);
    if (leadData.email) await this.emailInput.fill(leadData.email);
    if (leadData.roofAge) await this.roofAgeSelect.selectOption(leadData.roofAge);
    if (leadData.roofMaterial) await this.roofMaterialSelect.selectOption(leadData.roofMaterial);
    if (leadData.visibleDamage) await this.visibleDamageInput.fill(leadData.visibleDamage);
    if (leadData.notes) await this.notesInput.fill(leadData.notes);
    if (leadData.priority) await this.prioritySelect.selectOption(leadData.priority);
    if (leadData.status) await this.statusSelect.selectOption(leadData.status);
  }

  async saveLead(): Promise<void> {
    await this.saveLeadBtn.click();
    await this.leadModal.waitFor({ state: 'hidden' });
  }

  async cancelLead(): Promise<void> {
    await this.cancelLeadBtn.click();
    await this.leadModal.waitFor({ state: 'hidden' });
  }

  async createSession(sessionName: string): Promise<void> {
    await this.createSessionBtn.click();
    await this.newSessionNameInput.fill(sessionName);
    await this.saveSessionBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getLeadCount(): Promise<string> {
    return await this.leadCount.textContent();
  }

  async getSessionCount(): Promise<string> {
    return await this.sessionCount.textContent();
  }

  async searchLeads(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.page.waitForTimeout(500); // Wait for search to execute
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  // Storm functionality methods
  async searchAddress(address: string): Promise<void> {
    await this.addressSearchInput.fill(address);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async selectFirstSearchResult(): Promise<void> {
    await this.searchResults.first().click();
    await this.page.waitForTimeout(500);
  }

  async selectStormDate(date: string): Promise<void> {
    await this.stormDateInput.fill(date);
    await this.page.waitForTimeout(2000); // Wait for affected homes to load
  }

  async clearStormDate(): Promise<void> {
    if (await this.clearDateBtn.isVisible()) {
      await this.clearDateBtn.click();
    } else {
      await this.stormDateInput.fill('');
    }
    await this.page.waitForTimeout(500);
  }

  async getStormEvents(): Promise<string[]> {
    await this.stormEvents.first().waitFor({ state: 'visible', timeout: 15000 });
    return await this.stormEvents.allTextContents();
  }

  async getAffectedHomes(): Promise<string[]> {
    await this.affectedHomesTable.waitFor({ state: 'visible', timeout: 15000 });
    return await this.affectedHomeRows.allTextContents();
  }

  async sortAffectedHomesBy(column: string): Promise<void> {
    const header = this.page.locator(`th:has-text("${column}")`);
    await header.click();
    await this.page.waitForTimeout(500);
  }

  async filterAffectedHomesByStormType(stormType: string): Promise<void> {
    if (await this.stormTypeFilter.isVisible()) {
      await this.stormTypeFilter.selectOption(stormType);
      await this.page.waitForTimeout(500);
    }
  }

  async isStormDatesPanelVisible(): Promise<boolean> {
    return await this.stormDatesPanel.isVisible();
  }

  async isAffectedHomesTableVisible(): Promise<boolean> {
    return await this.affectedHomesTable.isVisible();
  }
}
