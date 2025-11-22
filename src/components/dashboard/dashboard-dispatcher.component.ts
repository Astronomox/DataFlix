import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardComponent } from './dashboard.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboard-dispatcher',
  standalone: true,
  imports: [CommonModule, DashboardComponent, AdminDashboardComponent],
  template: `
    @if (authService.isSuperAdmin()) {
      <app-admin-dashboard />
    } @else {
      <app-dashboard />
    }
  `,
})
export class DashboardDispatcherComponent {
  authService = inject(AuthService);
}