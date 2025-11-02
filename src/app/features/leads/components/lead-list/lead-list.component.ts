import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data.service';
import { Lead, LeadStatus, LEAD_STATUSES } from '@shared/models/lead.model';

@Component({
  selector: 'app-lead-list',
  templateUrl: './lead-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class LeadListComponent {
  // Fix: Use output() function instead of @Output decorator
  viewLead = output<Lead>();

  private dataService = inject(DataService);
  
  filter = signal<LeadStatus | 'All'>('All');
  searchTerm = signal<string>('');
  
  statuses: (LeadStatus | 'All')[] = ['All', ...LEAD_STATUSES];

  filteredLeads = computed(() => {
    const leads = this.dataService.leads();
    const currentFilter = this.filter();
    const currentSearch = this.searchTerm().toLowerCase();

    return leads.filter(lead => {
      const statusMatch = currentFilter === 'All' || lead.status === currentFilter;
      const searchMatch = lead.address.toLowerCase().includes(currentSearch) || 
                          lead.homeownerName.toLowerCase().includes(currentSearch);
      return statusMatch && searchMatch;
    }).sort((a, b) => (b.roofScore ?? -1) - (a.roofScore ?? -1)); // Sort by score descending
  });

  getStatusColor(status: LeadStatus): string {
    const colors: Record<LeadStatus, string> = {
      'Not Visited': 'bg-slate-600',
      'Knocked': 'bg-gray-500',
      'Interested': 'bg-green-600',
      'Not Interested': 'bg-red-600',
      'Not Home': 'bg-amber-500',
      'Appointment': 'bg-sky-600',
      'Callback': 'bg-purple-600',
      'Completed': 'bg-emerald-600',
    };
    return colors[status];
  }
  
  getScoreColor(score: number | null): string {
    if (score === null || score === undefined) return 'bg-slate-400 text-slate-800';
    if (score >= 80) return 'bg-red-600 text-white';
    if (score >= 60) return 'bg-orange-500 text-white';
    if (score >= 40) return 'bg-yellow-500 text-slate-800';
    return 'bg-green-600 text-white';
  }

  onFilterChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.filter.set(selectElement.value as LeadStatus | 'All');
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchTerm.set(inputElement.value);
  }

  onViewLead(lead: Lead) {
    this.viewLead.emit(lead);
  }
}