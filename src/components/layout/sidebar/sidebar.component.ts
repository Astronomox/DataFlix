import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isOpen = input.required<boolean>();

  navLinks = [
    { path: '/dashboard', icon: 'layout-dashboard', name: 'Dashboard' },
    { path: '/ai-briefing', icon: 'sparkle', name: 'Daily Briefing' },
    { path: '/materials', icon: 'graduation-cap', name: 'Course Materials' },
    { path: '/timetable', icon: 'calendar-days', name: 'Timetable' },
    { path: '/announcements', icon: 'volume-2', name: 'Announcements' },
    { path: '/profile', icon: 'user-circle', name: 'Profile' },
    { path: '/contact', icon: 'mail', name: 'Contact Us' },
  ];
}
