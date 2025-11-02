import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '@core/services/data.service';
import { ReportService } from '@core/services/report.service';
import { Session } from '@shared/models/lead.model';

@Component({
  selector: 'app-sessions-view',
  templateUrl: './sessions-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
})
export class SessionsViewComponent {
  private dataService = inject(DataService);
  private reportService = inject(ReportService);
  allSessions = this.dataService.allSessions;
  activeSessionId = this.dataService.activeSessionId;

  createNewSession() {
    const sessionName = prompt('Enter a name for the new session:', `Session - ${new Date().toLocaleString()}`);
    if (sessionName) {
      this.dataService.startNewSession(sessionName);
    }
  }

  loadSession(session: Session) {
    this.dataService.loadSession(session.id);
  }

  deleteSession(event: MouseEvent, session: Session) {
    event.stopPropagation(); // Prevent loadSession from firing
    if (confirm(`Are you sure you want to delete session "${session.name}"? This cannot be undone.`)) {
      this.dataService.deleteSession(session.id);
    }
  }
  
  exportData() {
    this.dataService.exportLeadsToCSV();
  }

  async generateSessionPDF(event: MouseEvent, session: Session) {
    event.stopPropagation(); // Prevent loadSession from firing
    try {
      await this.reportService.generateSessionReport(session, {
        includeLeads: true,
        includeStatistics: true,
        includeTerritory: false,
      });
    } catch (error) {
      console.error('Failed to generate session PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  async generatePerformancePDF() {
    try {
      const sessions = this.allSessions();
      if (sessions.length === 0) {
        alert('No sessions available to generate a performance report.');
        return;
      }
      await this.reportService.generatePerformanceReport(sessions, {
        includeTrends: true,
        includeCharts: false,
      });
    } catch (error) {
      console.error('Failed to generate performance PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }
}
