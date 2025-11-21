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
  templateUrl: './forgot-password.component.html',
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
