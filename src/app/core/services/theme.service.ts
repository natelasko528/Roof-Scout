import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'roof_scout_theme';
  theme = signal<Theme>('light');

  constructor() {
    this.loadTheme();
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem(this.THEME_KEY, currentTheme);
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  private loadTheme() {
    try {
      const storedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
      if (storedTheme) {
        this.theme.set(storedTheme);
      } else {
        // Default to system preference if available, otherwise light
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme.set(prefersDark ? 'dark' : 'light');
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
      this.theme.set('light');
    }
  }

  toggleTheme() {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }
}
