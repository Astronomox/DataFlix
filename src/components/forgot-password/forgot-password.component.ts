import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 p-4">
      <div class="w-full max-w-md">
        <div class="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-2xl p-8 text-white">
          <h1 class="text-4xl font-bold text-center mb-2">Forgot Password</h1>
          <p class="text-center text-gray-200 mb-8">Enter your email to receive a reset link.</p>
          
          <form (ngSubmit)="onSubmit()" #forgotPasswordForm="ngForm">
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                [(ngModel)]="email"
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-gray-400 transition"
                placeholder="you@university.edu">
            </div>
            
            <button 
              type="submit" 
              [disabled]="isLoading() || forgotPasswordForm.invalid"
              class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                @if(isLoading()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending Link...</span>
                } @else {
                  <span>Send Reset Link</span>
                }
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-300">
            <p>Remember your password? <a routerLink="/login" class="font-semibold text-white hover:underline">Sign In</a></p>
          </div>
        </div>
      </div>
    </div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  email = '';
  isLoading = signal(false);

  async onSubmit() {
    if (!this.email) return;
    this.isLoading.set(true);
    
    try {
      await this.authService.sendPasswordResetEmail(this.email);
    } finally {
      this.isLoading.set(false);
    }
  }
}