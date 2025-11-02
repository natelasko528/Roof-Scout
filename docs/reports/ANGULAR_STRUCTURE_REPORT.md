# Angular 20+ Project Structure Best Practices 2025

## Executive Summary

This report analyzes the current Roof Scout Angular 20 project structure and provides a comprehensive migration plan to align with modern Angular architecture patterns for 2025. The project currently uses standalone components and signals but lacks feature-based organization, proper separation of concerns, and scalable architecture patterns.

**Current State**: ✅ Good foundation with Angular 20 standalone components and signals
**Target State**: 🎯 Feature-based modular architecture with enhanced scalability

---

## Current Structure Analysis

### Project Overview
- **Angular Version**: 20.3.0
- **Architecture**: Standalone components with signals
- **State Management**: Angular signals + localStorage
- **Change Detection**: OnPush strategy
- **Build Tool**: Vite

### Current Directory Structure

```
src/
├── app.component.ts
├── app.component.html
├── models.ts
├── components/
│   ├── chatbot/
│   ├── google-map/
│   ├── interactive-map/
│   ├── lead-list/
│   ├── map-view/
│   └── sessions-view/
├── services/
│   ├── data.service.ts
│   ├── gemini.service.ts
│   ├── map-action.service.ts
│   ├── maps-loader.service.ts
│   ├── theme.service.ts
│   └── view-action.service.ts
└── utils/
    └── security.util.ts
```

### Current Strengths ✅

1. **Standalone Components**: Already using Angular 20's standalone component architecture
2. **Signals**: Modern reactive state management with Angular signals
3. **OnPush Change Detection**: Performance-optimized change detection strategy
4. **Dependency Injection**: Proper use of Angular DI with `inject()`
5. **Type Safety**: Good TypeScript usage with interfaces and types
6. **Separation of Concerns**: Components, services, and utils are separated

### Current Issues ❌

1. **Flat Structure**: All components at root level, no feature-based organization
2. **Single Models File**: All types in one `models.ts` file
3. **No Core Module**: No dedicated core module for singleton services
4. **No Shared Module**: No shared components/pipes/directives organization
5. **No Domain Separation**: Business logic and data access mixed
6. **No Interceptors**: Missing HTTP interceptor structure
7. **No Guards**: No route guard structure
8. **No Environment Structure**: Missing environment configuration pattern
9. **No Testing Structure**: No test organization or patterns
10. **Asset Organization**: No structured asset management

---

## Modern Angular 20+ Architecture (2025 Best Practices)

### 1. Standalone Components Evolution

Angular 20+ emphasizes standalone components but with **feature-based architecture**:

#### Key Principles:
- **Feature-based organization**: Group by business domain
- **Standalone components**: No NgModules required
- **Lazy loading**: Route-based code splitting
- **Shared utilities**: Centralized common functionality
- **Core services**: Singleton services in dedicated core layer

### 2. Recommended Architecture Patterns

#### Pattern 1: Feature-Based Organization
```
src/
├── app/
│   ├── core/           # Singleton services, guards, interceptors
│   ├── shared/         # Shared components, pipes, directives, utils
│   ├── features/       # Feature modules (business domains)
│   │   ├── leads/
│   │   ├── sessions/
│   │   ├── maps/
│   │   └── chatbot/
│   └── layouts/        # App layouts and shells
```

#### Pattern 2: Signal-Based State Management
- Use signals for component-level state
- Use computed signals for derived state
- Use signal effects for side effects
- Use stores (feature stores) for complex state

#### Pattern 3: Modern Angular 20+ Features
- ✅ Standalone components
- ✅ Angular signals
- ✅ Control flow syntax (@if, @for, @switch)
- ✅ Deferrable views (@defer)
- ✅ New lifecycle hooks (effect)
- ✅ Input/Output functions (input(), output())

### 3. Core vs Shared vs Feature Modules

#### Core Module
- **Purpose**: Singleton services, app-wide configuration
- **Contents**:
  - Services that should have a single instance
  - Route guards
  - HTTP interceptors
  - App configuration
  - Global error handlers

