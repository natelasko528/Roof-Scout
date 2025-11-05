import { Component, ChangeDetectionStrategy, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data.service';
import { ReportService } from '@core/services/report.service';
import { StormDateService } from '@core/services/storm-date.service';
import { Lead, LeadStatus } from '@shared/models/lead.model';
import { AffectedHome } from '@shared/models/storm.model';
import { InteractiveMapComponent } from '../interactive-map/interactive-map.component';
import { StormDateSearchComponent } from '@features/storm/components/storm-date-search/storm-date-search.component';
import { AffectedHomesTableComponent } from '@features/storm/components/affected-homes-table/affected-homes-table.component';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InteractiveMapComponent, StormDateSearchComponent, AffectedHomesTableComponent],
})
export class MapViewComponent {
  // Fix: Use output() function instead of @Output decorator
  viewLead = output<Lead>();
  // Fix: Use output() function instead of @Output decorator
  newLead = output<string>();

  private dataService = inject(DataService);
  private reportService = inject(ReportService);
  private stormDateService = inject(StormDateService);
  leads = this.dataService.leads;

  // Storm date search state
  affectedHomes = signal<AffectedHome[]>([]);
  isLoadingAffectedHomes = signal<boolean>(false);
  selectedStormDate = signal<string | null>(null);
  showAffectedHomes = signal<boolean>(false);

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

  async generateTerritoryPDF() {
    try {
      const leads = this.leads();
      if (leads.length === 0) {
        alert('No leads available to generate a territory report.');
        return;
      }
      await this.reportService.generateTerritoryReport(leads, {
        includeDensityMap: true,
        includeLeadSummary: true,
      });
    } catch (error) {
      console.error('Failed to generate territory PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  async onStormDateSelected(date: string) {
    this.selectedStormDate.set(date);
    this.isLoadingAffectedHomes.set(true);
    this.showAffectedHomes.set(true);

    try {
      const homes = await this.stormDateService.findHomesAffectedByDate(date);
      this.affectedHomes.set(homes);
    } catch (error) {
      console.error('Failed to find affected homes:', error);
      this.affectedHomes.set([]);
      alert('Failed to search for affected homes. Please try again.');
    } finally {
      this.isLoadingAffectedHomes.set(false);
    }
  }

  onStormDateCleared() {
    this.selectedStormDate.set(null);
    this.affectedHomes.set([]);
    this.showAffectedHomes.set(false);
  }

  onHomeSelected(home: AffectedHome) {
    // Handle home selection from both table and map
    console.log('Home selected:', home);

    // Could emit to parent to show detailed storm information
    // For now, we'll just log the selection

    // Future enhancement: Show detailed storm modal
    // this.showStormDetailModal(home);
  }

  onViewHomeOnMap(home: AffectedHome) {
    // This method is called from the table "View on Map" button
    // The map will automatically show the storm marker when affectedHomes updates
    console.log('View on map:', home);

    // Future enhancement: Center map on specific home
    // this.centerMapOnHome(home);
  }

  formatStormDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
