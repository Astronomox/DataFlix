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
    if (!user) {
        // Fallback for an unlikely edge case where user is not available
        return `Welcome! Wishing you a wonderful day.`;
    }

    const userName = user.name.split(' ')[0] || 'Student';
    const today = new Date().toISOString().split('T')[0];
    // FIX: The cache key is now user-specific by including the user's ID.
    const cacheKey = `flixy-greeting-${user.id}-${today}`;

    // Check for a cached greeting for the current day and user to avoid unnecessary API calls
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

      // Cache the new greeting with the user-specific key
      try {
        localStorage.setItem(cacheKey, greeting);
      } catch (e) {
        // Ignore cache errors
      }

      return greeting;
    } catch (err: any) {
      // This logic is designed to extract a clear, human-readable error message
      // from the server response, preventing the "[object Object]" error in logs.
      let errorMessage = 'An unexpected server error occurred.';

      if (err.error) {
        if (typeof err.error.error === 'string') {
          // Handles Vercel function's { error: "message" } response
          errorMessage = err.error.error;
        } else if (typeof err.error === 'string') {
          // Handles a plain text error response
          errorMessage = err.error;
        }
      } else if (err.message) {
        // Catches network errors (like CORS) or other client-side fetch issues
        errorMessage = err.message;
      }

      console.error('Error fetching AI greeting from serverless function:', errorMessage);
      
      // Provide a graceful fallback if the API fails
      return `Good ${this.getTimeOfDay()}, ${userName}! Wishing you a wonderful day.`;
    }
  }
}