#### Shared Module
- **Purpose**: Reusable components, pipes, directives
- **Contents**:
  - UI components
  - Presentation components
  - Pipes and directives
  - Utility functions
  - Data models (shared types)

#### Feature Modules
- **Purpose**: Business domain organization
- **Contents**:
  - Feature-specific components
  - Feature-specific services
  - Feature-specific state management
  - Feature-specific routing

---

## Recommended Project Structure

### Ideal Structure for Roof Scout

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── data.service.ts          [moved]
│   │   │   ├── gemini.service.ts        [moved]
│   │   │   ├── theme.service.ts         [moved]
│   │   │   ├── maps-loader.service.ts   [moved]
│   │   │   ├── auth.guard.ts            [new]
│   │   │   └── logging.interceptor.ts   [new]
│   │   ├── guards/                      [new dir]
│   │   └── interceptors/                [new dir]
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                      [new dir]
│   │   │   │   ├── button/
│   │   │   │   ├── modal/
│   │   │   │   └── loader/
│   │   │   ├── lead-card/               [new]
│   │   │   └── map-marker/              [new]
│   │   ├── directives/
│   │   │   ├── autoscroll.directive.ts  [new]
│   │   │   └── click-outside.directive.ts [new]
│   │   ├── pipes/
│   │   │   ├── address-format.pipe.ts   [new]
│   │   │   └── phone-format.pipe.ts     [new]
│   │   ├── utils/
│   │   │   ├── security.util.ts         [moved]
│   │   │   ├── date.util.ts             [new]
│   │   │   ├── validation.util.ts       [new]
│   │   │   └── storage.util.ts          [new]
│   │   └── models/
│   │       ├── lead.model.ts            [split from models.ts]
│   │       ├── session.model.ts         [split from models.ts]
│   │       ├── api.model.ts             [new]
│   │       └── common.model.ts          [new]
│   │
│   ├── features/
│   │   ├── leads/
│   │   │   ├── components/
│   │   │   │   ├── lead-list/
│   │   │   │   │   ├── lead-list.component.ts      [moved]
│   │   │   │   │   ├── lead-list.component.html    [moved]
│   │   │   │   │   └── lead-list.component.scss    [new]
│   │   │   │   ├── lead-form/
│   │   │   │   │   ├── lead-form.component.ts      [new]
│   │   │   │   │   ├── lead-form.component.html    [new]
│   │   │   │   │   └── lead-form.component.scss    [new]
│   │   │   │   ├── lead-detail/
│   │   │   │   │   ├── lead-detail.component.ts    [new]
│   │   │   │   │   ├── lead-detail.component.html  [new]
│   │   │   │   │   └── lead-detail.component.scss  [new]
│   │   │   │   └── lead-card/
│   │   │   │       ├── lead-card.component.ts      [new]
│   │   │   │       ├── lead-card.component.html    [new]
│   │   │   │       └── lead-card.component.scss    [new]
│   │   │   ├── services/
│   │   │   │   ├── lead-state.service.ts    [new]
│   │   │   │   └── lead-api.service.ts      [new]
│   │   │   ├── stores/
│   │   │   │   └── lead.store.ts           [new]
│   │   │   └── leads.routes.ts             [new]
│   │   │
│   │   ├── maps/
│   │   │   ├── components/
│   │   │   │   ├── map-view/
│   │   │   │   │   ├── map-view.component.ts        [moved]
│   │   │   │   │   ├── map-view.component.html      [moved]
│   │   │   │   │   └── map-view.component.scss      [new]
│   │   │   │   ├── interactive-map/
│   │   │   │   │   ├── interactive-map.component.ts [moved]
│   │   │   │   │   ├── interactive-map.component.html [moved]
│   │   │   │   │   └── interactive-map.component.scss [new]
│   │   │   │   ├── google-map/
│   │   │   │   │   ├── google-map.component.ts      [moved]
│   │   │   │   │   ├── google-map.component.html    [moved]
│   │   │   │   │   └── google-map.component.scss    [new]
│   │   │   │   └── map-controls/
│   │   │   │       ├── map-controls.component.ts    [new]
│   │   │   │       └── map-controls.component.html  [new]
│   │   │   ├── services/
│   │   │   │   ├── map-action.service.ts     [moved]
│   │   │   │   ├── map-state.service.ts      [new]
│   │   │   │   └── geocoding.service.ts      [new]
│   │   │   └── maps.routes.ts                [new]
│   │   │
│   │   ├── sessions/
│   │   │   ├── components/
│   │   │   │   ├── sessions-view/
│   │   │   │   │   ├── sessions-view.component.ts   [moved]
│   │   │   │   │   ├── sessions-view.component.html [moved]
│   │   │   │   │   └── sessions-view.component.scss [new]
│   │   │   │   └── session-card/
│   │   │   │       ├── session-card.component.ts    [new]
│   │   │   │       └── session-card.component.html  [new]
│   │   │   ├── services/
│   │   │   │   ├── session-state.service.ts  [new]
│   │   │   │   └── session-api.service.ts    [new]
│   │   │   └── sessions.routes.ts            [new]
│   │   │
│   │   └── chatbot/
│   │       ├── components/
│   │       │   ├── chatbot/
│   │       │   │   ├── chatbot.component.ts         [moved]
│   │       │   │   ├── chatbot.component.html       [moved]
│   │       │   │   └── chatbot.component.scss       [new]
│   │       │   ├── chat-window/
│   │       │   │   ├── chat-window.component.ts     [new]
│   │       │   │   └── chat-window.component.html   [new]
│   │       │   └── voice-controls/
│   │       │       ├── voice-controls.component.ts  [new]
│   │       │       └── voice-controls.component.html [new]
│   │       ├── services/
│   │       │   ├── chat-state.service.ts     [new]
│   │       │   └── audio.service.ts          [new]
│   │       └── chatbot.routes.ts             [new]
│   │
│   ├── layouts/
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts     [new]
│   │   │   ├── main-layout.component.html   [new]
│   │   │   └── main-layout.component.scss   [new]
│   │   └── auth-layout/
│   │       └── auth-layout.component.ts     [new]
│   │
│   ├── app.component.ts           [update imports]
│   ├── app.component.html         [update structure]
│   ├── app.routes.ts              [new - lazy loaded routes]
│   └── app.config.ts              [new - app configuration]
│
├── assets/
│   ├── images/
│   │   ├── logos/                 [new dir]
│   │   ├── icons/                 [new dir]
│   │   └── placeholders/          [new dir]
│   ├── styles/
│   │   ├── _variables.scss        [new]
│   │   ├── _mixins.scss           [new]
│   │   └── main.scss
│   └── fonts/                     [new dir]
│
├── environments/
│   ├── environment.ts             [new]
│   ├── environment.development.ts [new]
│   ├── environment.staging.ts     [new]
│   └── environment.production.ts  [new]
│
└── styles/
    ├── main.scss
    └── _variables.scss            [move from assets]
