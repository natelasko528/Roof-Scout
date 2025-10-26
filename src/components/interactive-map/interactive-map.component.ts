import { Component, ChangeDetectionStrategy, ElementRef, viewChild, effect, inject, input, output, untracked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { MapActionService } from '../../services/map-action.service';
import { Lead, LeadStatus } from '../../models';
import { firstValueFrom } from 'rxjs';

declare const L: any;

@Component({
  selector: 'app-interactive-map',
  templateUrl: './interactive-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class InteractiveMapComponent {
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
  private searchDebounceTimer: any;
  private baseLayers: any = {};
  private layerControl: any = null;

  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  isSearchFocused = signal(false);
  
  constructor() {
    setTimeout(() => this.initMap(), 0);
    
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
    
    this.map.on('click', (e: any) => this.onMapClick(e));
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
            L.DomEvent.on(btn, 'click', (e) => {
                L.DomEvent.stop(e);
                this.flyToCurrentUserLocation();
            });
            return btn;
        },
        onRemove: (map: any) => {}
    });
    new MyLocationControl({ position: 'topleft' }).addTo(this.map);
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

  private async onMapClick(e: any) {
    const isNearMarker = this.markers.some(marker => e.latlng.distanceTo(marker.getLatLng()) < 25);
    if (isNearMarker) return;

    const { lat, lng } = e.latlng;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
        const result = await firstValueFrom(this.http.get<any>(url));
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
    
    leads.filter(lead => lead.lat && lead.lng).forEach(lead => this.createMarker(lead));
    leads.filter(lead => !lead.lat || !lead.lng).forEach((lead, index) => {
        setTimeout(() => this.geocodeAndPlaceMarker(lead), index * 300);
    });
  }
  
  private async geocodeAndPlaceMarker(lead: Lead) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lead.address)}`;
    try {
        const results = await firstValueFrom(this.http.get<any[]>(url));
        if (results && results.length > 0) {
            const { lat, lon } = results[0];
            this.dataService.updateLead({ ...lead, lat: parseFloat(lat), lng: parseFloat(lon) });
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
    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e);
      this.markerClick.emit(lead);
    });
    this.markers.push(marker);
  }

  onSearchInput(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchDebounceTimer);
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
    }, 400);
  }

  async performSearch(term: string): Promise<any[]> {
    if (!term) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}`;
    try {
        const results = await firstValueFrom(this.http.get<any[]>(url));
        return results;
    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
  }

  selectSearchResult(result: any) {
    this.map.flyTo([result.lat, result.lon], 18);
    this.searchResults.set([]);
    this.isSearchFocused.set(false);
  }
  
  hideSearchResultsWithDelay() {
    setTimeout(() => this.isSearchFocused.set(false), 200);
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
