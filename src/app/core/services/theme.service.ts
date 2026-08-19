import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

const THEME_CLASSES: Record<AppTheme, string> = {
  light: 'theme-light',
  dark: 'theme-dark',
  blue: 'theme-blue',
  green: 'theme-green',
  purple: 'theme-purple',
};

const LEGACY_THEME_CLASSES = ['dark', 'theme-blue', 'theme-green', 'theme-purple'];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'theme';
  private readonly fallbackTheme: AppTheme = 'light';

  readonly currentTheme = signal<AppTheme>(this.fallbackTheme);

  init(): void {
    this.setTheme(this.getStoredTheme(), false);
  }

  setTheme(theme: string, persist = true): void {
    const nextTheme = this.normalizeTheme(theme);
    this.currentTheme.set(nextTheme);
    this.applyThemeClass(nextTheme);

    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, nextTheme);
    }
  }

  toggleLightDark(): void {
    this.setTheme(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

  private getStoredTheme(): AppTheme {
    if (typeof localStorage === 'undefined') {
      return this.fallbackTheme;
    }

    return this.normalizeTheme(localStorage.getItem(this.storageKey));
  }

  private normalizeTheme(theme: string | null): AppTheme {
    if (theme === 'dark' || theme === 'blue' || theme === 'green' || theme === 'purple') {
      return theme;
    }

    return this.fallbackTheme;
  }

  private applyThemeClass(theme: AppTheme): void {
    if (typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    html.classList.remove(...Object.values(THEME_CLASSES), ...LEGACY_THEME_CLASSES);
    html.classList.add(THEME_CLASSES[theme]);

    if (theme === 'dark') {
      html.classList.add('dark');
    }
  }
}
