import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-storm-date-search',
  templateUrl: './storm-date-search.component.html',
  styleUrls: ['./storm-date-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class StormDateSearchComponent {
  // Inputs
  placeholder = input<string>('Select storm date');
  disabled = input<boolean>(false);

  // Outputs
  dateSelected = output<string>();
  dateCleared = output<void>();

  // State
  selectedDate = signal<string>('');

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const date = input.value;
    
    if (date) {
      this.selectedDate.set(date);
      this.dateSelected.emit(date);
    } else {
      this.selectedDate.set('');
      this.dateCleared.emit();
    }
  }

  clearDate() {
    this.selectedDate.set('');
    this.dateCleared.emit();
  }

  // Get today's date in YYYY-MM-DD format for max date
  // Allow future dates for testing (up to 1 year in future)
  getTodayDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1); // Allow up to 1 year in future for testing
    const result = date.toISOString().split('T')[0];
    return result || '';
  }

  // Get date 5 years ago for min date (historical data limit)
  getMinDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5);
    const result = date.toISOString().split('T')[0];
    return result || '';
  }
}

