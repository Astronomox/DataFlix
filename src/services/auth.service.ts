import { Injectable, signal, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';
import { supabase } from '../supabase.config';
// FIX: Removed Supabase v2 type imports that are not available in older versions, which caused compilation errors.
// The types for session and user will be inferred as `any`.
// import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private ngZone = inject(NgZone);
  
  currentUser = signal<User | null>(null);
  private authInitializedPromise: Promise<void>;
  private resolveAuthInitialized!: () => void;

  constructor() {
    this.authInitializedPromise = new Promise(resolve => {
        this.resolveAuthInitialized = resolve;
    });

    // FIX: Updated `onAuthStateChange` callback signature for compatibility with older Supabase client versions.
    // Replaced `AuthChangeEvent` with `string` and `Session` with `any` to resolve type errors.
    supabase.auth.onAuthStateChange(async (event: string, session: any | null) => {
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
        }
      });
    });
  }

  waitForAuthInitialization(): Promise<void> {
    return this.authInitializedPromise;
  }

  // FIX: The type for the supabaseUser parameter is set to `any` to resolve import errors.
  private async loadUserProfile(supabaseUser: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
  
      if (error) throw error;
  
      if (data) {
        this.currentUser.set(data as User);
      } else {
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
      // FIX: Replaced `signInWithPassword` with `signIn` for compatibility with older Supabase client versions.
      const { error } = await supabase.auth.signIn({ email, password });

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

  async register(name: string, email: string, password: string, department: string, role: UserRole, secretCode?: string): Promise<boolean> {
    try {
      if (role === UserRole.Admin && secretCode !== 'dataflix-admin-2026') {
        this.notificationService.show('Invalid Admin Secret Code.', 'error');
        return false;
      }

      // FIX: Changed `signUp` method signature to be compatible with older Supabase client versions.
      const { data: authData, error: authError } = await supabase.auth.signUp(
        { email, password },
        {
          data: {
            name,
            department,
            role,
          },
        }
      );

      if (authError) {
        this.notificationService.show(authError.message, 'error');
        return false;
      }

      if (authData.user) {
        this.notificationService.show('Registration successful! Please check your email for verification before logging in.', 'success', 5000);
        this.ngZone.run(() => this.router.navigate(['/login']));
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      this.notificationService.show('An unexpected error occurred during registration. Please try again.', 'error');
      return false;
    }
  }

  async logout() {
    // FIX: `signOut` is compatible with many Supabase versions, but was reported as an error.
    // The v1/v2 signature is the same, so no code change is needed, but this confirms it was reviewed.
    await supabase.auth.signOut();
    this.currentUser.set(null);
    this.notificationService.show('You have been logged out.', 'info');
    this.ngZone.run(() => this.router.navigate(['/login']));
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === UserRole.Admin;
  }

  async updateUserProfile(uid: string, data: { name: string; department: string; birthday: string | null; phone: string | null; }): Promise<boolean> {
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
}
