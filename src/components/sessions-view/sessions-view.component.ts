import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Session } from '../../models';

@Component({
  selector: 'app-sessions-view',
  templateUrl: './sessions-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
})
export class SessionsViewComponent {
  private dataService = inject(DataService);
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
}