```

---

## Detailed Migration Plan

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Create Directory Structure
```bash
mkdir -p src/app/{core/{services,guards,interceptors},shared/{components/{ui,lead-card,map-marker},directives,pipes,utils,models},features/{leads/{components/{lead-list,lead-form,lead-detail,lead-card},services,stores},maps/{components/{map-view,interactive-map,google-map,map-controls},services},sessions/{components/{sessions-view,session-card},services},chatbot/{components/{chatbot,chat-window,voice-controls},services}},layouts/{main-layout,auth-layout}}
mkdir -p src/assets/{images/{logos,icons,placeholders},styles,fonts}
mkdir -p src/environments
```

#### Step 1.2: Environment Configuration
Create environment files:

**`src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  geminiApiKey: 'YOUR_API_KEY',
  mapsApiKey: 'YOUR_MAPS_KEY',
  enableDevTools: true,
  logLevel: 'debug'
};
```

**`src/environments/environment.development.ts`**
```typescript
import { environment } from './environment';

export const developmentEnvironment = {
  ...environment,
  production: false,
  enableMockData: true,
  apiUrl: 'http://localhost:3000/api',
};
```

#### Step 1.3: App Configuration
Create **`src/app/app.config.ts`**:
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { errorHandlerInterceptor } from './core/interceptors/error-handler.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,
        errorHandlerInterceptor
      ])
    ),
    provideAnimations(),
  ]
};
```

