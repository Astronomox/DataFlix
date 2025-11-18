import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { MOTIVATIONAL_QUOTES } from '../../data/motivational-quotes';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  todayQuote: string;

  constructor() {
    const today = new Date();
    // Calculate the day of the year (1-366)
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Use the day of the year to get a consistent daily quote that changes each day
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    this.todayQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  }
}