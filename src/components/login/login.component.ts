import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  passwordVisible = signal(false);

  togglePasswordVisibility() {
    this.passwordVisible.update(v => !v);
  }

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    
    try {
      await this.authService.login(this.email, this.password);
    } finally {
      // If login fails, the user stays on the page, so we must reset the loading state.
      // If successful, we navigate away, but this is still good practice.
      this.isLoading.set(false);
    }
  }
}
