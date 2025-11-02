import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    importProvidersFrom(ReactiveFormsModule),
    provideServiceWorker('ngsw-worker.js', {
      enabled: true, // Enable in production builds
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
};
