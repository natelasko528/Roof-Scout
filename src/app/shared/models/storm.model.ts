import { WeatherEvent } from '../../core/services/weather.service';

/**
 * Represents a home that was affected by a storm on a specific date
 */
export interface AffectedHome {
  address: string;
  lat: number;
  lng: number;
  stormDate: string;
  stormType: 'hail' | 'storm' | 'wind' | 'rain' | 'snow' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  details: string;
  hailSize?: number;
  windSpeed?: number;
  precipitation?: number;
  leadId?: string; // If already a lead in the system
  weatherEvent: WeatherEvent; // Full weather event data
}

/**
 * Map bounds for searching affected homes in a specific area
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Search result for storm date search
 */
export interface StormDateSearchResult {
  searchDate: string;
  affectedHomes: AffectedHome[];
  totalCount: number;
  searchBounds?: MapBounds;
}

