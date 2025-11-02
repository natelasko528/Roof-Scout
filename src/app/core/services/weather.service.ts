import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../shared/environments/environment';

// Weather data types
export interface WeatherLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  precipitation: number;
  visibility: number;
  uvIndex: number;
  timestamp: number;
}

export interface WeatherEvent {
  date: string;
  description: string;
  type: 'hail' | 'storm' | 'wind' | 'rain' | 'snow' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  precipitation: number;
  windSpeed?: number;
  hailSize?: number;
}

export interface HistoricalWeatherData {
  location: WeatherLocation;
  events: WeatherEvent[];
  summary: {
    totalStorms: number;
    hailEvents: number;
    severeWeatherEvents: number;
    lastHailDate?: string;
    lastSevereStormDate?: string;
  };
}

export interface CachedWeatherData {
  current?: CurrentWeather;
  historical?: HistoricalWeatherData;
  timestamp: number;
  location: string;
}

// Cache expiry time (1 hour for current weather, 24 hours for historical)
const CURRENT_CACHE_TTL = 60 * 60 * 1000;
const HISTORICAL_CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'roof_scout_weather_cache_';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly API_BASE = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

  // Cache for weather data
  private weatherCache = signal<Map<string, CachedWeatherData>>(new Map());

  // Computed statistics
  weatherStats = computed(() => {
    const cache = this.weatherCache();
    return {
      totalCachedLocations: cache.size,
      cachedLocations: Array.from(cache.keys())
    };
  });

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: string, lat?: number, lng?: number): Promise<CurrentWeather | null> {
    try {
      const cacheKey = this.getCacheKey(location, 'current');

      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached?.current && !this.isCacheExpired(cached.timestamp, CURRENT_CACHE_TTL)) {
        console.log(`[Weather] Using cached current weather for ${location}`);
        return cached.current;
      }

      // Fetch from API
      const weatherData = await this.fetchCurrentWeatherFromAPI(location, lat, lng);

      if (weatherData) {
        this.updateCache(cacheKey, { current: weatherData, timestamp: Date.now(), location });
        return weatherData;
      }

      return null;
    } catch (error) {
      console.error(`[Weather] Failed to get current weather for ${location}:`, error);
      return null;
    }
  }

  /**
   * Get historical weather data and storm events for a location
   */
  async getHistoricalWeather(location: string, years: number = 5, lat?: number, lng?: number): Promise<HistoricalWeatherData | null> {
    try {
      const cacheKey = this.getCacheKey(location, 'historical');

      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached?.historical && !this.isCacheExpired(cached.timestamp, HISTORICAL_CACHE_TTL)) {
        console.log(`[Weather] Using cached historical weather for ${location}`);
        return cached.historical;
      }

      // Fetch from API
      const weatherData = await this.fetchHistoricalWeatherFromAPI(location, years, lat, lng);

      if (weatherData) {
        this.updateCache(cacheKey, { historical: weatherData, timestamp: Date.now(), location });
        return weatherData;
      }

      return null;
    } catch (error) {
      console.error(`[Weather] Failed to get historical weather for ${location}:`, error);
      return null;
    }
  }

  /**
   * Get storm events specifically for roof damage assessment
   */
  async getStormEvents(location: string, lat?: number, lng?: number): Promise<WeatherEvent[]> {
    const historical = await this.getHistoricalWeather(location, 5, lat, lng);
    return historical?.events || [];
  }

  /**
   * Check if a location had recent severe weather (last 2 years)
   */
  async hasRecentSevereWeather(location: string, lat?: number, lng?: number): Promise<{ hasSevereWeather: boolean; lastEvent?: WeatherEvent }> {
    const events = await this.getStormEvents(location, lat, lng);
    const severeEvents = events.filter(e => e.severity === 'severe' || e.severity === 'extreme');

    if (severeEvents.length > 0) {
      const sorted = severeEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { hasSevereWeather: true, lastEvent: sorted[0] };
    }

    return { hasSevereWeather: false };
  }

  /**
   * Get weather summary for AI analysis
   */
  async getWeatherSummaryForAI(location: string, lat?: number, lng?: number): Promise<string> {
    try {
      const [current, historical] = await Promise.all([
        this.getCurrentWeather(location, lat, lng),
        this.getHistoricalWeather(location, 5, lat, lng)
      ]);

      if (!current && !historical) {
        return `Weather data could not be retrieved for ${location}.`;
      }

      let summary = `<h3>Weather Summary for ${location}</h3>`;

      if (current) {
        summary += `
          <p><strong>Current Conditions:</strong></p>
          <ul>
            <li>Temperature: ${Math.round(current.temperature)}°F (feels like ${Math.round(current.feelsLike)}°F)</li>
            <li>Conditions: ${current.conditions}</li>
            <li>Humidity: ${current.humidity}%</li>
            <li>Wind: ${Math.round(current.windSpeed)} mph</li>
            <li>Precipitation: ${current.precipitation}"</li>
          </ul>
        `;
      }

      if (historical && historical.summary) {
        summary += `
          <p><strong>Historical Weather Events (Last 5 Years):</strong></p>
          <ul>
            <li>Total Storms: ${historical.summary.totalStorms}</li>
            <li>Hail Events: ${historical.summary.hailEvents}</li>
            <li>Severe Weather Events: ${historical.summary.severeWeatherEvents}</li>
        `;

        if (historical.summary.lastHailDate) {
          summary += `<li>Last Hail Event: ${new Date(historical.summary.lastHailDate).toLocaleDateString()}</li>`;
        }

        if (historical.summary.lastSevereStormDate) {
          summary += `<li>Last Severe Storm: ${new Date(historical.summary.lastSevereStormDate).toLocaleDateString()}</li>`;
        }

        summary += '</ul>';

        // Add recent severe events
        const recentSevereEvents = historical.events
          .filter(e => e.severity === 'severe' || e.severity === 'extreme')
          .slice(0, 3);

        if (recentSevereEvents.length > 0) {
          summary += '<p><strong>Recent Severe Weather:</strong></p><ul>';
          for (const event of recentSevereEvents) {
            summary += `<li>${new Date(event.date).toLocaleDateString()}: ${event.description}`;
            if (event.hailSize) {
              summary += ` (Hail: ${event.hailSize}" diameter)`;
            }
            summary += '</li>';
          }
          summary += '</ul>';
        }
      }

      return summary;
    } catch (error) {
      console.error(`[Weather] Failed to generate weather summary for ${location}:`, error);
      return `Weather data could not be retrieved for ${location}.`;
    }
  }

  /**
   * Clear weather cache for a specific location
   */
  clearCache(location?: string): void {
    if (location) {
      const cache = this.weatherCache();
      const newCache = new Map(cache);
      Array.from(cache.keys())
        .filter(key => key.includes(location))
        .forEach(key => newCache.delete(key));
      this.weatherCache.set(newCache);
      console.log(`[Weather] Cleared cache for location: ${location}`);
    } else {
      this.weatherCache.set(new Map());
      console.log('[Weather] Cleared all weather cache');
    }
    this.saveCacheToStorage();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const cache = this.weatherCache();
    const now = Date.now();
    const newCache = new Map(cache);

    Array.from(cache.entries()).forEach(([key, data]) => {
      const isExpired = this.isCacheExpired(data.timestamp, CURRENT_CACHE_TTL) ||
                       (data.historical && this.isCacheExpired(data.timestamp, HISTORICAL_CACHE_TTL));
      if (isExpired) {
        newCache.delete(key);
      }
    });

    this.weatherCache.set(newCache);
    this.saveCacheToStorage();
    console.log('[Weather] Cleared expired cache entries');
  }

  /**
   * Private method: Fetch current weather from API
   */
  private async fetchCurrentWeatherFromAPI(location: string, lat?: number, lng?: number): Promise<CurrentWeather | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('[Weather] API key not configured. Add WEATHER_API_KEY to your environment.');
      return null;
    }

    try {
      const coords = lat && lng ? `${lat},${lng}` : location;
      const url = `${this.API_BASE}/${encodeURIComponent(coords)}/today?key=${apiKey}&include=current&elements=temp,feelslike,humidity,windspeed,precip,visibility,uvindex,conditions&unitGroup=us&format=json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.current || !data.current.values) {
        throw new Error('Invalid weather data format');
      }

      const current = data.current.values;

      return {
        temperature: current.temp || 0,
        feelsLike: current.feelslike || 0,
        humidity: current.humidity || 0,
        windSpeed: current.windspeed || 0,
        conditions: current.conditions || 'Unknown',
        precipitation: current.precip || 0,
        visibility: current.visibility || 0,
        uvIndex: current.uvindex || 0,
        timestamp: data.current.datetimeEpoch * 1000
      };
    } catch (error) {
      console.error('[Weather] API request failed:', error);
      return null;
    }
  }

  /**
   * Private method: Fetch historical weather from API
   */
  private async fetchHistoricalWeatherFromAPI(location: string, years: number, lat?: number, lng?: number): Promise<HistoricalWeatherData | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('[Weather] API key not configured. Add WEATHER_API_KEY to your environment.');
      return null;
    }

    try {
      const coords = lat && lng ? `${lat},${lng}` : location;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - years);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const url = `${this.API_BASE}/${encodeURIComponent(coords)}/${start}/${end}?key=${apiKey}&include=days&elements=datetime,temp,precip,windspeed,hail,severerisk,conditions,snow,snowdepth&unitGroup=us&format=json&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.days || !Array.isArray(data.days)) {
        throw new Error('Invalid weather data format');
      }

      const events = this.extractWeatherEvents(data.days);

      const summary = {
        totalStorms: events.length,
        hailEvents: events.filter(e => e.type === 'hail').length,
        severeWeatherEvents: events.filter(e => e.severity === 'severe' || e.severity === 'extreme').length,
        lastHailDate: this.getLastEventDate(events, 'hail'),
        lastSevereStormDate: this.getLastEventDate(events, ['storm', 'wind'])
      };

      const locationData: WeatherLocation = {
        lat: lat || data.latitude || 0,
        lng: lng || data.longitude || 0,
        address: location
      };

      return {
        location: locationData,
        events,
        summary
      };
    } catch (error) {
      console.error('[Weather] Historical API request failed:', error);
      return null;
    }
  }

  /**
   * Private method: Extract weather events from daily data
   */
  private extractWeatherEvents(days: any[]): WeatherEvent[] {
    const events: WeatherEvent[] = [];

    for (const day of days) {
      const date = day.datetime;
      const precip = day.precip || 0;
      const hail = day.hail || 0;
      const windSpeed = day.windspeed || 0;
      const snow = day.snow || 0;
      const severeRisk = day.severerisk || 0;
      const conditions = day.conditions || '';

      // Detect hail events
      if (hail > 0 || conditions.toLowerCase().includes('hail')) {
        events.push({
          date,
          description: `Hail event - ${hail > 0 ? `${hail}" diameter` : 'Unknown size'}`,
          type: 'hail',
          severity: this.determineSeverity(hail, severeRisk),
          precipitation: precip,
          windSpeed,
          hailSize: hail > 0 ? hail : undefined
        });
      }

      // Detect severe storms
      if (severeRisk >= 50 || conditions.toLowerCase().includes('thunderstorm')) {
        const isSevere = severeRisk >= 70 || precip >= 2 || windSpeed >= 50;
        events.push({
          date,
          description: `Thunderstorm - ${conditions}`,
          type: 'storm',
          severity: isSevere ? 'severe' : 'moderate',
          precipitation: precip,
          windSpeed
        });
      }

      // Detect high wind events
      if (windSpeed >= 40) {
        events.push({
          date,
          description: `High wind event - ${Math.round(windSpeed)} mph`,
          type: 'wind',
          severity: windSpeed >= 60 ? 'severe' : 'moderate',
          precipitation: precip,
          windSpeed
        });
      }

      // Detect heavy rain events
      if (precip >= 2) {
        events.push({
          date,
          description: `Heavy rain event - ${precip.toFixed(2)}"`,
          type: 'rain',
          severity: precip >= 4 ? 'severe' : precip >= 3 ? 'moderate' : 'mild',
          precipitation: precip
        });
      }

      // Detect snow events
      if (snow > 0 || conditions.toLowerCase().includes('snow')) {
        events.push({
          date,
          description: `Snow event - ${snow.toFixed(1)}"`,
          type: 'snow',
          severity: snow >= 6 ? 'moderate' : 'mild',
          precipitation: precip
        });
      }
    }

    return events;
  }

  /**
   * Private method: Determine event severity
   */
  private determineSeverity(hailSize: number, severeRisk: number): 'mild' | 'moderate' | 'severe' | 'extreme' {
    if (hailSize >= 2 || severeRisk >= 90) return 'extreme';
    if (hailSize >= 1 || severeRisk >= 70) return 'severe';
    if (hailSize >= 0.5 || severeRisk >= 50) return 'moderate';
    return 'mild';
  }

  /**
   * Private method: Get last event date for a specific type
   */
  private getLastEventDate(events: WeatherEvent[], type: string | string[]): string | undefined {
    const types = Array.isArray(type) ? type : [type];
    const filtered = events
      .filter(e => types.includes(e.type))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered.length > 0 && filtered[0] ? filtered[0].date : undefined;
  }

  /**
   * Private method: Get API key
   */
  private getApiKey(): string | undefined {
    // Use environment from environment.ts
    if (environment.weatherApiKey && environment.weatherApiKey !== 'your_weather_api_key_here') {
      return environment.weatherApiKey;
    }

    console.warn('[Weather] WEATHER_API_KEY not found in environment variables');
    console.warn('[Weather] Add VITE_WEATHER_API_KEY to your .env.local file');
    return undefined;
  }

  /**
   * Private method: Generate cache key
   */
  private getCacheKey(location: string, type: 'current' | 'historical'): string {
    return `${CACHE_PREFIX}${location.toLowerCase()}_${type}`;
  }

  /**
   * Private method: Get cached data
   */
  private getCachedData(key: string): CachedWeatherData | undefined {
    return this.weatherCache().get(key);
  }

  /**
   * Private method: Check if cache is expired
   */
  private isCacheExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Private method: Update cache
   */
  private updateCache(key: string, data: Partial<CachedWeatherData> & { timestamp: number; location: string }): void {
    const cache = this.weatherCache();
    const existing = cache.get(key) || { timestamp: 0, location: data.location };
    const updated = { ...existing, ...data };
    cache.set(key, updated);
    this.weatherCache.set(cache);
    this.saveCacheToStorage();
  }

  /**
   * Private method: Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cache = this.weatherCache();
      const cacheObj = Object.fromEntries(cache.entries());
      localStorage.setItem('roof_scout_weather_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('[Weather] Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Private method: Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheJson = localStorage.getItem('roof_scout_weather_cache');
      if (cacheJson) {
        const cacheObj = JSON.parse(cacheJson);
        const entries = Object.entries(cacheObj) as [string, CachedWeatherData][];
        const newCache = new Map(entries);
        this.weatherCache.set(newCache);
        console.log(`[Weather] Loaded ${entries.length} cached locations`);
      }
    } catch (error) {
      console.error('[Weather] Failed to load cache from localStorage:', error);
    }
  }
}
