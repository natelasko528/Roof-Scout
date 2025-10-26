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

  constructor() {
    this.loadFromLocalStorage();
    effect(() => {
      this.saveToLocalStorage();
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
        this.activeSessionId.set(this.allSessions()[0].id);
      } else {
        this.startNewSession(`Session - ${new Date().toLocaleDateString()}`);
      }

    } catch (e) {
      console.error('Failed to load data from localStorage', e);
      this.startNewSession(`Recovery Session - ${new Date().toLocaleDateString()}`);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.allSessions()));
      localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, this.activeSessionId() || '');
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }
  }

  startNewSession(name: string) {
    const newSession: Session = {
      id: self.crypto.randomUUID(),
      name,
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
    this.allSessions.update(sessions => sessions.filter(s => s.id !== sessionId));
    if (this.activeSessionId() === sessionId) {
      this.activeSessionId.set(this.allSessions().length > 0 ? this.allSessions()[0].id : null);
       if (!this.activeSessionId() && this.allSessions().length === 0) {
           this.startNewSession(`Session - ${new Date().toLocaleDateString()}`);
       }
    }
  }

  addLead(lead: Omit<Lead, 'id' | 'createdAt'>) {
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
  }

  updateLead(updatedLead: Lead) {
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

  exportLeadsToCSV() {
    const currentLeads = this.leads();
    if (currentLeads.length === 0) {
      alert('No leads to export.');
      return;
    }

    const headers = Object.keys(currentLeads[0]);
    const csvRows = [
      headers.join(','),
      ...currentLeads.map(lead =>
        headers
          .map(header => JSON.stringify((lead as any)[header], (key, value) => value === null ? '' : value))
          .join(',')
      ),
    ];
    
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `roof_scout_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
