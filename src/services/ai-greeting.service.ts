import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AiGreetingService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  async getGreeting(): Promise<string> {
    const user = this.authService.currentUser();
    const userName = user?.name.split(' ')[0] || 'Student';
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `flixy-greeting-${today}`;

    // Check for a cached greeting for the current day to avoid unnecessary API calls
    try {
        const cachedGreeting = localStorage.getItem(cacheKey);
        if (cachedGreeting) {
            return cachedGreeting;
        }
    } catch (e) {
        console.warn('Could not access localStorage. Caching will be disabled.');
    }

    try {
      const response$ = this.http.post<{ greeting: string }>('/api/get-greeting', { userName });
      const response = await lastValueFrom(response$);
      const greeting = response.greeting;

      // Cache the new greeting
      try {
        localStorage.setItem(cacheKey, greeting);
      } catch (e) {
        // Ignore cache errors
      }

      return greeting;
    } catch (error) {
      console.error('Error fetching AI greeting from serverless function:', error);
      // Provide a graceful fallback if the API fails
      return `Good ${this.getTimeOfDay()}, ${userName}! Wishing you a wonderful day.`;
    }
  }
}