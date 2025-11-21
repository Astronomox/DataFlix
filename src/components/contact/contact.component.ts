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
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  // Fix: Explicitly type the injected HttpClient instance.
  http: HttpClient = inject(HttpClient);
  currentUser = this.authService.currentUser;

  subject = signal('');
  message = signal('');
  isSubmitting = signal(false);

  async onSubmit() {
    if (!this.subject() || !this.message()) {
      this.notificationService.show('Please fill out all fields.', 'warning');
      return;
    }

    this.isSubmitting.set(true);

    const user = this.currentUser();
    if (!user) {
      this.notificationService.show('You must be logged in to send a message.', 'error');
      this.isSubmitting.set(false);
      return;
    }

    const payload = {
      name: user.name,
      email: user.email,
      subject: this.subject(),
      message: this.message(),
    };

    try {
      const response$ = this.http.post('/api/send-email', payload);
      await lastValueFrom(response$);

      this.notificationService.show('Your message has been sent successfully! We will get back to you shortly.', 'success', 5000);
      
      // Reset form
      this.subject.set('');
      this.message.set('');
    } catch (err: any) {
      console.error('Failed to send email:', err);
      
      // This logic is designed to extract a clear, human-readable error message
      // from the server response, preventing the "[object Object]" error.
      let errorMessage = 'An unexpected server error occurred. Please try again later.';

      if (err.error) {
        if (typeof err.error.error === 'string') {
          // Handles Vercel function's { error: "message" } response
          errorMessage = err.error.error;
        } else if (typeof err.error === 'string') {
          // Handles a plain text error response
          errorMessage = err.error;
        }
      } else if (err.message) {
        // Catches network errors (like CORS) or other client-side fetch issues
        errorMessage = err.message;
      }
      
      this.notificationService.show(`Failed to send email: ${errorMessage}`, 'error', 7000);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
