import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffectedHome } from '@shared/models/storm.model';

type SortColumn = 'address' | 'stormDate' | 'stormType' | 'severity';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-affected-homes-table',
  templateUrl: './affected-homes-table.component.html',
  styleUrls: ['./affected-homes-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AffectedHomesTableComponent {
  // Inputs
  affectedHomes = input.required<AffectedHome[]>();
  isLoading = input<boolean>(false);

  // Outputs
  homeSelected = output<AffectedHome>();
  viewOnMap = output<AffectedHome>();

  // Sorting state
  sortColumn = signal<SortColumn | null>(null);
  sortDirection = signal<SortDirection>('asc');

  // Filter state
  stormTypeFilter = signal<string>('all');
  severityFilter = signal<string>('all');

  // Computed sorted and filtered homes
  sortedAndFilteredHomes = computed(() => {
    let homes = [...this.affectedHomes()];

    // Apply filters
    if (this.stormTypeFilter() !== 'all') {
      homes = homes.filter(h => h.stormType === this.stormTypeFilter());
    }
    if (this.severityFilter() !== 'all') {
      homes = homes.filter(h => h.severity === this.severityFilter());
    }

    // Apply sorting
    const column = this.sortColumn();
    const direction = this.sortDirection();
    
    if (column) {
      homes.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (column) {
          case 'address':
            aValue = a.address.toLowerCase();
            bValue = b.address.toLowerCase();
            break;
          case 'stormDate':
            aValue = new Date(a.stormDate).getTime();
            bValue = new Date(b.stormDate).getTime();
            break;
          case 'stormType':
            aValue = a.stormType;
            bValue = b.stormType;
            break;
          case 'severity':
            const severityOrder = { 'extreme': 4, 'severe': 3, 'moderate': 2, 'mild': 1 };
            aValue = severityOrder[a.severity] || 0;
            bValue = severityOrder[b.severity] || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return homes;
  });

  // Get unique storm types for filter
  stormTypes = computed(() => {
    const types = new Set(this.affectedHomes().map(h => h.stormType));
    return Array.from(types).sort();
  });

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      // Toggle direction
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  onHomeClick(home: AffectedHome) {
    this.homeSelected.emit(home);
  }

  onViewOnMap(home: AffectedHome, event: Event) {
    event.stopPropagation();
    this.viewOnMap.emit(home);
  }

  getSeverityColor(severity: AffectedHome['severity']): string {
    const colors: Record<AffectedHome['severity'], string> = {
      'mild': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'moderate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'severe': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'extreme': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[severity] || colors.mild;
  }

  getTypeIcon(type: AffectedHome['stormType']): string {
    const icons: Record<AffectedHome['stormType'], string> = {
      'hail': '❄️',
      'storm': '⛈️',
      'wind': '💨',
      'rain': '🌧️',
      'snow': '❄️',
      'other': '🌪️',
    };
    return icons[type] || icons.other;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}

