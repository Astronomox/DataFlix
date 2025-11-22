import { Injectable, inject } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';

export interface DashboardStats {
  totalUsers: number;
  studentCount: number;
  adminCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private notificationService = inject(NotificationService);

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      const totalUsers = count ?? 0;

      // To get specific role counts, we need another query as RLS prevents full table scans on specifics.
      // This will require a specific policy for admins.
      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role');
      
      if (roleError) throw roleError;

      const studentCount = roleData.filter(u => u.role === 'student').length;
      const adminCount = roleData.filter(u => u.role === 'admin').length;

      return { totalUsers, studentCount, adminCount };

    } catch (error: any) {
      console.error("Error fetching admin stats:", error.message);
      this.notificationService.show('Could not fetch dashboard statistics.', 'error');
      return { totalUsers: 0, studentCount: 0, adminCount: 0 };
    }
  }
}