import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiGreetingService } from '../../services/ai-greeting.service';
import { TimetableService, TimetableEntry } from '../../services/timetable.service';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ai-briefing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Daily Briefing</h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">Your AI-powered summary for today.</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center p-16">
          <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <!-- AI Greeting -->
            <div class="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-6">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                   <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-800 dark:text-white">A Message from Flixy</h2>
                  <p class="mt-2 text-gray-700 dark:text-gray-300">{{ aiGreeting() }}</p>
                </div>
              </div>
            </div>

            <!-- Today's Schedule -->
            <div class="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Today's Schedule</h2>
              @if (todaysSchedule().length > 0) {
                <ul class="space-y-4">
                  @for (entry of todaysSchedule(); track entry.id) {
                    <li class="flex items-center space-x-4 p-3 bg-white/20 dark:bg-gray-700/30 rounded-lg">
                      <div class="w-16 text-center">
                        <p class="font-bold text-purple-600 dark:text-purple-400">{{ entry.time }}</p>
                      </div>
                      <div class="flex-1 border-l-2 border-purple-300 dark:border-purple-700 pl-4">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">{{ entry.course }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ entry.location }}</p>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <div class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p class="mt-4 text-gray-600 dark:text-gray-400">No classes scheduled for today. Enjoy your free day!</p>
                </div>
              }
            </div>
          </div>

          <div class="lg:col-span-1 space-y-8">
            <!-- Quick Links -->
            <div class="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Links</h2>
              <ul class="space-y-3">
                <li>
                  <a routerLink="/materials" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/40 transition-colors">
                    <div class="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.062.077m15.482 0l.062.077m0 0l.062.077m-15.606-0.154l.062.077m15.482 0l-.062.077m-15.482 0l.062.077"></path></svg>
                    </div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Course Materials</span>
                  </a>
                </li>
                 <li>
                  <a routerLink="/announcements" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/40 transition-colors">
                    <div class="w-8 h-8 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                      <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"></path></svg>
                    </div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Announcements</span>
                  </a>
                </li>
                 <li>
                  <a routerLink="/timetable" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/40 transition-colors">
                    <div class="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9.75 12.75h.008v.008H9.75v-.008zm3.75 0h.008v.008h-.008v-.008zm-3.75 3.75h.008v.008H9.75v-.008zm3.75 0h.008v.008h-.008v-.008z"></path></svg>
                    </div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Full Timetable</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiBriefingComponent implements OnInit {
  private authService = inject(AuthService);
  private aiGreetingService = inject(AiGreetingService);
  private timetableService = inject(TimetableService);

  currentUser = this.authService.currentUser;
  aiGreeting = signal('Loading your daily briefing...');
  todaysSchedule = signal<TimetableEntry[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadDailyBriefing();
  }

  async loadDailyBriefing() {
    this.isLoading.set(true);
    const greetingPromise = this.aiGreetingService.getGreeting();
    const schedulePromise = this.loadTodaysSchedule();

    try {
        this.aiGreeting.set(await greetingPromise);
        await schedulePromise;
    } catch (error) {
        console.error("Error loading daily briefing:", error);
        this.aiGreeting.set("Could not load your briefing at this time. Please try again later.");
    } finally {
        this.isLoading.set(false);
    }
  }

  async loadTodaysSchedule() {
    const today = new Date();
    // Using toLocaleDateString to get the full day name is more reliable than an array
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    const allEntries = await this.timetableService.getTimetable();
    const todayEntries = allEntries
      .filter(entry => entry.day === currentDay)
      .sort((a, b) => a.time.localeCompare(b.time));
      
    this.todaysSchedule.set(todayEntries);
  }
}