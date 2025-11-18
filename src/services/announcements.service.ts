import { Injectable, inject, effect } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  department: string;
  level?: number;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private announcementsPromise: Promise<Announcement[]> | null = null;

  constructor() {
    effect(() => {
      // When current user changes (login/logout), clear the cache.
      this.authService.currentUser();
      this.announcementsPromise = null;
    });
  }

  async getAnnouncements(): Promise<Announcement[]> {
    if (this.announcementsPromise) {
      return this.announcementsPromise;
    }

    const user = this.authService.currentUser();
    if (!user) return [];

    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isSuperAdmin && !user.department) {
      this.notificationService.show('Could not determine your department.', 'error');
      return [];
    }
    
    this.announcementsPromise = (async () => {
      try {
        let query = supabase
          .from('announcements')
          .select('*');

        if (!isSuperAdmin) {
          query = query.eq('department', user.department!);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;
        return data as Announcement[];
      } catch (error: any) {
        console.error("Error fetching announcements:", error.message);
        this.notificationService.show('Could not fetch announcements. Please check your network.', 'error');
        this.announcementsPromise = null; // Clear promise on error to allow retries
        return [];
      }
    })();
    return this.announcementsPromise;
  }
  
  async createAnnouncement(title: string, content: string, author: string, department?: string, level?: number | ''): Promise<Announcement | null> {
    const user = this.authService.currentUser();
    const targetDepartment = department || user?.department;

    if (!targetDepartment) {
      this.notificationService.show('Could not determine a department to post the announcement to.', 'error');
      return null;
    }

    try {
      const newAnnouncementData = {
        title,
        content,
        author,
        date: new Date().toISOString(),
        department: targetDepartment,
        level: level || null
      };
      
      const { data, error } = await supabase
          .from('announcements')
          .insert(newAnnouncementData)
          .select()
          .single();
      
      if (error) throw error;

      this.announcementsPromise = null; // Invalidate cache
      return data as Announcement;
    } catch (error: any) {
      console.error("Error creating announcement:", error.message);
      this.notificationService.show('Could not post announcement. Please try again.', 'error');
      return null;
    }
  }

  async updateAnnouncement(id: string, updates: { title: string, content: string }): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.announcementsPromise = null; // Invalidate cache
      return data as Announcement;
    } catch (error: any) {
      console.error("Error updating announcement:", error.message);
      this.notificationService.show('Could not update announcement. Please try again.', 'error');
      return null;
    }
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.announcementsPromise = null; // Invalidate cache
      return true;
    } catch (error: any) {
      console.error("Error deleting announcement:", error.message);
      this.notificationService.show('Could not delete announcement. Please try again.', 'error');
      return false;
    }
  }
}