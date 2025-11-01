import { Injectable, signal, computed, effect } from '@angular/core';
import { Lead, Session } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly SESSIONS_KEY = 'roof_scout_sessions';
  private readonly ACTIVE_SESSION_ID_KEY = 'roof_scout_active_session_id';

  allSessions = signal<Session[]>([]);
  activeSessionId = signal<string | null>(null);

  activeSession = computed<Session | null>(() => {
    const id = this.activeSessionId();
    if (!id) return null;
    return this.allSessions().find(s => s.id === id) ?? null;
  });

  leads = computed<Lead[]>(() => {
    return this.activeSession()?.leads ?? [];
  });

  // Memoized filtered leads with O(1) lookup instead of O(n log n) sorting
  filteredLeads = computed(() => {
    const allLeads = this.leads();
    // Create a Map for O(1) status-based filtering
    const statusGroups = new Map<string, Lead[]>();

    // Single pass through leads instead of multiple sorts
    allLeads.forEach(lead => {
      const status = lead.status || 'Not Visited';
      if (!statusGroups.has(status)) {
        statusGroups.set(status, []);
      }
      statusGroups.get(status)!.push(lead);
    });

    // Flatten back to array while maintaining insertion order priority
    const result: Lead[] = [];
    statusGroups.forEach(leads => {
      result.push(...leads);
    });

    return result;
  });

  private lastSavedState: string = '';

  constructor() {
    this.loadFromLocalStorage();
    effect(() => {
      const currentState = JSON.stringify({
        sessions: this.allSessions(),
        activeId: this.activeSessionId()
      });

      if (currentState !== this.lastSavedState) {
        this.saveToLocalStorage(currentState);
      }
    });
  }

  private loadFromLocalStorage() {
    try {
      const sessionsJson = localStorage.getItem(this.SESSIONS_KEY);
      const activeId = localStorage.getItem(this.ACTIVE_SESSION_ID_KEY);

      if (sessionsJson) {
        this.allSessions.set(JSON.parse(sessionsJson));
      }

      if (activeId) {
        this.activeSessionId.set(activeId);
      } else if (this.allSessions().length > 0) {
        const firstSession = this.allSessions()[0];
        if (firstSession) {
          this.activeSessionId.set(firstSession.id);
        }
      } else {
        this.startNewSession(`Session - ${new Date().toLocaleDateString()}`);
      }

      // Initialize last saved state
      this.lastSavedState = JSON.stringify({
        sessions: this.allSessions(),
        activeId: this.activeSessionId()
      });

    } catch (e) {
      console.error('Failed to load data from localStorage', e);
      this.startNewSession(`Recovery Session - ${new Date().toLocaleDateString()}`);
    }
  }

  private saveToLocalStorage(stateToSave?: string) {
    try {
      const state = stateToSave || JSON.stringify({
        sessions: this.allSessions(),
        activeId: this.activeSessionId()
      });

      // Check available quota before saving
      const estimatedSize = new Blob([state]).size;
      const quotaLimit = 5 * 1024 * 1024; // 5MB typical limit
      const currentUsage = this.getLocalStorageUsage();

      if (currentUsage + estimatedSize > quotaLimit) {
        console.warn('localStorage quota exceeded. Attempting cleanup...');
        this.handleQuotaExceeded(estimatedSize);
        return;
      }

      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.allSessions()));
      localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, this.activeSessionId() || '');
      this.lastSavedState = state;
    } catch (e) {
      console.error('Failed to save data to localStorage:', e);
      // Handle quota exceeded error specifically
      if (e instanceof Error && (e.name === 'QuotaExceededError' || (e as any).code === 22)) {
        console.error('localStorage quota exceeded. Consider removing some leads or images.');
        this.handleQuotaExceeded();
      }
    }
  }

  private getLocalStorageUsage(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  private handleQuotaExceeded(estimatedSize?: number) {
    try {
      // Try to clean up old image data first
      const sessions = this.allSessions();
      let cleaned = false;

      for (const session of sessions) {
        for (const lead of session.leads) {
          // Check if lead has large image data
          if (lead.userImageUrls && lead.userImageUrls.length > 0) {
            // Count total image size
            const imageSize = lead.userImageUrls.reduce((sum, img) => {
              // Base64 images are roughly 4/3 the original size
              return sum + (img.length * 0.75);
            }, 0);

            if (imageSize > 500 * 1024) { // If > 500KB of images
              // Keep only the first 2 images to save space
              lead.userImageUrls = lead.userImageUrls.slice(0, 2);
              cleaned = true;
            }
          }
        }
      }

      if (!cleaned) {
        // If no images to clean, remove oldest leads
        const allLeads = sessions.flatMap(s => s.leads).sort((a, b) => a.createdAt - b.createdAt);
        const leadsToRemove = Math.min(10, Math.floor(allLeads.length * 0.1)); // Remove oldest 10%

        for (let i = 0; i < leadsToRemove; i++) {
          const leadToRemove = allLeads[i];
          if (!leadToRemove) continue;
          const session = sessions.find(s => s.leads.some(l => l.id === leadToRemove.id));
          if (session) {
            session.leads = session.leads.filter(l => l.id !== leadToRemove.id);
            cleaned = true;
          }
        }
      }

      if (cleaned) {
        // Retry save after cleanup
        const state = JSON.stringify({
          sessions: this.allSessions(),
          activeId: this.activeSessionId()
        });
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.allSessions()));
        localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, this.activeSessionId() || '');
      } else {
        console.error('Unable to free up localStorage space. Please export your data and clear storage manually.');
        // Could trigger a user notification here
      }
    } catch (e) {
      console.error('Failed to handle quota exceeded:', e);
    }
  }

  startNewSession(name: string) {
    // Validate input
    if (!name || typeof name !== 'string') {
      throw new Error('Session name must be a non-empty string');
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Session name cannot be empty or whitespace');
    }

    if (trimmedName.length > 100) {
      throw new Error('Session name must be less than 100 characters');
    }

    const newSession: Session = {
      id: self.crypto.randomUUID(),
      name: trimmedName,
      createdAt: Date.now(),
      leads: [],
    };
    this.allSessions.update(sessions => [...sessions, newSession]);
    this.activeSessionId.set(newSession.id);
  }
  
  loadSession(sessionId: string) {
    this.activeSessionId.set(sessionId);
  }
  
  deleteSession(sessionId: string) {
    const sessions = this.allSessions();
    const targetSession = sessions.find(s => s.id === sessionId);

    // Validate session exists
    if (!targetSession) {
      console.warn('Session not found:', sessionId);
      return;
    }

    this.allSessions.update(sessions => sessions.filter(s => s.id !== sessionId));

    // If we deleted the active session, handle active session state
    if (this.activeSessionId() === sessionId) {
      const remainingSessions = this.allSessions();
      if (remainingSessions.length > 0) {
        // Switch to first remaining session
        const firstSession = remainingSessions[0];
        if (firstSession) {
          this.activeSessionId.set(firstSession.id);
        }
      } else {
        // No sessions left, create a new one
        this.startNewSession(`Session - ${new Date().toLocaleDateString()}`);
      }
    }
  }

  addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Lead {
    // Validate required fields
    if (!lead.address || typeof lead.address !== 'string' || lead.address.trim().length === 0) {
      throw new Error('Lead address is required');
    }

    if (!lead.homeownerName || typeof lead.homeownerName !== 'string' || lead.homeownerName.trim().length === 0) {
      throw new Error('Homeowner name is required');
    }

    // Validate optional fields if present
    if (lead.email && typeof lead.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        throw new Error('Invalid email format');
      }
    }

    if (lead.phone && typeof lead.phone === 'string') {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(lead.phone)) {
        throw new Error('Invalid phone format');
      }
    }

    // Ensure active session exists
    if (!this.activeSessionId() || !this.activeSession()) {
      throw new Error('No active session available');
    }

    const newLead: Lead = {
      ...lead,
      id: self.crypto.randomUUID(),
      createdAt: Date.now(),
    };
    this.allSessions.update(sessions =>
      sessions.map(s =>
        s.id === this.activeSessionId() ? { ...s, leads: [...s.leads, newLead] } : s
      )
    );
    return newLead;
  }

  updateLead(updatedLead: Lead): void {
    // Validate required fields
    if (!updatedLead.id) {
      throw new Error('Lead ID is required for update');
    }

    if (!updatedLead.address || typeof updatedLead.address !== 'string' || updatedLead.address.trim().length === 0) {
      throw new Error('Lead address is required');
    }

    if (!updatedLead.homeownerName || typeof updatedLead.homeownerName !== 'string' || updatedLead.homeownerName.trim().length === 0) {
      throw new Error('Homeowner name is required');
    }

    // Validate optional fields if present
    if (updatedLead.email && typeof updatedLead.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updatedLead.email)) {
        throw new Error('Invalid email format');
      }
    }

    if (updatedLead.phone && typeof updatedLead.phone === 'string') {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(updatedLead.phone)) {
        throw new Error('Invalid phone format');
      }
    }

    // Ensure active session exists
    if (!this.activeSessionId() || !this.activeSession()) {
      throw new Error('No active session available');
    }

    this.allSessions.update(sessions =>
      sessions.map(s =>
        s.id === this.activeSessionId()
          ? {
              ...s,
              leads: s.leads.map(l => (l.id === updatedLead.id ? updatedLead : l)),
            }
          : s
      )
    );
  }

  deleteLead(leadId: string) {
     this.allSessions.update(sessions =>
      sessions.map(s =>
        s.id === this.activeSessionId()
          ? { ...s, leads: s.leads.filter(l => l.id !== leadId) }
          : s
      )
    );
  }

  exportLeadsToCSV(): void {
    const currentLeads = this.leads();
    if (currentLeads.length === 0) {
      alert('No leads to export.');
      return;
    }

    // Helper function to safely stringify values for CSV
    const escapeCSVValue = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }

      // Handle arrays (e.g., userImageUrls)
      if (Array.isArray(value)) {
        value = value.join('; ');
      }

      // Handle objects (e.g., nested data)
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      // Convert to string
      let str = String(value);

      // Escape quotes by doubling them
      str = str.replace(/"/g, '""');

      // If the string contains comma, quote, or newline, wrap in quotes
      if (/[",\r\n]/.test(str)) {
        str = `"${str}"`;
      }

      return str;
    };

    // Get all possible headers from all leads to ensure consistency
    const allHeaders = new Set<string>();
    currentLeads.forEach(lead => {
      Object.keys(lead).forEach(key => allHeaders.add(key));
    });
    const headers = Array.from(allHeaders);

    // Generate CSV rows with proper escaping
    const csvRows: string[] = [];
    csvRows.push(headers.map(escapeCSVValue).join(','));

    currentLeads.forEach(lead => {
      const row = headers.map(header => {
        const value = (lead as any)[header];
        return escapeCSVValue(value);
      });
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `roof_scout_leads_${new Date().toISOString().split('T')[0]}.csv`);

    try {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download CSV:', e);
      alert('Failed to download CSV file. Please try again.');
      window.URL.revokeObjectURL(url);
    }
  }
}