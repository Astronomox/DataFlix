import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiGreetingService {
  private authService = inject(AuthService);
  private ai: GoogleGenAI | null = null;

  constructor() {
    // IMPORTANT: The API_KEY must be set as an environment variable in your deployment environment (e.g., Vercel).
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.error('Gemini API key is not configured. AI features will be disabled.');
    }
  }

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


    if (!this.ai) {
      return `Good ${this.getTimeOfDay()}, ${userName}! Welcome back to your dashboard.`;
    }

    const prompt = `
      You are Flixy, a friendly, warm, and very encouraging AI companion for university students using the DataFlix student portal.
      Your goal is to make the student feel welcomed, positive, and ready for their day.
      Generate a short, unique, and cheerful greeting for a student named ${userName}.

      - The current time of day is ${this.getTimeOfDay()}.
      - Keep the greeting to about 1-2 friendly sentences.
      - Do NOT sound like a generic chatbot. Be creative and vary your greetings each day.
      - Do NOT use emojis.
      - Do NOT ask any questions.
      - Start directly with the greeting. Do not use any preamble like "Here is a greeting:".

      Example tones: "Good morning, ${userName}! Hope you have a fantastic and productive day ahead.", "Hello ${userName}! Ready to make this afternoon a great one?", "Good evening, ${userName}! Hope you had a wonderful day of learning."
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const greeting = response.text.trim();
      
      // Cache the new greeting
      try {
        localStorage.setItem(cacheKey, greeting);
      } catch (e) {
        // Ignore cache errors
      }

      return greeting;
    } catch (error) {
      console.error('Error generating AI greeting:', error);
      return `Good ${this.getTimeOfDay()}, ${userName}! Wishing you a wonderful day.`;
    }
  }
}