import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isBrowser = false;
  theme = signal<'light' | 'dark'>('light');

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
        const storedTheme = localStorage.getItem('dataflix-theme') as 'light' | 'dark';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme.set(storedTheme || (prefersDark ? 'dark' : 'light'));
    }

    effect(() => {
        if(this.isBrowser) {
            localStorage.setItem('dataflix-theme', this.theme());
            if (this.theme() === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
  }

  toggleTheme() {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }
}
