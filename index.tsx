import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { AppComponent } from './src/app.component';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    importProvidersFrom(ReactiveFormsModule)
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
