import { Injectable, signal, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';
import { supabase } from '../supabase.config';
import { UNILAG_FACULTIES } from '../data/unilag-courses';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Fix: Explicitly type the injected Router instance.
  private router: Router = inject(Router);
  private notificationService = inject(NotificationService);
  private ngZone = inject(NgZone);
  
  currentUser = signal<User | null>(null);
  private authInitializedPromise: Promise<void>;
  private resolveAuthInitialized!: () => void;

  constructor() {
    this.authInitializedPromise = new Promise(resolve => {
        this.resolveAuthInitialized = resolve;
    });

    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      this.ngZone.run(async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser.set(null);
          // Redirect to login on sign out to prevent staying on protected routes
          this.router.navigate(['/login']);
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await this.loadUserProfile(session.user);
          }
          this.resolveAuthInitialized(); // Resolve promise after handling initial session
        } else if (event === 'PASSWORD_RECOVERY') {
            // When user clicks the password recovery link, Supabase redirects them here.
            // We then navigate them to the page to set a new password.
            this.router.navigate(['/reset-password']);
        }
      });
    });
  }

  waitForAuthInitialization(): Promise<void> {
    return this.authInitializedPromise;
  }

  private findFacultyForDepartment(department: string): string | undefined {
    const faculty = UNILAG_FACULTIES.find(f => f.courses.includes(department));
    return faculty?.name;
  }

  private async loadUserProfile(supabaseUser: SupabaseUser) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
  
      if (error && error.code !== 'PGRST116') { // PGRST116 means "single() row not found" which we will handle.
          throw error;
      }
  
      if (data) {
        const userWithFaculty: User = {
            ...data,
            level: data.level || 100, // Default for legacy users
            faculty: this.findFacultyForDepartment(data.department)
        };
        this.currentUser.set(userWithFaculty);
      } else if (supabaseUser) {
        // Self-Healing: Profile not found for a logged-in user. Create it now.
        console.log(`Profile for user ${supabaseUser.id} not found. Auto-creating one.`);
        const { data: newUserProfile, error: insertError } = await supabase
            .from('users')
            .insert({
                id: supabaseUser.id,
                email: supabaseUser.email!,
                name: supabaseUser.user_metadata.name || 'New User', // Provide fallbacks
                role: supabaseUser.user_metadata.role || UserRole.Student,
                department: supabaseUser.user_metadata.department || 'Not Specified',
                level: supabaseUser.user_metadata.level || 100
            })
            .select()
            .single();

        if (insertError) {
            console.error('Fatal error: Could not auto-create user profile:', insertError);
            this.notificationService.show('Critical account error. Please contact support.', 'error', 7000);
            await this.logout(); // Logout to prevent being in a broken state
            return;
        }

        const userWithFaculty: User = {
            ...newUserProfile,
            faculty: this.findFacultyForDepartment(newUserProfile.department)
        };
        this.currentUser.set(userWithFaculty);
        this.notificationService.show('Welcome! Your profile has been initialized.', 'success');
      } else {
        // Should not happen if supabaseUser exists, but as a safeguard.
        this.currentUser.set(null);
      }
    } catch (error: any) {
        this.currentUser.set(null);
        console.error('Error fetching user profile:', error?.message);
        this.notificationService.show('A network error occurred. Please check your connection or ad-blocker and try again.', 'error', 5000);
        await this.logout(); // Gracefully log out if profile can't be fetched
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        this.notificationService.show(error.message, 'error');
        return;
      }

      this.notificationService.show('Login successful!', 'success');
      this.ngZone.run(() => this.router.navigate(['/dashboard']));
    } catch (error: any) {
      console.error('Login error:', error);
      this.notificationService.show('An unexpected error occurred during login. Please try again.', 'error');
    }
  }

  async register(name: string, email: string, password: string, department: string, role: UserRole, level: number, secretCode?: string): Promise<boolean> {
    try {
      if (role === UserRole.Admin && secretCode !== 'dataflix-admin-2026') {
        this.notificationService.show('Invalid Admin Secret Code.', 'error');
        return false;
      }

      // Pass user metadata directly during signup.
      // This is the recommended and most reliable approach. The backend trigger `handle_new_user`
      // will use this metadata to create the corresponding profile in the `users` table.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            department,
            role,
            level,
          },
        },
      });

      if (error) {
        this.notificationService.show(error.message, 'error');
        return false;
      }

      // Check if user was created but requires confirmation.
      // This is the standard flow when email confirmation is enabled.
      if (data.user && !data.session) {
        this.notificationService.show('Registration successful! Please check your email for verification before logging in.', 'success', 7000);
      } else if (data.user && data.session) {
        // This case might happen if email confirmation is disabled in Supabase settings.
        this.notificationService.show('Registration successful! You are now logged in.', 'success');
      } else {
        // Fallback for any other unexpected state
        this.notificationService.show('Registration process completed. Please check your email.', 'info');
      }
      
      this.ngZone.run(() => this.router.navigate(['/login']));
      return true;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      this.notificationService.show('An unexpected error occurred during registration. Please try again.', 'error');
      return false;
    }
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser.set(null);
    this.notificationService.show('You have been logged out.', 'info');
    this.ngZone.run(() => this.router.navigate(['/login']));
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === UserRole.Admin;
  }

  isSuperAdmin(): boolean {
    const superAdminEmails = [
      'abdullahioriola02@gmail.com',
      'sanuthquareeb@gmail.com',
      'mariamlawalajoke07@gmail.com'
    ];
    const currentUserEmail = this.currentUser()?.email;
    if (!currentUserEmail) {
      return false;
    }
    return superAdminEmails.includes(currentUserEmail);
  }

  async updateUserProfile(uid: string, data: { name: string; department: string; birthday: string | null; phone: string | null; level: number; }): Promise<boolean> {
    try {
      const { error } = await supabase
          .from('users')
          .update(data)
          .eq('id', uid);

      if (error) {
          this.notificationService.show(error.message, 'error');
          return false;
      }

      this.currentUser.update(currentUser => currentUser ? { ...currentUser, ...data } : null);
      this.notificationService.show('Profile updated successfully!', 'success');
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error);
      this.notificationService.show('An unexpected error occurred while updating your profile.', 'error');
      return false;
    }
  }

  async updateProfilePicture(user: User, file: File): Promise<boolean> {
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const photourl = data.publicUrl;

      const { error: dbError } = await supabase
        .from('users')
        .update({ photourl })
        .eq('id', user.id);
      
      if (dbError) {
        await supabase.storage.from('avatars').remove([filePath]);
        throw dbError;
      }

      this.currentUser.update(currentUser => currentUser ? { ...currentUser, photourl } : null);
      this.notificationService.show('Profile picture updated!', 'success');
      return true;
    } catch(error: any) {
      console.error('Error updating profile picture:', error);
      this.notificationService.show(error.message || 'Failed to update profile picture. Please try again.', 'error');
      return false;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/', // Supabase needs the full path including hash for SPA routing
      });
      if (error) {
        this.notificationService.show(error.message, 'error');
        return;
      }
      this.notificationService.show('Password reset link sent! Please check your email.', 'success', 5000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      this.notificationService.show('An unexpected error occurred. Please try again.', 'error');
    }
  }

  async updatePassword(password: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        this.notificationService.show(error.message, 'error');
        return;
      }
      this.notificationService.show('Password updated successfully! You can now log in with your new password.', 'success', 5000);
      this.ngZone.run(() => this.router.navigate(['/login']));
    } catch (error: any) {
      console.error('Update password error:', error);
      this.notificationService.show('An unexpected error occurred. Please try again.', 'error');
    }
  }
}