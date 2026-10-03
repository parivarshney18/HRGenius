import { Injectable, signal, computed, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'hrgenius_theme';

  public readonly theme = signal<AppTheme>(this.getInitialTheme());
  public readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Apply initial theme immediately
    this.applyTheme(this.theme());

    // Sync theme changes to DOM and localStorage
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      try {
        localStorage.setItem(this.THEME_STORAGE_KEY, currentTheme);
      } catch {
        // Handle localStorage restrictions if any
      }
    });

    // Listen for OS system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only adapt if user hasn't explicitly set a preference
        if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
          this.theme.set(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  public toggleTheme(): void {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }

  public setTheme(newTheme: AppTheme): void {
    this.theme.set(newTheme);
  }

  private getInitialTheme(): AppTheme {
    if (typeof window === 'undefined') {
      return 'light';
    }

    try {
      const saved = localStorage.getItem(this.THEME_STORAGE_KEY) as AppTheme | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }
}
