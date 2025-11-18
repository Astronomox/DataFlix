import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../models/user.model';
import { UNILAG_FACULTIES, Faculty } from '../../data/unilag-courses';

@Component({
  selector: 'app-register',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div class="w-full max-w-md">
        <div class="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-2xl p-8 text-white">
          <h1 class="text-4xl font-bold text-center mb-2">Create Account</h1>
          <p class="text-center text-gray-200 mb-8">Join the DataFlix Community</p>
          
          <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">Sign up as</label>
              <div class="flex rounded-lg bg-white/10 border border-white/20 p-1">
                  <button type="button" 
                          (click)="role = UserRole.Student"
                          [class.bg-white]="role === UserRole.Student"
                          [class.text-purple-600]="role === UserRole.Student"
                          [class.text-white]="role !== UserRole.Student"
                          class="w-1/2 py-2 text-sm font-bold rounded-md transition-colors">
                      Student
                  </button>
                  <button type="button" 
                          (click)="role = UserRole.Admin"
                          [class.bg-white]="role === UserRole.Admin"
                          [class.text-purple-600]="role === UserRole.Admin"
                          [class.text-white]="role !== UserRole.Admin"
                          class="w-1/2 py-2 text-sm font-bold rounded-md transition-colors">
                      Admin
                  </button>
              </div>
            </div>

            <div class="mb-4">
              <label for="name" class="block text-sm font-medium text-gray-200 mb-2">Full Name</label>
              <input type="text" id="name" name="name" [(ngModel)]="name" required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-gray-400 transition"
                placeholder="John Doe">
            </div>
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
              <input type="email" id="email" name="email" [(ngModel)]="email" required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-gray-400 transition"
                placeholder="you@university.edu">
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="faculty" class="block text-sm font-medium text-gray-200 mb-2">Faculty</label>
                <div class="relative">
                  <select id="faculty" name="faculty" (change)="onFacultyChange($event)" required
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none transition appearance-none text-gray-300">
                    <option value="" disabled selected hidden>Select faculty</option>
                    @for(faculty of faculties; track faculty.name) {
                      <option [value]="faculty.name" class="text-black bg-white">{{ faculty.name }}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label for="department" class="block text-sm font-medium text-gray-200 mb-2">Department</label>
                <div class="relative">
                  <select id="department" name="department" [(ngModel)]="department" required
                    [disabled]="!selectedFaculty()"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    [class.text-white]="department !== ''" [class.text-gray-300]="department === ''">
                    <option value="" disabled selected hidden>Select department</option>
                    @if(selectedFaculty(); as faculty) {
                      @for(course of faculty.courses; track course) {
                        <option [value]="course" class="text-black bg-white">{{ course }}</option>
                      }
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

             <div class="mb-4">
              <label for="level" class="block text-sm font-medium text-gray-200 mb-2">Level</label>
              <div class="relative">
                  <select id="level" name="level" [(ngModel)]="level" required class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none transition appearance-none text-white">
                      <option [value]="100" class="text-black bg-white">100 Level</option>
                      <option [value]="200" class="text-black bg-white">200 Level</option>
                      <option [value]="300" class="text-black bg-white">300 Level</option>
                      <option [value]="400" class="text-black bg-white">400 Level</option>
                      <option [value]="500" class="text-black bg-white">500 Level</option>
                      <option [value]="600" class="text-black bg-white">600 Level</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
                      <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-200 mb-2">Password</label>
              <div class="relative">
                <input [type]="passwordVisible() ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password" required
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-gray-400 transition pr-10"
                  placeholder="••••••••">
                <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 hover:text-white">
                  @if (passwordVisible()) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  } @else {
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7 9.542-7 .847 0 1.67 .11 2.458 .315M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3.464V12a9.956 9.956 0 00-5.464-1.536M3 3l18 18" />
                    </svg>
                  }
                </button>
              </div>
            </div>

            @if (role === UserRole.Admin) {
              <div class="mb-6">
                <label for="secretCode" class="block text-sm font-medium text-gray-200 mb-2">Admin Secret Code</label>
                <div class="relative">
                  <input [type]="secretCodeVisible() ? 'text' : 'password'" id="secretCode" name="secretCode" [(ngModel)]="secretCode" required
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-gray-400 transition pr-10"
                    placeholder="Enter admin secret code">
                  <button type="button" (click)="toggleSecretCodeVisibility()" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 hover:text-white">
                    @if (secretCodeVisible()) {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    } @else {
                      <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064 7 9.542-7 .847 0 1.67 .11 2.458 .315M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3.464V12a9.956 9.956 0 00-5.464-1.536M3 3l18 18" />
                      </svg>
                    }
                  </button>
                </div>
              </div>
            } @else {
              <!-- This empty div is for spacing consistency when the admin secret code is not shown -->
              <div class="mb-6 h-16 sm:h-auto"></div> 
            }
            
            <button type="submit" [disabled]="isLoading() || registerForm.invalid"
              class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                @if(isLoading()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                } @else {
                  <span>Sign Up</span>
                }
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-300">
            <p>Already have an account? <a routerLink="/login" class="font-semibold text-white hover:underline">Sign In</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
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