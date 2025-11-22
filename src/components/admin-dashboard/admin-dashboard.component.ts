import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../services/admin.service';
import { MaterialsService, Material } from '../../services/materials.service';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  materialsService = inject(MaterialsService);
  announcementsService = inject(AnnouncementsService);
  authService = inject(AuthService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({ totalUsers: 0, studentCount: 0, adminCount: 0 });
  recentMaterials = signal<Material[]>([]);
  recentAnnouncements = signal<Announcement[]>([]);

  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading.set(true);
    try {
      const [stats, materials, announcements] = await Promise.all([
        this.adminService.getDashboardStats(),
        this.materialsService.getRecentMaterials(5),
        this.announcementsService.getRecentAnnouncements(5)
      ]);
      this.stats.set(stats);
      this.recentMaterials.set(materials);
      this.recentAnnouncements.set(announcements);
    } finally {
      this.isLoading.set(false);
    }
  }
}