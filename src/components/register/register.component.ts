import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../models/user.model';
import { UNILAG_FACULTIES, Faculty } from '../../data/unilag-courses';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  name = '';
  email = '';
  password = '';
  department = '';
  level = 100;
  role: UserRole = UserRole.Student;
  secretCode = '';
  isLoading = signal(false);
  passwordVisible = signal(false);
  secretCodeVisible = signal(false);

  faculties: Faculty[] = UNILAG_FACULTIES;
  selectedFaculty = signal<Faculty | null>(null);
  
  // Expose UserRole enum to the template
  UserRole = UserRole;

  onFacultyChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const facultyName = selectElement.value;
    this.selectedFaculty.set(this.faculties.find(f => f.name === facultyName) || null);
    this.department = ''; // Reset department when faculty changes
  }

  togglePasswordVisibility() {
    this.passwordVisible.update(v => !v);
  }

  toggleSecretCodeVisibility() {
    this.secretCodeVisible.update(v => !v);
  }

  onSubmit() {
    if (!this.email || !this.password || !this.name || !this.department) return;
    this.isLoading.set(true);
    
    this.authService.register(this.name, this.email, this.password, this.department, this.role, this.level, this.secretCode)
      .finally(() => {
        this.isLoading.set(false);
      });
  }
}
