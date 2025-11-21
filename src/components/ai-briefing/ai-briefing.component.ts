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
  templateUrl: './ai-briefing.component.html',
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