#### Step 1.4: Routing Configuration
Create **`src/app/app.routes.ts`**:
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'maps',
        pathMatch: 'full'
      },
      {
        path: 'maps',
        loadComponent: () => import('./features/maps/components/map-view/map-view.component')
          .then(m => m.MapViewComponent)
      },
      {
        path: 'leads',
        loadChildren: () => import('./features/leads/leads.routes')
          .then(m => m.LEADS_ROUTES)
      },
      {
        path: 'sessions',
        loadChildren: () => import('./features/sessions/sessions.routes')
          .then(m => m.SESSIONS_ROUTES)
      },
      {
        path: 'chatbot',
        loadComponent: () => import('./features/chatbot/components/chatbot/chatbot.component')
          .then(m => m.ChatbotComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component')
      .then(m => m.AuthLayoutComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

### Phase 2: Model Refactoring (Week 1-2)

#### Step 2.1: Split Models
Create dedicated model files:

**`src/app/shared/models/lead.model.ts`**
```typescript
export type LeadStatus = 'Not Visited' | 'Knocked' | 'Interested' | 'Not Interested' | 'Not Home' | 'Appointment' | 'Callback' | 'Completed';
export type Priority = 'High' | 'Medium' | 'Low';

export const LEAD_STATUSES: LeadStatus[] = [
  'Not Visited', 'Knocked', 'Interested', 'Not Interested',
  'Not Home', 'Appointment', 'Callback', 'Completed'
];

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export interface Lead {
  id: string;
  address: string;
  homeownerName: string;
  phone: string;
  email: string;
  roofAge: number | null;
  roofMaterial: string;
  visibleDamage: boolean;
  notes: string;
  priority: Priority;
  status: LeadStatus;
  createdAt: number;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  userImageUrls?: string[];
  roofScore: number | null;
  roofScoreReasoning?: string;
}

export interface CreateLeadDto extends Omit<Lead, 'id' | 'createdAt'> {}
export interface UpdateLeadDto extends Partial<CreateLeadDto> {}
```

**`src/app/shared/models/session.model.ts`**
```typescript
import { Lead } from './lead.model';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  leads: Lead[];
}

export interface CreateSessionDto {
  name: string;
}
```

**`src/app/shared/models/common.model.ts`**
```typescript
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
```

### Phase 3: Core Services Migration (Week 2)

#### Step 3.1: Move Core Services
Migrate services to `src/app/core/services/`:

**`src/app/core/services/data.service.ts`** (update imports)
```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import { Lead, Session } from '../../shared/models';
import { StorageUtil } from '../../shared/utils/storage.util';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // ... implementation remains the same
}
```

**`src/app/core/services/gemini.service.ts`** (update imports)
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Chat, Tool, Type, Modality } from '@google/genai';
import { Lead, LeadStatus, LEAD_STATUSES } from '../../shared/models';
import { DataService } from './data.service';
import { MapActionService } from './map-action.service';
import { ViewActionService, View } from './view-action.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // ... implementation remains the same
}
```

#### Step 3.2: Create Core Guards
**`src/app/core/guards/auth.guard.ts`**
```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

#### Step 3.3: Create Interceptors
**`src/app/core/interceptors/logging.interceptor.ts`**
```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`HTTP Request: ${req.method} ${req.url}`);

  const startTime = Date.now();
  return next(req).pipe(
    tap({
      next: (response) => {
        const duration = Date.now() - startTime;
        console.log(`HTTP Response: ${response.type} - ${duration}ms`);
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error(`HTTP Error: ${error.status} - ${duration}ms`, error);
      }
    })
  );
};
```

### Phase 4: Shared Module Creation (Week 2-3)

#### Step 4.1: Create UI Components
**`src/app/shared/components/ui/button/button.component.ts`**
```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="classes"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  get classes(): string {
    const base = 'rounded font-medium transition-colors focus:outline-none focus:ring-2';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300'
    };
    const sizes = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }

  onClick(event: Event): void {
    if (!this.disabled) {
      this.onClick.emit(event);
    }
  }
}
```

#### Step 4.2: Create Utility Functions
**`src/app/shared/utils/validation.util.ts`**
```typescript
export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone);
  }

  static isValidAddress(address: string): boolean {
    return address.trim().length > 5;
  }
}
```

### Phase 5: Feature Modules Migration (Week 3-4)

#### Step 5.1: Leads Feature Module
**`src/app/features/leads/lead.routes.ts`**
```typescript
import { Routes } from '@angular/router';

export const LEADS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/lead-list/lead-list.component')
      .then(m => m.LeadListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/lead-form/lead-form.component')
      .then(m => m.LeadFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/lead-detail/lead-detail.component')
      .then(m => m.LeadDetailComponent)
  }
];
```

#### Step 5.2: Create Lead Store
**`src/app/features/leads/stores/lead.store.ts`**
```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import { Lead, LeadStatus } from '../../../shared/models';

interface LeadState {
  leads: Lead[];
  selectedLeadId: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LeadStore {
  private readonly state = signal<LeadState>({
    leads: [],
    selectedLeadId: null,
    loading: false,
    error: null
  });

  // Selectors
  leads = computed(() => this.state().leads);
  selectedLead = computed(() =>
    this.state().leads.find(l => l.id === this.state().selectedLeadId) || null
  );
  selectedLeadId = computed(() => this.state().selectedLeadId);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  // Filtered leads by status
  leadsByStatus = computed(() => {
    const leads = this.leads();
    return leads.reduce((acc, lead) => {
      if (!acc[lead.status]) acc[lead.status] = [];
      acc[lead.status].push(lead);
      return acc;
    }, {} as Record<LeadStatus, Lead[]>);
  });

  // Actions
  setLeads(leads: Lead[]): void {
    this.state.update(s => ({ ...s, leads }));
  }

  addLead(lead: Lead): void {
    this.state.update(s => ({ ...s, leads: [...s.leads, lead] }));
  }

  updateLead(updatedLead: Lead): void {
    this.state.update(s => ({
      ...s,
      leads: s.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
    }));
  }

  deleteLead(leadId: string): void {
    this.state.update(s => ({
      ...s,
      leads: s.leads.filter(l => l.id !== leadId)
    }));
  }

  selectLead(leadId: string | null): void {
    this.state.update(s => ({ ...s, selectedLeadId: leadId }));
  }

  setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }
}
```

### Phase 6: Main App Refactoring (Week 4)

#### Step 6.1: Update App Component
**`src/app/app.component.ts`**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `,
})
export class AppComponent {}
```

#### Step 6.2: Create Main Layout
**`src/app/layouts/main-layout/main-layout.component.ts`**
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold">Roof Scout</h1>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a routerLink="/maps"
                   routerLinkActive="border-blue-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Maps
                </a>
                <a routerLink="/leads"
                   routerLinkActive="border-blue-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Leads
                </a>
                <a routerLink="/sessions"
                   routerLinkActive="border-blue-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Sessions
                </a>
                <a routerLink="/chatbot"
                   routerLinkActive="border-blue-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  AI Assistant
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {}
```

---

## Angular 20+ Specific Features Adoption

### 1. New Control Flow Syntax

Replace `*ngIf`, `*ngFor`, `*ngSwitch` with new syntax:

**Before:**
```html
<div *ngIf="leads.length > 0">
  <div *ngFor="let lead of leads">
    <h3>{{ lead.address }}</h3>
  </div>
</div>
```

**After (Angular 20+):**
```html
@if (leads().length > 0) {
  <div>
    @for (lead of leads(); track lead.id) {
      <h3>{{ lead.address }}</h3>
    }
  </div>
}
```

### 2. Deferrable Views

Defer loading heavy components:

```typescript
@Component({
  template: `
    <app-map-view />

    @defer (prefetch on viewport) {
      <app-lead-list />
    } @loading {
      <app-loader />
    } @placeholder {
      <div class="placeholder">Leads loading...</div>
    }
  `
})
```

### 3. Modern Input/Output

Use `input()` and `output()` instead of decorators:

**Before:**
```typescript
@Input() leads: Lead[] = [];
@Output() leadSelected = new EventEmitter<Lead>();
```

**After:**
```typescript
leads = input<Lead[]>([]);
leadSelected = output<Lead>();
```

### 4. Enhanced Signals

Use advanced signal patterns:

```typescript
// Computed with dependencies
filteredLeads = computed(() => {
  return this.leads().filter(l => l.status === this.selectedStatus());
});

// Effect for side effects
effect(() => {
  const lead = this.selectedLead();
  if (lead) {
    console.log('Lead selected:', lead.address);
  }
});
```

---

## Testing Structure

### Recommended Testing Setup

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── data.service.spec.ts
│   │       └── gemini.service.spec.ts
│   ├── shared/
│   │   ├── components/
│   │   │   └── ui/
│   │   │       └── button/
│   │   │           └── button.component.spec.ts
│   │   └── utils/
│   │       ├── validation.util.spec.ts
│   │       └── date.util.spec.ts
│   └── features/
│       └── leads/
│           ├── components/
│           │   ├── lead-list/
│           │   │   └── lead-list.component.spec.ts
│           │   └── lead-detail/
│           │       └── lead-detail.component.spec.ts
│           ├── services/
│           │   ├── lead-state.service.spec.ts
│           │   └── lead-api.service.spec.ts
│           └── stores/
│               └── lead.store.spec.ts
├── test/
│   ├── mocks/
│   │   ├── lead.mock.ts
│   │   └── session.mock.ts
│   ├── fixtures/
│   │   └── test-data.json
│   └── setup.ts
```

### Example Component Test

**`src/app/features/leads/components/lead-list/lead-list.component.spec.ts`**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadListComponent } from './lead-list.component';
import { MockLeadStore } from '../../../../test/mocks/lead.mock';

