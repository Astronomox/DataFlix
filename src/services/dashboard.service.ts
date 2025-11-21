import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private isBrowser: boolean;
  
  briefingVisible = signal<boolean>(true);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      const dismissed = sessionStorage.getItem('briefingDismissed');
      if (dismissed === 'true') {
        this.briefingVisible.set(false);
      }
    }
  }

  showBriefing() {
    this.briefingVisible.set(true);
    if (this.isBrowser) {
        sessionStorage.removeItem('briefingDismissed');
    }
  }

  hideBriefing() {
    this.briefingVisible.set(false);
    if (this.isBrowser) {
      sessionStorage.setItem('briefingDismissed', 'true');
    }
  }
}