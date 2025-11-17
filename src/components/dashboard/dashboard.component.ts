import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  motivationalQuotes = [
    "The secret to getting ahead is getting started.",
    "The expert in anything was once a beginner.",
    "Believe you can and you're halfway there.",
    "It does not matter how slowly you go as long as you do not stop.",
    "The future belongs to those who believe in the beauty of their dreams."
  ];
  
  todayQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
}
