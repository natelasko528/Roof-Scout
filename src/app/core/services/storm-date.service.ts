import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { WeatherService } from './weather.service';
import { AffectedHome, MapBounds } from '../../shared/models/storm.model';
import { Lead } from '../../shared/models/lead.model';
import { WeatherEvent } from './weather.service';

@Injectable({
  providedIn: 'root',
})
export class StormDateService {
  private dataService = inject(DataService);
  private weatherService = inject(WeatherService);

  /**
   * Find all homes affected by a specific storm date
   * @param stormDate - Date string in YYYY-MM-DD format
   * @param mapBounds - Optional map bounds to limit search area
   * @returns Array of affected homes
   */
  async findHomesAffectedByDate(
    stormDate: string,
    mapBounds?: MapBounds
  ): Promise<AffectedHome[]> {
    const affectedHomes: AffectedHome[] = [];
    const leads = this.dataService.leads();

    // Check each lead in the current session
    for (const lead of leads) {
      // If map bounds provided, filter by location
      if (mapBounds) {
        if (
          !lead.lat ||
          !lead.lng ||
          lead.lat < mapBounds.south ||
          lead.lat > mapBounds.north ||
          lead.lng < mapBounds.west ||
          lead.lng > mapBounds.east
        ) {
          continue; // Skip leads outside map bounds
        }
      }

      // Check if this lead was affected on the storm date
      const wasAffected = await this.wasAffectedOnDate(
        lead.address,
        stormDate,
        lead.lat,
        lead.lng
      );

      if (wasAffected) {
        // Get the specific weather event for this date
        const events = await this.weatherService.getStormEvents(
          lead.address,
          lead.lat,
          lead.lng
        );
        const eventOnDate = events.find(
          (e) => e.date === stormDate || this.isDateMatch(e.date, stormDate)
        );

        if (eventOnDate) {
          affectedHomes.push({
            address: lead.address,
            lat: lead.lat || 0,
            lng: lead.lng || 0,
            stormDate: eventOnDate.date,
            stormType: eventOnDate.type,
            severity: eventOnDate.severity,
            details: eventOnDate.description,
            hailSize: eventOnDate.hailSize,
            windSpeed: eventOnDate.windSpeed,
            precipitation: eventOnDate.precipitation,
            leadId: lead.id,
            weatherEvent: eventOnDate,
          });
        }
      }
    }

    return affectedHomes;
  }

  /**
   * Get all storm dates for an address
   * @param address - Address to check
   * @param lat - Optional latitude
   * @param lng - Optional longitude
   * @returns Array of weather events
   */
  async getStormDatesForAddress(
    address: string,
    lat?: number,
    lng?: number
  ): Promise<WeatherEvent[]> {
    return await this.weatherService.getStormEvents(address, lat, lng);
  }

  /**
   * Check if an address was affected by a storm on a specific date
   * @param address - Address to check
   * @param date - Date string in YYYY-MM-DD format
   * @param lat - Optional latitude
   * @param lng - Optional longitude
   * @returns True if address was affected on this date
   */
  async wasAffectedOnDate(
    address: string,
    date: string,
    lat?: number,
    lng?: number
  ): Promise<boolean> {
    const events = await this.weatherService.getStormEvents(address, lat, lng);
    return events.some(
      (e) => e.date === date || this.isDateMatch(e.date, date)
    );
  }

  /**
   * Find all unique storm dates across all leads in the session
   * @returns Array of unique storm dates (YYYY-MM-DD format)
   */
  async getAllStormDatesInSession(): Promise<string[]> {
    const leads = this.dataService.leads();
    const allDates = new Set<string>();

    for (const lead of leads) {
      const events = await this.weatherService.getStormEvents(
        lead.address,
        lead.lat,
        lead.lng
      );
      events.forEach((event) => allDates.add(event.date));
    }

    return Array.from(allDates).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  /**
   * Check if two dates match (handles date-only comparison)
   * @param date1 - First date string
   * @param date2 - Second date string
   * @returns True if dates match
   */
  private isDateMatch(date1: string, date2: string): boolean {
    // Extract date part (YYYY-MM-DD) from both dates
    const d1 = date1.split('T')[0];
    const d2 = date2.split('T')[0];
    return d1 === d2;
  }
}

