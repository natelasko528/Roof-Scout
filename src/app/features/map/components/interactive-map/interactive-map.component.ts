import { Component, ChangeDetectionStrategy, ElementRef, viewChild, effect, inject, input, output, untracked, signal, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from '@core/services/data.service';
import { MapActionService } from '@core/services/map-action.service';
import { Lead, LeadStatus } from '@shared/models/lead.model';
import { firstValueFrom } from 'rxjs';

// Leaflet types
declare const L: any;

// Import Leaflet plugins
import 'leaflet-draw';
import 'leaflet.heat';

// Search result type
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

// Leaflet event types
interface LeafletMouseEvent {
  latlng: any;
  layerPoint: any;
  containerPoint: any;
  originalEvent: MouseEvent;
}

interface LeafletLayerEvent {
  layer: any;
  name: string;
}

// Geocoding cache entry
interface GeocodingCacheEntry {
  lat: number;
  lng: number;
  timestamp: number;
  display_name: string;
}

// Rate limiter for geocoding requests
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 1100; // 1.1 seconds to be safe (1 req/sec)

  async process<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minInterval) {
        // Wait for the required interval
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }

    this.isProcessing = false;
  }
}

@Component({
  selector: 'app-interactive-map',
  templateUrl: './interactive-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class InteractiveMapComponent implements OnDestroy {
  // Track active timeouts for cleanup
  private timeouts = new Set<NodeJS.Timeout>();
  private readonly CACHE_KEY = 'geocoding_cache_v1';
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second

  private geocodingQueue = new RateLimiter();
  private geocodingCache = new Map<string, GeocodingCacheEntry>();

  mapContainer = viewChild.required<ElementRef>('mapContainer');
  leads = input.required<Lead[]>();
  markerClick = output<Lead>();
  newLeadAtAddress = output<string>();

  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private mapActionService = inject(MapActionService);

  private map: any | null = null;
  private markers: any[] = [];
  private currentUserMarker: any | null = null;
  private isMapInitialized = false;
  private searchDebounceTimer: NodeJS.Timeout | null = null;
  private baseLayers: Record<string, any> = {};
  private layerControl: any | null = null;

  // GIS Enhancement layers and features
  private heatmapLayer: any | null = null;
  private weatherLayer: any | null = null;
  private territoryLayer: any | null = null;
  private territories: Array<{ id: string; name: string; coordinates: number[][] }> = [];
  private drawnItems: any = null;

  searchResults = signal<SearchResult[]>([]);
  isSearching = signal(false);
  isSearchFocused = signal(false);

  // GIS Enhancement states
  showHeatmap = signal(false);
  showWeatherOverlay = signal(false);
  isDrawingMode = signal(false);

  constructor() {
    this.loadCache();
    
    // Initialize map after view renders
    afterNextRender(() => {
      this.initMap();
    });

    effect(() => {
      const leads = this.leads();
      if (this.isMapInitialized) {
        untracked(() => this.updateMarkers(leads));
      }
    });

    // Effect to handle external map actions, e.g., from the chatbot
    effect(() => {
      const address = this.mapActionService.flyToAddress();
      if (address) {
        untracked(async () => {
          const results = await this.performSearch(address);
          if (results && results.length > 0) {
            this.selectSearchResult(results[0]);
            this.mapActionService.flyToAddress.set(null); // Reset after action
          }
        });
      }
    });

    // Effect to handle heatmap toggle
    effect(() => {
      const showHeat = this.showHeatmap();
      if (this.isMapInitialized) {
        untracked(() => this.toggleHeatmap());
      }
    });

    // Effect to handle weather overlay toggle
    effect(() => {
      const showWeather = this.showWeatherOverlay();
      if (this.isMapInitialized) {
        untracked(() => this.toggleWeatherOverlay());
      }
    });
  }

  // Load cache from localStorage
  private loadCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const entries: GeocodingCacheEntry[] = JSON.parse(cached);
        const now = Date.now();
        entries.forEach(entry => {
          if (now - entry.timestamp < this.CACHE_EXPIRY) {
            const key = entry.display_name.toLowerCase();
            this.geocodingCache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error);
    }
  }

  // Save cache to localStorage
  private saveCache() {
    try {
      const entries = Array.from(this.geocodingCache.values());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error);
    }
  }

  // Get cached result
  private getFromCache(address: string): GeocodingCacheEntry | null {
    const key = address.toLowerCase();
    const cached = this.geocodingCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached;
    }
    return null;
  }

  // Add to cache
  private addToCache(address: string, lat: number, lng: number) {
    const entry: GeocodingCacheEntry = {
      lat,
      lng,
      timestamp: Date.now(),
      display_name: address
    };
    this.geocodingCache.set(address.toLowerCase(), entry);
    // Save periodically (could be optimized)
    if (this.geocodingCache.size % 5 === 0) {
      this.saveCache();
    }
  }

  // Retry wrapper with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES,
    baseDelay: number = this.BASE_DELAY
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries) {
          const delay = baseDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Get HTTP headers for Nominatim API
  // Note: User-Agent header cannot be set from browser JavaScript for security reasons
  // Browsers automatically include their own User-Agent
  private getNominatimHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  ngOnDestroy() {
    // Clean up all timeouts to prevent memory leaks
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();

    // Clear search debounce timer
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    // Clean up map if initialized
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Helper method to track timeouts for cleanup
  private createTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      this.timeouts.delete(timeout);
      callback();
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  private initMap() {
    if (!this.mapContainer() || this.map) return;
    if (typeof L === 'undefined') {
        console.error('Leaflet is not loaded.');
        return;
    }

    this.map = L.map(this.mapContainer().nativeElement, { zoomControl: false, maxZoom: 22 });
    L.control.zoom({ position: 'topleft' }).addTo(this.map);

    this.map.createPane('labels');
    this.map.getPane('labels').style.zIndex = 650;
    this.map.getPane('labels').style.pointerEvents = 'none';

    this.setupBaseLayers();
    this.baseLayers['Street'].addTo(this.map);
    this.layerControl = L.control.layers(this.baseLayers, {}, { position: 'topright' }).addTo(this.map);
    this.setupGISFeatures();
    this.addCustomControls();

    const defaultView = () => this.map.setView([39.8283, -98.5795], 5);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.map.setView([latitude, longitude], 17);
                this.updateCurrentUserPosition(position.coords);
            },
            defaultView,
            { enableHighAccuracy: true }
        );
    } else {
        defaultView();
    }
    
    this.map.on('click', (e: LeafletMouseEvent) => this.onMapClick(e));
    this.isMapInitialized = true;
    this.updateMarkers(this.leads());
  }
  
  private setupBaseLayers() {
    // Street Layer - Best for details like building numbers.
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22,
        maxNativeZoom: 19
    });

    // Satellite Layer - High-quality imagery.
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 22,
        maxNativeZoom: 19
    });
    
    // Label Overlay for Hybrid View - Using CartoDB's labels-only layer. This is a reliable provider.
    const labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        pane: 'labels', // Ensures this is drawn on top of other tile layers.
        maxZoom: 22,
        maxNativeZoom: 20
    });

    // The Hybrid view is a group of the satellite imagery and the labels on top.
    const hybrid = L.layerGroup([satellite, labels]);

    this.baseLayers = {
        'Street': street,
        'Satellite': satellite,
        'Hybrid': hybrid
    };
  }

  private addCustomControls() {
    const MyLocationControl = L.Control.extend({
        onAdd: (map: any) => {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom bg-white dark:bg-slate-800');
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-700 dark:text-slate-200" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>`;
            btn.title = "My Location";
            L.DomEvent.on(btn, 'click', (e: Event) => {
                L.DomEvent.stop(e);
                this.flyToCurrentUserLocation();
            });
            return btn;
        },
        onRemove: (map: any) => {}
    });
    new MyLocationControl({ position: 'topleft' }).addTo(this.map);
  }

  private setupGISFeatures() {
    // Setup drawn items layer for territories
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Add draw control for territory creation
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems,
        edit: true,
        remove: true
      },
      draw: {
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false,
        polygon: true
      }
    });
    this.map.addControl(drawControl);

    // Handle territory creation
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      this.drawnItems.addLayer(layer);
      this.saveTerritories();
    });

    // Load saved territories
    this.loadTerritories();
  }

  private saveTerritories() {
    const territories: Array<{ id: string; name: string; coordinates: number[][] }> = [];
    this.drawnItems.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        const latlngs = layer.getLatLngs()[0];
        const coordinates = latlngs.map((latlng: any) => [latlng.lat, latlng.lng]);
        territories.push({
          id: crypto.randomUUID(),
          name: `Territory ${territories.length + 1}`,
          coordinates
        });
      }
    });
    this.territories = territories;
    localStorage.setItem('roof_scout_territories', JSON.stringify(territories));
  }

  private loadTerritories() {
    try {
      const saved = localStorage.getItem('roof_scout_territories');
      if (saved) {
        this.territories = JSON.parse(saved);
        this.territories.forEach(territory => {
          const polygon = L.polygon(territory.coordinates, {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
          }).addTo(this.drawnItems);
        });
      }
    } catch (error) {
      console.error('Failed to load territories:', error);
    }
  }

  private createHeatmap() {
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }

    // Prepare heatmap data from leads
    const heatmapData = this.leads()
      .filter(lead => lead.lat && lead.lng)
      .map(lead => [lead.lat!, lead.lng!, lead.roofScore ? lead.roofScore / 100 : 0.5]);

    if (heatmapData.length === 0) {
      alert('No leads with coordinates available for heatmap');
      return;
    }

    this.heatmapLayer = (L as any).heatLayer(heatmapData, {
      radius: 30,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.5: 'cyan',
        0.7: 'lime',
        0.9: 'yellow',
        1.0: 'red'
      }
    }).addTo(this.map);
  }

  private toggleHeatmap() {
    if (this.showHeatmap()) {
      this.createHeatmap();
    } else if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
      this.heatmapLayer = null;
    }
  }

  private async toggleWeatherOverlay() {
    if (this.showWeatherOverlay()) {
      // Add weather overlay layer
      if (typeof (L as any).tileLayer.weather === 'undefined') {
        console.warn('Weather overlay requires leaflet.openweathermap plugin');
        alert('Weather overlay feature requires additional plugin. Using demo weather data instead.');

        // Demo weather overlay - show weather info for current leads
        this.showWeatherDemoOverlay();
      } else {
        this.weatherLayer = (L as any).tileLayer.weather({
          apikey: 'demo',
          layer: 'clouds_new'
        }).addTo(this.map);
      }
    } else if (this.weatherLayer) {
      this.map.removeLayer(this.weatherLayer);
      this.weatherLayer = null;
    }
  }

  private showWeatherDemoOverlay() {
    if (this.weatherLayer) {
      this.map.removeLayer(this.weatherLayer);
    }

    const weatherData = [
      { lat: 39.8283, lng: -98.5795, temp: 65, condition: 'Partly Cloudy' },
    ];

    weatherData.forEach(data => {
      const icon = L.divIcon({
        html: `<div style="background: rgba(59, 130, 246, 0.8); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold;">${data.temp}°F<br>${data.condition}</div>`,
        className: 'weather-marker',
        iconSize: [60, 40],
        iconAnchor: [30, 20]
      });

      const marker = L.marker([data.lat, data.lng], { icon });
      this.weatherLayer = marker;
      marker.addTo(this.map);
    });
  }

  // Public methods for GIS controls
  toggleHeatmapView() {
    this.showHeatmap.set(!this.showHeatmap());
    if (this.isMapInitialized) {
      this.toggleHeatmap();
    }
  }

  toggleWeatherOverlayView() {
    this.showWeatherOverlay.set(!this.showWeatherOverlay());
    if (this.isMapInitialized) {
      this.toggleWeatherOverlay();
    }
  }

  toggleDrawingMode() {
    this.isDrawingMode.set(!this.isDrawingMode());
  }

  flyToCurrentUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.map.flyTo([latitude, longitude], 18);
                this.updateCurrentUserPosition(position.coords);
            },
            () => alert('Could not get your location.'),
            { enableHighAccuracy: true }
        );
    }
  }

  private updateCurrentUserPosition(coords: GeolocationCoordinates) {
    const { latitude, longitude } = coords;
    const icon = L.divIcon({
        html: this.getCurrentUserMarkerSVG(),
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

    if (this.currentUserMarker) {
        this.currentUserMarker.setLatLng([latitude, longitude]);
    } else {
        this.currentUserMarker = L.marker([latitude, longitude], { icon: icon, zIndexOffset: 1000 }).addTo(this.map);
    }
  }

  private async onMapClick(e: LeafletMouseEvent) {
    const isNearMarker = this.markers.some(marker => e.latlng.distanceTo(marker.getLatLng()) < 25);
    if (isNearMarker) return;

    const { lat, lng } = e.latlng;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    try {
      const result = await this.geocodingQueue.process(() =>
        this.retryWithBackoff(() =>
          firstValueFrom(this.http.get<SearchResult>(url, { headers: this.getNominatimHeaders() }))
        )
      );

      if (result && result.display_name) {
        this.newLeadAtAddress.emit(result.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  }

  private updateMarkers(leads: Lead[]) {
    if (!this.map) return;
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Process leads with existing coordinates first
    leads.filter(lead => lead.lat && lead.lng).forEach(lead => this.createMarker(lead));

    // Geocode leads without coordinates using rate-limited queue
    leads.filter(lead => !lead.lat || !lead.lng).forEach((lead) => {
      this.geocodeAndPlaceMarker(lead);
    });
  }

  private async geocodeAndPlaceMarker(lead: Lead) {
    // Check cache first
    const cached = this.getFromCache(lead.address);
    if (cached) {
      const updatedLead = { ...lead, lat: cached.lat, lng: cached.lng };
      this.dataService.updateLead(updatedLead);
      // Immediately create marker for cached result
      this.createMarker(updatedLead);
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lead.address)}`;

    try {
      const results = await this.geocodingQueue.process(() =>
        this.retryWithBackoff(() =>
          firstValueFrom(this.http.get<any[]>(url, { headers: this.getNominatimHeaders() }))
        )
      );

      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        this.addToCache(lead.address, latitude, longitude);
        const updatedLead = { ...lead, lat: latitude, lng: longitude };
        this.dataService.updateLead(updatedLead);
        // Immediately create marker after geocoding
        this.createMarker(updatedLead);
      }
    } catch (error) {
      console.error(`Geocoding error for address "${lead.address}":`, error);
    }
  }

  private createMarker(lead: Lead) {
    if (!this.map || !lead.lat || !lead.lng) return;
    const icon = L.divIcon({
        html: this.getMarkerSVG(lead.status),
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    const marker = L.marker([lead.lat, lead.lng], { icon: icon }).addTo(this.map);
    marker.on('click', (e: LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      this.markerClick.emit(lead);
    });
    this.markers.push(marker);
  }

  onSearchInput(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    // Clear previous debounce timer
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    if (!term) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }
    this.isSearching.set(true);
    this.searchDebounceTimer = setTimeout(async () => {
      const results = await this.performSearch(term);
      this.searchResults.set(results);
      this.isSearching.set(false);
      this.searchDebounceTimer = null;
    }, 400);
  }

  async performSearch(term: string): Promise<any[]> {
    if (!term) return [];

    // Check cache first for search results
    const cached = this.getFromCache(term);
    if (cached) {
      // Convert cache entry back to search result format
      return [{
        display_name: cached.display_name,
        lat: cached.lat.toString(),
        lon: cached.lng.toString(),
        place_id: 'cached'
      }];
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}`;

    try {
      const results = await this.geocodingQueue.process(() =>
        this.retryWithBackoff(() =>
          firstValueFrom(this.http.get<any[]>(url, { headers: this.getNominatimHeaders() }))
        )
      );

      // Cache the first result if available
      if (results && results.length > 0) {
        this.addToCache(term, parseFloat(results[0].lat), parseFloat(results[0].lon));
      }

      return results;
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }

  selectSearchResult(result: SearchResult) {
    this.map.flyTo([parseFloat(result.lat), parseFloat(result.lon)], 18);
    this.searchResults.set([]);
    this.isSearchFocused.set(false);
  }
  
  hideSearchResultsWithDelay() {
    this.createTimeout(() => this.isSearchFocused.set(false), 200);
  }

  private getMarkerSVG(status: LeadStatus): string {
    const color = this.getStatusHexColor(status);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  }

  private getCurrentUserMarkerSVG(): string {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle class="pulse" cx="50" cy="50" r="45" fill="#38bdf8" fill-opacity="0.3" stroke="#0284c7" stroke-width="3"/><circle cx="50" cy="50" r="25" fill="#0284c7"/><style>@keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 70% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(0.9); opacity: 0; } } .pulse { animation: pulse 2s infinite; transform-origin: center; }</style></svg>`;
  }

  private getStatusHexColor(status: LeadStatus): string {
    const colors: Record<LeadStatus, string> = {
      'Not Visited': '#475569', 'Knocked': '#6B7280', 'Interested': '#16A34A',
      'Not Interested': '#DC2626', 'Not Home': '#F59E0B', 'Appointment': '#0284C7',
      'Callback': '#9333EA', 'Completed': '#059669',
    };
    return colors[status];
  }
}
