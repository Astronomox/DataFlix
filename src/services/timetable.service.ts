import { Injectable, inject } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableEntry {
  id: string;
  day: Day;
  time: string;
  course: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private notificationService = inject(NotificationService);
  
  async getTimetable(): Promise<TimetableEntry[]> {
    try {
      const { data, error } = await supabase
          .from('timetable')
          .select('*');

      if (error) throw error;
      return data as TimetableEntry[];
    } catch (error: any) {
      console.error("Error fetching timetable:", error.message);
      this.notificationService.show('Could not fetch timetable. Please check your network.', 'error');
      return [];
    }
  }

  async addEntry(entryData: Omit<TimetableEntry, 'id'>): Promise<TimetableEntry | null> {
    try {
      const { data, error } = await supabase
          .from('timetable')
          .insert(entryData)
          .select()
          .single();

      if (error) throw error;
      return data as TimetableEntry;
    } catch(error: any) {
        console.error("Error adding timetable entry:", error.message);
        this.notificationService.show('Could not add timetable entry. Please try again.', 'error');
        return null;
    }
  }

  async deleteEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
          .from('timetable')
          .delete()
          .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
        console.error("Error deleting timetable entry:", error.message);
        this.notificationService.show('Could not delete timetable entry. Please try again.', 'error');
        return false;
    }
  }
}
