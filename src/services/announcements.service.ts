import { Injectable, inject } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private notificationService = inject(NotificationService);

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    } catch (error: any) {
      console.error("Error fetching announcements:", error.message);
      this.notificationService.show('Could not fetch announcements. Please check your network.', 'error');
      return [];
    }
  }
  
  async createAnnouncement(title: string, content: string, author: string): Promise<Announcement | null> {
    try {
      const newAnnouncementData = {
        title,
        content,
        author,
        date: new Date().toISOString(),
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
