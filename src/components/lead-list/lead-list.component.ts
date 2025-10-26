import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Lead, LeadStatus, LEAD_STATUSES } from '../../models';

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
    });
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
