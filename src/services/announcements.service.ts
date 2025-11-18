import { Injectable, inject } from '@angular/core';
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
}

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  async getAnnouncements(): Promise<Announcement[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isSuperAdmin && !user.department) {
      this.notificationService.show('Could not determine your department.', 'error');
      return [];
    }
    
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
      return [];
    }
  }
  
  async createAnnouncement(title: string, content: string, author: string, department?: string): Promise<Announcement | null> {
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
        department: targetDepartment
      };
      
      const { data, error } = await supabase
          .from('announcements')
          .insert(newAnnouncementData)
          .select()
          .single();
      
      if (error) throw error;
      return data as Announcement;
    } catch (error: any) {
      console.error("Error creating announcement:", error.message);
      this.notificationService.show('Could not post announcement. Please try again.', 'error');
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
      return true;
    } catch (error: any) {
      console.error("Error deleting announcement:", error.message);
      this.notificationService.show('Could not delete announcement. Please try again.', 'error');
      return false;
    }
  }
}