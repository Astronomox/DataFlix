import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="container mx-auto">
  <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Get in Touch</h1>
  <p class="mt-1 text-gray-600 dark:text-gray-400">Have an issue or a suggestion? We'd love to hear from you.</p>

  <div class="mt-8 max-w-2xl mx-auto">
    <div class="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-8">
      <form (ngSubmit)="onSubmit()" #contactForm="ngForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
            <input type="text" id="name" name="name" [(ngModel)]="contactDetails.name" required
              class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500 transition">
          </div>
          <div class="md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Email</label>
            <input type="email" id="email" name="email" [(ngModel)]="contactDetails.email" required
              class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500 transition">
          </div>
          <div class="md:col-span-2">
            <label for="subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
            <input type="text" id="subject" name="subject" [(ngModel)]="contactDetails.subject" required
              class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500 transition">
          </div>
          <div class="md:col-span-2">
            <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
            <textarea id="message" name="message" [(ngModel)]="contactDetails.message" required rows="6"
              class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500 transition"></textarea>
          </div>
        </div>

        <div class="mt-6">
          <button type="submit" [disabled]="isLoading() || contactForm.invalid"
            class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            @if(isLoading()) {
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            } @else {
              <span>Send Message</span>
            }
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  
  isLoading = signal(false);
  
  contactDetails = {
    name: this.authService.currentUser()?.name ?? '',
    email: this.authService.currentUser()?.email ?? '',
    subject: '',
    message: ''
  };

  async onSubmit() {
    this.isLoading.set(true);
    try {
      await lastValueFrom(this.http.post('/api/send-email', this.contactDetails));
      this.notificationService.show('Your message has been sent successfully!', 'success');
      // Reset form fields but keep user's name and email
      this.contactDetails.subject = '';
      this.contactDetails.message = '';
    } catch (error: any) {
      console.error('Contact form error:', error);
      const errorMessage = error?.error?.error || 'Failed to send message. Please try again later.';
      this.notificationService.show(errorMessage, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}