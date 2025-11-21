import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { MOTIVATIONAL_QUOTES } from '../../data/motivational-quotes';
import { AiGreetingService } from '../../services/ai-greeting.service';
import { TimetableService, TimetableEntry } from '../../services/timetable.service';
import { Day } from '../../services/timetable.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  aiGreetingService = inject(AiGreetingService);
  timetableService = inject(TimetableService);

  currentUser = this.authService.currentUser;
  todayQuote: string;
  aiGreeting = signal('Loading a friendly greeting for you...');
  
  isBriefingVisible = signal(false);
  todaysSchedule = signal<TimetableEntry[]>([]);

  constructor() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    this.todayQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  }

  async ngOnInit() {
    // Check session storage to see if the briefing has been dismissed for this session.
    if (sessionStorage.getItem('dailyBriefingDismissed') !== 'true') {
        this.isBriefingVisible.set(true);
    }
    this.loadDailyBriefing();
  }

  async loadDailyBriefing() {
    // We can run these in parallel
    const greetingPromise = this.aiGreetingService.getGreeting();
    const schedulePromise = this.loadTodaysSchedule();

    // Set the greeting from the AI service
    this.aiGreeting.set(await greetingPromise);

    // Wait for the schedule to be loaded
    await schedulePromise;
  }

  async loadTodaysSchedule() {
    const today = new Date();
    // FIX: The `Day` type only includes weekdays ('Monday' to 'Friday').
    // The `weekday` array was incorrectly typed as `Day[]` but contained 'Sunday' and 'Saturday'.
    // It is now correctly typed as `string[]`, and the `as Day` cast is removed.
    // The logic works as intended because on weekends, `currentDay` will be 'Sunday' or 'Saturday',
    // which won't match any `entry.day`, resulting in an empty schedule.
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
    // Remember the user's choice for the current browser session.
    sessionStorage.setItem('dailyBriefingDismissed', 'true');
  }
}