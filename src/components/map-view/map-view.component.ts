import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Lead, LeadStatus } from '../../models';
import { InteractiveMapComponent } from '../interactive-map/interactive-map.component';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InteractiveMapComponent],
})
export class MapViewComponent {
  // Fix: Use output() function instead of @Output decorator
  viewLead = output<Lead>();
  // Fix: Use output() function instead of @Output decorator
  newLead = output<string>();

  private dataService = inject(DataService);
  leads = this.dataService.leads;

  stats = computed(() => {
    const leads = this.leads();
    const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadStatus, number>);
    
    return [
      { label: 'Total Leads', value: leads.length, color: 'bg-indigo-500' },
      { label: 'Interested', value: statusCounts['Interested'] || 0, color: 'bg-green-500' },
      { label: 'Appointment', value: statusCounts['Appointment'] || 0, color: 'bg-sky-500' },
      { label: 'Not Home', value: statusCounts['Not Home'] || 0, color: 'bg-amber-500' },
    ];
  });

  onViewLead(lead: Lead) {
    this.viewLead.emit(lead);
  }

  onNewLead(address: string) {
    this.newLead.emit(address);
  }
}
