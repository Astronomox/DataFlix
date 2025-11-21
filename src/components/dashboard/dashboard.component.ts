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
  templateUrl: './dashboard.component.html',
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
    const greetingPromise = this.aiGreetingService.getGreeting();
    const schedulePromise = this.loadTodaysSchedule();

    this.aiGreeting.set(await greetingPromise);
    this.isLoadingGreeting.set(false);
    
    await schedulePromise;
  }

  async loadTodaysSchedule() {
    const today = new Date();
    const weekday: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = weekday[today.getDay()];

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