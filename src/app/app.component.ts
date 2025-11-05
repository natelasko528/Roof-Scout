import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GenerateContentResponse } from '@google/genai';
import { firstValueFrom } from 'rxjs';

import { DataService } from './core/services/data.service';
import { GeminiService } from './core/services/gemini.service';
import { WeatherService, WeatherEvent } from './core/services/weather.service';
import { ThemeService } from './core/services/theme.service';
import { ViewActionService } from './core/services/view-action.service';
import { ReportService } from './core/services/report.service';
import { Lead, LEAD_STATUSES, PRIORITIES } from './shared/models/lead.model';
import { SecurityUtil } from './core/utils/security.util';

import { MapViewComponent } from './features/map/components/map-view/map-view.component';
import { LeadListComponent } from './features/leads/components/lead-list/lead-list.component';
import { SessionsViewComponent } from './features/sessions/components/sessions-view/sessions-view.component';
import { ChatbotComponent } from './features/chatbot/components/chatbot/chatbot.component';

type View = 'map' | 'list' | 'sessions';
type ModalType = 'lead-detail' | 'ai-result' | null;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MapViewComponent,
    LeadListComponent,
    SessionsViewComponent,
    ChatbotComponent,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  // Track active timeouts for cleanup
  private activeTimeouts = new Set<NodeJS.Timeout>();
  // Fix: Explicitly type `fb` as FormBuilder to resolve potential type inference issues.
  private fb: FormBuilder = inject(FormBuilder);
  private dataService = inject(DataService);
  private geminiService = inject(GeminiService);
  private weatherService = inject(WeatherService);
  private http = inject(HttpClient);
  private viewActionService = inject(ViewActionService);
  private reportService = inject(ReportService);
  themeService = inject(ThemeService); // Initialize the theme service

  currentView = signal<View>('map');
  modalType = signal<ModalType>(null);
  selectedLead = signal<Lead | null>(null);
  isChatbotOpen = signal(false);

  isNewLead = signal<boolean>(false);
  leadForm!: FormGroup;

  aiIsLoading = signal<boolean>(false);
  aiResult = signal<{ title: string; content: string; sources?: any[] } | null>(null);

  isRecalculatingScore = signal(false);
  userImageUrls = signal<string[]>([]);

  // Loading states for better UX
  isGeocoding = signal<boolean>(false);
  isUploadingImages = signal<boolean>(false);

  // Storm history for selected lead
  leadStormEvents = signal<WeatherEvent[]>([]);
  isLoadingStormHistory = signal<boolean>(false);

  // PWA Installation
  private deferredPrompt: any = null;
  showInstallBanner = signal(false);
  canInstall = signal(false);

  statuses = LEAD_STATUSES;
  priorities = PRIORITIES;

  constructor() {
    effect(() => {
      const view = this.viewActionService.switchView();
      if (view) {
        this.setView(view);
        this.viewActionService.switchView.set(null); // Reset after handling
      }
    });
  }

  ngOnInit() {
    this.leadForm = this.fb.group({
      address: ['', Validators.required],
      homeownerName: [''],
      phone: [''],
      email: ['', Validators.email],
      roofAge: [null],
      roofMaterial: [''],
      visibleDamage: [false],
      notes: [''],
      priority: ['Medium', Validators.required],
      status: ['Not Visited', Validators.required],
    });

    // PWA Installation Event Listeners
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      this.showInstallBanner.set(true);
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.showInstallBanner.set(false);
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.canInstall.set(false);
    }
  }

  ngOnDestroy() {
    // Clean up all timeouts to prevent memory leaks
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();
  }

  // Helper method to track timeouts for cleanup
  protected createTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      this.activeTimeouts.delete(timeout);
      callback();
    }, delay);
    this.activeTimeouts.add(timeout);
    return timeout;
  }

  setView(view: View) {
    this.currentView.set(view);
  }

  // PWA Installation Methods
  installPWA() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallBanner.set(false);
    });
  }

  dismissInstallBanner() {
    this.showInstallBanner.set(false);
    // Store in localStorage to remember dismissal
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  }
  
  openNewLeadForm() {
    this.isNewLead.set(true);
    this.selectedLead.set(null);
    this.userImageUrls.set([]);
    this.leadForm.reset({
      visibleDamage: false,
      priority: 'Medium',
      status: 'Not Visited',
    });
    this.modalType.set('lead-detail');
  }

  openNewLeadFromMap(address: string) {
    this.isNewLead.set(true);
    this.selectedLead.set(null);
    this.userImageUrls.set([]);
    this.leadForm.reset({
      address: address,
      visibleDamage: false,
      priority: 'Medium',
      status: 'Not Visited',
    });
    this.modalType.set('lead-detail');
  }

  async openLeadDetails(lead: Lead) {
    this.isNewLead.set(false);
    this.selectedLead.set(lead);
    this.userImageUrls.set(lead.userImageUrls || []);
    this.leadForm.patchValue(lead);
    this.modalType.set('lead-detail');
    // Load storm history for this lead
    await this.loadStormHistoryForLead(lead);
  }

  closeModal() {
    this.modalType.set(null);
    this.selectedLead.set(null);
    this.aiResult.set(null);
  }
  
  toggleChatbot() {
    this.isChatbotOpen.update(open => !open);
  }

  async saveLead() {
    if (this.leadForm.invalid) {
      return;
    }

    const leadData = this.leadForm.value;
    const leadPayload = { ...leadData, userImageUrls: this.userImageUrls() };

    if (this.isNewLead()) {
        try {
            const imageUrl = await this.getSatelliteImageForAddress(leadPayload.address);
            // Fetch weather data for the new lead
            const weatherData = await this.getWeatherDataForAddress(leadPayload.address);
            const newLead = this.dataService.addLead({ ...leadPayload, imageUrl, roofScore: null, weatherData });
            this.recalculateScore(newLead); // Trigger initial score calculation
        } catch (error) {
            console.error("Could not fetch satellite image, saving lead without it.", error);
            const newLead = this.dataService.addLead({ ...leadPayload, roofScore: null }); // Save lead even if image fails
            this.recalculateScore(newLead);
        }
    } else {
      const updatedLead = { ...this.selectedLead()!, ...leadPayload };
      this.dataService.updateLead(updatedLead);
    }
    this.closeModal();
  }

  private async getSatelliteImageForAddress(address: string): Promise<string | undefined> {
    // 1. Geocode address to get lat/lng
    this.isGeocoding.set(true);
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const geocodeResults = await firstValueFrom(this.http.get<any[]>(geocodeUrl));

      if (!geocodeResults || geocodeResults.length === 0) {
        throw new Error("Geocoding failed, no results found.");
      }
      const { lat, lon } = geocodeResults[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // 2. Construct Esri static image URL
      const size = "400,300"; // width,height
      const zoomLevel = 19; // A close-up zoom level
      const mapScale = 564; // Corresponds roughly to zoom level 19

      const imageUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${longitude},${latitude},${longitude},${latitude}&bboxSR=4326&size=${size}&imageSR=4326&format=jpg&transparent=false&dpi=96&mapScale=${mapScale}&f=image`;

      return imageUrl;
    } finally {
      this.isGeocoding.set(false);
    }
  }

  private async getWeatherDataForAddress(address: string) {
    try {
      const severeWeather = await this.weatherService.hasRecentSevereWeather(address);
      if (severeWeather.hasSevereWeather) {
        return {
          hasRecentSevereWeather: true,
          severeWeatherCount: 1,
          lastHailDate: severeWeather.lastEvent?.type === 'hail' ? severeWeather.lastEvent?.date : undefined,
          lastSevereStormDate: severeWeather.lastEvent?.date,
        };
      }
      return {
        hasRecentSevereWeather: false,
        severeWeatherCount: 0
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return {
        hasRecentSevereWeather: false,
        severeWeatherCount: 0
      };
    }
  }

  async loadStormHistoryForLead(lead: Lead) {
    this.isLoadingStormHistory.set(true);
    try {
      const events = await this.weatherService.getStormEvents(lead.address, lead.lat, lead.lng);
      // Sort by date descending (most recent first)
      const sortedEvents = events.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.leadStormEvents.set(sortedEvents);
    } catch (error) {
      console.error('Failed to load storm history:', error);
      this.leadStormEvents.set([]);
    } finally {
      this.isLoadingStormHistory.set(false);
    }
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

  deleteLead() {
    const lead = this.selectedLead();
    if (lead && confirm(`Are you sure you want to delete the lead at ${lead.address}?`)) {
      this.dataService.deleteLead(lead.id);
      this.closeModal();
    }
  }

  private async runAiAction(title: string, action: Promise<GenerateContentResponse>) {
    this.aiIsLoading.set(true);
    this.modalType.set('ai-result');
    try {
      const response = await action;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      // Sanitize AI-generated HTML content to prevent XSS attacks
      const sanitizedContent = SecurityUtil.sanitizeHtml(response.text);
      this.aiResult.set({ title, content: sanitizedContent, sources });
    } catch (error) {
      console.error('AI Action Failed:', error);
      this.aiResult.set({ title, content: '<p>An error occurred while processing your request.</p>' });
    } finally {
      this.aiIsLoading.set(false);
    }
  }

  researchProperty() {
    const lead = this.selectedLead();
    if (!lead) return;
    this.runAiAction(
      `Property Report: ${lead.address}`,
      this.geminiService.researchAddress(lead.address)
    );
  }

  generatePitch() {
    const lead = this.selectedLead();
    if (!lead) return;
    this.runAiAction('Generated Sales Pitch', this.geminiService.generatePitch(lead));
  }

  summarizeNotes() {
    const lead = this.selectedLead();
    if (!lead || !lead.notes) return;
    this.runAiAction('Notes Summary', this.geminiService.summarizeNotes(lead.notes));
  }

  async recalculateScore(leadToScore: Lead | null) {
    if (!leadToScore) return;
    this.isRecalculatingScore.set(true);
    try {
      // Create a temporary lead object with the latest form data for analysis
      const currentData = { ...leadToScore, ...this.leadForm.value, userImageUrls: this.userImageUrls() };
      const result = await this.geminiService.calculateRoofScore(currentData);
      if (result) {
        const updatedLead = { ...currentData, roofScore: result.score, roofScoreReasoning: result.reasoning };
        this.dataService.updateLead(updatedLead);
        this.selectedLead.set(updatedLead);
        this.leadForm.patchValue(updatedLead); // Ensure form reflects the new score info
      }
    } catch (error) {
      console.error("Failed to recalculate score:", error);
      // Optionally show an error to the user
    } finally {
      this.isRecalculatingScore.set(false);
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.isUploadingImages.set(true);

    try {
      const resizedImagePromises = files.map(file => this.resizeImage(file));
      const base64Images = await Promise.all(resizedImagePromises);
      this.userImageUrls.update(current => [...current, ...base64Images]);
    } catch (error) {
      console.error("Error resizing images:", error);
      alert('Failed to process images. Please try smaller files or fewer images.');
    } finally {
      this.isUploadingImages.set(false);
      // Clear the input value so the same file can be selected again
      input.value = '';
    }
  }

  removeUserImage(indexToRemove: number) {
    this.userImageUrls.update(current => current.filter((_, index) => index !== indexToRemove));
  }

  // PDF Report Generation Methods

  async generateLeadPDF(lead: Lead) {
    try {
      await this.reportService.generateLeadReport(lead, {
        includeImages: true,
        includeWeather: false,
        includeMap: true,
      });
    } catch (error) {
      console.error('Failed to generate lead PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  async generateSessionPDF(session: any) {
    try {
      await this.reportService.generateSessionReport(session, {
        includeLeads: true,
        includeStatistics: true,
        includeTerritory: false,
      });
    } catch (error) {
      console.error('Failed to generate session PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  async generateTerritoryPDF() {
    try {
      const leads = this.dataService.leads();
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

  async generatePerformancePDF() {
    try {
      const sessions = this.dataService.allSessions();
      if (sessions.length === 0) {
        alert('No sessions available to generate a performance report.');
        return;
      }
      await this.reportService.generatePerformanceReport(sessions, {
        includeTrends: true,
        includeCharts: false,
      });
    } catch (error) {
      console.error('Failed to generate performance PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  private async resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 800; // Reduced from 1024 to save space
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round(height * (MAX_DIMENSION / width));
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round(width * (MAX_DIMENSION / height));
              height = MAX_DIMENSION;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Could not get canvas context');

          // Use faster drawing options for better performance
          ctx.drawImage(img, 0, 0, width, height);

          // Reduce quality to 0.7 for smaller file size (was 0.85)
          // This saves ~30% space on images
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          // Clean up image data to free memory
          img.src = '';
          canvas.width = 0;
          canvas.height = 0;

          resolve(dataUrl);
        };
        img.onerror = reject;
        if (e.target?.result && typeof e.target.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Invalid image data'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}