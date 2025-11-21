import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  passwordVisible = signal(false);

  togglePasswordVisibility() {
    this.passwordVisible.update(v => !v);
  }

  async onSubmit() {
    if (!this.password || this.password !== this.confirmPassword) {
      this.notificationService.show('Passwords do not match or are empty.', 'error');
      return;
    }
    if (this.password.length < 6) {
        this.notificationService.show('Password must be at least 6 characters long.', 'error');
        return;
    }

    this.isLoading.set(true);
    
    try {
      await this.authService.updatePassword(this.password);
    } finally {
      this.isLoading.set(false);
    }
  }
}
