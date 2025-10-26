import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GenerateContentResponse } from '@google/genai';
import { firstValueFrom } from 'rxjs';

import { DataService } from './services/data.service';
import { GeminiService } from './services/gemini.service';
import { ThemeService } from './services/theme.service';
import { ViewActionService } from './services/view-action.service';
import { Lead, LEAD_STATUSES, PRIORITIES } from './models';

import { MapViewComponent } from './components/map-view/map-view.component';
import { LeadListComponent } from './components/lead-list/lead-list.component';
import { SessionsViewComponent } from './components/sessions-view/sessions-view.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

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
export class AppComponent implements OnInit {
  // Fix: Explicitly type `fb` as FormBuilder to resolve potential type inference issues.
  private fb: FormBuilder = inject(FormBuilder);
  private dataService = inject(DataService);
  private geminiService = inject(GeminiService);
  private http = inject(HttpClient);
  private viewActionService = inject(ViewActionService);
  themeService = inject(ThemeService); // Initialize the theme service

  currentView = signal<View>('map');
  modalType = signal<ModalType>(null);
  selectedLead = signal<Lead | null>(null);
  isChatbotOpen = signal(false);

  isNewLead = signal<boolean>(false);
  leadForm!: FormGroup;

  aiIsLoading = signal<boolean>(false);
  aiResult = signal<{ title: string; content: string; sources?: any[] } | null>(null);

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
  }

  setView(view: View) {
    this.currentView.set(view);
  }
  
  openNewLeadForm() {
    this.isNewLead.set(true);
    this.selectedLead.set(null);
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
    this.leadForm.reset({
      address: address,
      visibleDamage: false,
      priority: 'Medium',
      status: 'Not Visited',
    });
    this.modalType.set('lead-detail');
  }

  openLeadDetails(lead: Lead) {
    this.isNewLead.set(false);
    this.selectedLead.set(lead);
    this.leadForm.patchValue(lead);
    this.modalType.set('lead-detail');
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

    if (this.isNewLead()) {
        try {
            const imageUrl = await this.getSatelliteImageForAddress(leadData.address);
            this.dataService.addLead({ ...leadData, imageUrl });
        } catch (error) {
            console.error("Could not fetch satellite image, saving lead without it.", error);
            this.dataService.addLead(leadData); // Save lead even if image fails
        }
    } else {
      const updatedLead = { ...this.selectedLead()!, ...leadData };
      this.dataService.updateLead(updatedLead);
    }
    this.closeModal();
  }

  private async getSatelliteImageForAddress(address: string): Promise<string | undefined> {
    // 1. Geocode address to get lat/lng
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
      this.aiResult.set({ title, content: response.text, sources });
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
}