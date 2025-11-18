import { Injectable, inject, effect } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableEntry {
  id: string;
  day: Day;
  time: string;
  course: string;
  location: string;
  department: string;
  level?: number | null;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private timetablePromise: Promise<TimetableEntry[]> | null = null;

  constructor() {
    effect(() => {
      // When current user changes (login/logout), clear the cache.
      this.authService.currentUser();
      this.timetablePromise = null;
    });
  }
  
  async getTimetable(): Promise<TimetableEntry[]> {
    if (this.timetablePromise) {
      return this.timetablePromise;
    }

    const user = this.authService.currentUser();
    if (!user) return [];

    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isSuperAdmin && !user.department) {
      this.notificationService.show('Could not determine your department.', 'error');
      return [];
    }

    this.timetablePromise = (async () => {
      try {
        let query = supabase
            .from('timetable')
            .select('*');

        if (!isSuperAdmin) {
          query = query.eq('department', user.department!);
        }
        
        const { data, error } = await query;

        if (error) throw error;
        return data as TimetableEntry[];
      } catch (error: any) {
        console.error("Error fetching timetable:", error.message);
        this.notificationService.show('Could not fetch timetable. Please check your network.', 'error');
        this.timetablePromise = null; // Clear promise on error to allow retries
        return [];
      }
    })();
    return this.timetablePromise;
  }

  async addEntry(entryData: Omit<TimetableEntry, 'id' | 'department'>, department?: string): Promise<TimetableEntry | null> {
    const user = this.authService.currentUser();
    const targetDepartment = department || user?.department;

    if (!targetDepartment) {
      this.notificationService.show('Could not determine a department for the timetable entry.', 'error');
      return null;
    }

    try {
      const dataToInsert = {
        ...entryData,
        department: targetDepartment,
        level: entryData.level || null,
      };

      const { data, error } = await supabase
          .from('timetable')
          .insert(dataToInsert)
          .select()
          .single();

      if (error) throw error;

      this.timetablePromise = null; // Invalidate cache
      return data as TimetableEntry;
    } catch(error: any) {
        console.error("Error adding timetable entry:", error.message);
        this.notificationService.show('Could not add timetable entry. Please try again.', 'error');
        return null;
    }
  }

  async updateEntry(id: string, entryData: Partial<Omit<TimetableEntry, 'id' | 'department'>>): Promise<TimetableEntry | null> {
    try {
      const dataToUpdate = { ...entryData };
      if (dataToUpdate.level === undefined) {
        dataToUpdate.level = null;
      }

      const { data, error } = await supabase
        .from('timetable')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.timetablePromise = null; // Invalidate cache
      return data as TimetableEntry;
    } catch (error: any) {
      console.error("Error updating timetable entry:", error.message);
      this.notificationService.show('Could not update timetable entry. Please try again.', 'error');
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

      this.timetablePromise = null; // Invalidate cache
      return true;
    } catch (error: any) {
        console.error("Error deleting timetable entry:", error.message);
        this.notificationService.show('Could not delete timetable entry. Please try again.', 'error');
        return false;
    }
  }
}