import { Component, ChangeDetectionStrategy, inject, signal, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { MOTIVATIONAL_QUOTES } from '../../data/motivational-quotes';
import { AiGreetingService } from '../../services/ai-greeting.service';
import { TimetableService, TimetableEntry } from '../../services/timetable.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
<div class="container mx-auto">
  <!-- AI Daily Briefing -->
  @if (isBriefingVisible()) {
    <div class="mb-8 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-6">
      <div class="flex-shrink-0 flex justify-center items-center">
        <!-- "Alive" AI Icon -->
        <div class="relative w-24 h-24">
            <svg class="absolute w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="metaball">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="metaball" />
                  <feComposite in="SourceGraphic" in2="metaball" operator="atop" />
                </filter>
              </defs>
              <g style="filter: url(#metaball);">
                <circle cx="50" cy="50" r="25" fill="#A78BFA" class="animate-blob1" />
                <circle cx="50" cy="50" r="20" fill="#F472B6" class="animate-blob2" />
                <circle cx="50" cy="50" r="15" fill="#818CF8" class="animate-blob3" />
              </g>
            </svg>
          </div>
      </div>
      <div class="flex-grow">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">Your Daily Briefing from Flixy</h2>
        @if (isLoadingGreeting()) {
          <div class="mt-2 h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        } @else {
          <p class="mt-2 text-gray-700 dark:text-gray-300">{{ aiGreeting() }}</p>
        }
        
        <div class="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <h3 class="font-semibold text-gray-800 dark:text-white">Here's your schedule for today:</h3>
          <div class="mt-2 space-y-2">
            @for(entry of todaysSchedule(); track entry.id) {
              <div class="flex items-center gap-3 text-sm">
                <span class="font-bold text-purple-600 dark:text-purple-400 w-28">{{ entry.time }}</span>
                <span class="text-gray-700 dark:text-gray-300">{{ entry.course }}</span>
                <span class="text-gray-500 dark:text-gray-400 italic">({{ entry.location }})</span>
              </div>
            } @empty {
              <p class="text-sm text-gray-500 dark:text-gray-400">You have no classes scheduled for today. Have a great and productive day!</p>
            }
          </div>
        </div>
      </div>
       <div class="self-start sm:self-center">
        <button (click)="dismissBriefing()" class="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors">
          Got it!
        </button>
      </div>
    </div>
  }

  @if (currentUser(); as user) {
    <h1 class="text-3xl font-bold text-gray-800 dark:text-white">
      Welcome back, {{ user.name.split(' ')[0] }}!
    </h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">Here's a snapshot of your academic world.</p>
  }

  <!-- Motivational Corner -->
  <div class="mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
    <h2 class="font-bold text-xl">Daily Dose of Motivation</h2>
    <p class="mt-2 italic">"{{ todayQuote }}"</p>
  </div>
  
  <!-- Quick Access Panels -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
    
    <!-- Course Materials Card -->
    <a routerLink="/materials" class="group block p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-blue-500/20 rounded-xl flex items-center justify-center">
             <svg class="w-8 h-8 text-blue-500" fill="none" stroke-width="2" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0l8.59-3.908Z"></path><path d="M6 12v4c0 4.5 3 5 6 5s6-.5 6-5v-4"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold">Course Materials</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Access lectures, notes, and more.</p>
          </div>
        </div>
        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </div>
    </a>

    <!-- Timetable Card -->
    <a routerLink="/timetable" class="group block p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-green-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke-width="2" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold">Weekly Timetable</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Check your class schedule.</p>
          </div>
        </div>
        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </div>
    </a>

    <!-- Announcements Card -->
    <a routerLink="/announcements" class="group block p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-yellow-500/20 rounded-xl flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-500" fill="none" stroke-width="2" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold">Announcements</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Latest news from the department.</p>
          </div>
        </div>
        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </div>
    </a>
  </div>

  <!-- Quick Tips -->
  <div class="mt-8 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg">
    <h3 class="font-bold text-lg">Quick Tip</h3>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      You can update your profile picture and personal details by visiting the <a routerLink="/profile" class="font-semibold text-purple-600 dark:text-purple-400 hover:underline">Profile</a> page. Keeping your information current helps administrators stay in touch!
    </p>
  </div>
</div>
`,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  aiGreetingService = inject(AiGreetingService);
  timetableService = inject(TimetableService);
  private isBrowser: boolean;

  currentUser = this.authService.currentUser;
  todayQuote: string;

  aiGreeting = signal('Loading a friendly greeting for you...');
  todaysSchedule = signal<TimetableEntry[]>([]);
  isLoadingGreeting = signal(true);
  isBriefingVisible = signal(true);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    this.todayQuote = MOTIVATIONAL_QUOTES[quoteIndex];

    if (this.isBrowser) {
      const dismissed = sessionStorage.getItem('briefingDismissed');
      if (dismissed === 'true') {
        this.isBriefingVisible.set(false);
      }
    }
  }

  ngOnInit() {
    if (this.isBriefingVisible()) {
      this.loadDailyBriefing();
    }
  }

  async loadDailyBriefing() {
    this.isLoadingGreeting.set(true);
    try {
      const greetingPromise = this.aiGreetingService.getGreeting();
      const schedulePromise = this.loadTodaysSchedule();

      this.aiGreeting.set(await greetingPromise);
      await schedulePromise;
    } catch (error) {
      console.error("Error loading daily briefing:", error);
      this.aiGreeting.set("Could not load your briefing at this time. Please check your connection.");
    } finally {
      this.isLoadingGreeting.set(false);
    }
  }

  async loadTodaysSchedule() {
    const today = new Date();
    // Using toLocaleDateString to get the full day name is more reliable than a manual array.
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    const allEntries = await this.timetableService.getTimetable();
    const todayEntries = allEntries
      .filter(entry => entry.day === currentDay)
      .sort((a, b) => a.time.localeCompare(b.time));
      
    this.todaysSchedule.set(todayEntries);
  }

  dismissBriefing() {
    this.isBriefingVisible.set(false);
    if (this.isBrowser) {
      sessionStorage.setItem('briefingDismissed', 'true');
    }
  }
}