describe('LeadListComponent', () => {
  let component: LeadListComponent;
  let fixture: ComponentFixture<LeadListComponent>;
  let leadStore: MockLeadStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LeadListComponent);
    component = fixture.componentInstance;
    leadStore = TestBed.inject(MockLeadStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display leads', () => {
    const mockLeads = createMockLeads();
    leadStore.setLeads(mockLeads);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.lead-card').length).toBe(mockLeads.length);
  });

  it('should filter leads by status', () => {
    component.selectedStatus.set('Interested');
    fixture.detectChanges();

    const interestedLeads = component.filteredLeads();
    expect(interestedLeads.every(l => l.status === 'Interested')).toBe(true);
  });
});
```

---

## Performance Optimization Strategies

### 1. Lazy Loading Implementation

All feature modules should be lazy loaded to reduce initial bundle size:

```typescript
// Route-based lazy loading (already shown in app.routes.ts)
// Component-based lazy loading for heavy components

@Component({
  template: `
    @defer (load heavyComponent()) {
      <app-heavy-component />
    } @loading {
      <app-skeleton-loader />
    }
  `
})
export class ParentComponent {}
```

### 2. OnPush Change Detection

Ensure all components use `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {}
```

### 3. Signal-Based Performance

Use signals for efficient change detection:

```typescript
// Computed values only recalculate when dependencies change
expensiveValue = computed(() => {
  return this.leads().filter(l => l.status === 'Interested').length;
});

