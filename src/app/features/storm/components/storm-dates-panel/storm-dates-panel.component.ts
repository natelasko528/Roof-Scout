import { Component, ChangeDetectionStrategy, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherEvent } from '@core/services/weather.service';

@Component({
  selector: 'app-storm-dates-panel',
  templateUrl: './storm-dates-panel.component.html',
  styleUrls: ['./storm-dates-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class StormDatesPanelComponent {
  // Inputs
  address = input.required<string>();
  lat = input<number | undefined>(undefined);
  lng = input<number | undefined>(undefined);
  visible = input<boolean>(false);

  // Outputs
  close = output<void>();
  createLead = output<{ address: string; lat?: number; lng?: number }>();

  private weatherService = inject(WeatherService);

  // State
  stormEvents = signal<WeatherEvent[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    // When address changes, fetch storm data
    effect(() => {
      const addr = this.address();
      const latitude = this.lat();
      const longitude = this.lng();
      const isVisible = this.visible();

      if (isVisible && addr) {
        this.loadStormData(addr, latitude, longitude);
      }
    });
  }

  async loadStormData(address: string, lat?: number, lng?: number) {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const events = await this.weatherService.getStormEvents(address, lat, lng);
      // Sort by date descending (most recent first)
      const sortedEvents = events.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.stormEvents.set(sortedEvents);
    } catch (err) {
      console.error('Failed to load storm data:', err);
      this.error.set('Failed to load storm history. Please try again.');
      this.stormEvents.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onClose() {
    this.close.emit();
  }

  onCreateLead() {
    this.createLead.emit({
      address: this.address(),
      lat: this.lat(),
      lng: this.lng()
    });
  }

  getSeverityColor(severity: WeatherEvent['severity']): string {
    const colors: Record<WeatherEvent['severity'], string> = {
      'mild': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'moderate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'severe': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'extreme': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[severity] || colors.mild;
  }

  getTypeIcon(type: WeatherEvent['type']): string {
    const icons: Record<WeatherEvent['type'], string> = {
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
      month: 'long',
      day: 'numeric'
    });
  }
}