// Effects for side effects, not calculations
effect(() => {
  console.log('Lead count changed:', this.leadCount());
});
```

### 4. Route-Based Code Splitting

Each feature route should create separate chunks:

```
main.js (app shell)          ~ 45KB
maps-feature.js (lazy)       ~ 120KB
leads-feature.js (lazy)      ~ 150KB
chatbot-feature.js (lazy)    ~ 200KB
```

---

## Build and Bundle Analysis

### Current Bundle Analysis

Estimated current bundle composition:
- Main bundle: ~400KB (all features included)
- No code splitting
- No lazy loading

### Optimized Bundle Structure (Target)

```
dist/
├── assets/
│   ├── index-ABC123.css        ~ 15KB (styles)
│   ├── index-DEF456.js         ~ 45KB (app shell)
│   ├── maps-GHI789.js          ~ 120KB (maps feature)
│   ├── leads-JKL012.js         ~ 150KB (leads feature)
│   ├── sessions-MNO345.js      ~ 80KB (sessions feature)
│   └── chatbot-PQR678.js       ~ 200KB (chatbot feature)
```

### Bundle Size Targets

| Feature | Current | Target | Reduction |
|---------|---------|--------|-----------|
| App Shell | 400KB | 45KB | 89% |
| Maps | Included | 120KB | - |
| Leads | Included | 150KB | - |
| Sessions | Included | 80KB | - |
| Chatbot | Included | 200KB | - |

---

## Development Workflow Improvements

### 1. Path Aliases Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/core/*": ["src/app/core/*"],
      "@app/shared/*": ["src/app/shared/*"],
      "@app/features/*": ["src/app/features/*"],
      "@app/models": ["src/app/shared/models"],
      "@app/utils": ["src/app/shared/utils"],
      "@app/test/*": ["src/test/*"]
    }
  }
}
```

Usage:
```typescript
import { Lead } from '@app/models/lead.model';
import { ValidationUtil } from '@app/utils/validation.util';
```

### 2. ESLint Configuration

Add Angular-specific linting rules:

```json
{
  "extends": [
    "@angular-eslint/recommended",
    "@angular-eslint/template/process-inline-templates"
  ],
  "rules": {
    "standalone-components": "error",
    "signals": "error",
    "control-flow-syntax": "error"
  }
}
```

### 3. Pre-commit Hooks

Add Husky for code quality:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  }
}
```

---

## Migration Risk Assessment

### High Risk ⚠️

1. **Service Dependencies**: Core services have circular dependencies
   - **Mitigation**: Refactor with proper DI hierarchy

2. **Route Configuration**: Current app component handles all routing logic
   - **Mitigation**: Implement incremental migration with parallel routing

3. **State Management**: Direct signal manipulation across components
   - **Mitigation**: Introduce stores progressively

### Medium Risk ⚠️

1. **Component Refactoring**: Large components need decomposition
   - **Mitigation**: Break into smaller components gradually

2. **Model Changes**: Splitting models may cause type errors
   - **Mitigation**: Keep backward-compatible exports

### Low Risk ✅

1. **Styling**: SCSS/CSS will remain compatible
2. **Utilities**: Helper functions can be moved as-is
3. **Assets**: No changes required

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Create directory structure
- [ ] Set up environment configuration
- [ ] Create app config and routing
- [ ] Split models
- [ ] Migrate core services
- [ ] Create shared utilities

**Duration**: 2 weeks
**Risk**: Low
**Effort**: Medium

### Phase 2: Core Module (Week 3)
- [ ] Create guards and interceptors
- [ ] Implement authentication flow
- [ ] Add error handling
- [ ] Create HTTP services

**Duration**: 1 week
**Risk**: Medium
**Effort**: Medium

### Phase 3: Shared Module (Week 3-4)
- [ ] Create UI components
- [ ] Build shared directives/pipes
- [ ] Create form components
- [ ] Implement validation utilities

**Duration**: 2 weeks
**Risk**: Low
**Effort**: High

### Phase 4: Features Migration (Week 5-8)
- [ ] Migrate leads feature
- [ ] Migrate maps feature
- [ ] Migrate sessions feature
- [ ] Migrate chatbot feature
- [ ] Add stores for each feature

**Duration**: 4 weeks
**Risk**: High
**Effort**: Very High

### Phase 5: Testing & Polish (Week 9-10)
- [ ] Write unit tests
- [ ] Add integration tests
- [ ] Performance optimization
- [ ] Bundle analysis
- [ ] Documentation

**Duration**: 2 weeks
**Risk**: Medium
**Effort**: Medium

---

## Total Migration Estimate

- **Total Duration**: 10 weeks
- **Team Size**: 1-2 developers
- **Risk Level**: Medium-High
- **ROI**: High (improved maintainability, scalability, performance)

---

## Benefits of New Structure

### 1. Maintainability ✅
- **Feature-based organization** makes it easy to locate and modify code
- **Separation of concerns** reduces cognitive load
- **Clear module boundaries** prevent code entanglement

### 2. Scalability ✅
- **Lazy loading** reduces initial bundle size
- **Modular architecture** allows team parallel development
- **Store pattern** enables complex state management

### 3. Performance ✅
- **OnPush change detection** reduces change detection cycles
- **Signals** provide granular reactivity
- **Code splitting** reduces initial load time by 60-80%

### 4. Developer Experience ✅
- **Path aliases** simplify imports
- **Type safety** with dedicated model files
- **Better IDE support** with clear module structure

### 5. Testing ✅
- **Unit test isolation** with proper dependency injection
- **Mock injection** for services
- **Component testing** with standalone components

### 6. Reusability ✅
- **Shared components** can be used across features
- **Utility functions** are centralized
- **Type definitions** are consistent

---

## Success Metrics

### Performance Metrics
- [ ] **Initial bundle size** reduced from 400KB to 45KB (89% reduction)
- [ ] **Lazy load time** under 2 seconds on 3G
- [ ] **Change detection** runs 50% fewer times

### Developer Productivity Metrics
- [ ] **Time to locate code** reduced from 5 min to 30 sec
- [ ] **New feature development** time reduced by 30%
- [ ] **Bug fix time** reduced by 40%

### Code Quality Metrics
- [ ] **Test coverage** increased to 80%+
- [ ] **Cyclomatic complexity** reduced to <10 per function
- [ ] **Code duplication** reduced to <5%

---

## Conclusion

The current Roof Scout project has a solid foundation using Angular 20's modern features, particularly standalone components and signals. However, the flat structure and lack of feature-based organization limit scalability and maintainability.

The recommended migration to a feature-based architecture with proper separation of concerns (Core, Shared, Features) will:

1. **Improve maintainability** through logical code organization
2. **Enhance performance** with lazy loading and code splitting
3. **Enable scalability** for team growth and feature expansion
4. **Reduce technical debt** by implementing modern patterns
5. **Provide better developer experience** with clear boundaries and reusability

The migration is **medium-high risk** but offers **high ROI**. With a 10-week timeline, the investment will pay off through improved development velocity, reduced bugs, and easier onboarding for new developers.

**Recommendation**: Proceed with the migration in phases, starting with foundation setup and core services, then gradually migrating features while maintaining backward compatibility throughout the process.

---

## Appendix A: Key Angular 20+ Resources

### Official Documentation
- [Angular Standalone Components](https://angular.dev/guide/templates/standalone-components)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Control Flow](https://angular.dev/guide/templates/control-flow)
- [Angular Deferrable Views](https://angular.dev/guide/defer)
- [Angular Routing](https://angular.dev/guide/routing)

### Performance
- [Angular Performance](https://angular.dev/guide/zone#setting-up-zone.js)
- [OnPush Change Detection](https://angular.io/api/core/ChangeDetectionStrategy)

### Testing
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Component Testing](https://angular.io/guide/testing-components-basics)

---

## Appendix B: Rollback Plan

If migration encounters issues:

1. **Git Branch**: Keep feature branch separate until migration complete
2. **Feature Flags**: Use flags to enable/disable new structure
3. **Incremental Rollback**: Can revert individual features
4. **Database**: No changes required (using localStorage)

---

## Appendix C: Additional Resources

### Tools
- **Angular DevTools**: For debugging and performance profiling
- **Augury**: Alternative Angular debugging extension
- **Bundle Analyzer**: For bundle size analysis
- **Source Map Explorer**: For understanding bundle composition

### Libraries
- **NgRx**: For complex state management (optional)
- **Angular Material**: For UI components (optional)
- **NgRx SignalStore**: For signal-based stores (optional)

---

**Document Version**: 1.0
**Last Updated**: November 1, 2025
**Author**: Claude Code
**Status**: Ready for Implementation