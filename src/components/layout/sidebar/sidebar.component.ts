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
    { path: '/dashboard', icon: 'home', name: 'Dashboard' },
    { path: '/ai-briefing', icon: 'sparkle', name: 'Daily Briefing' },
    { path: '/materials', icon: 'book-open', name: 'Course Materials' },
    { path: '/timetable', icon: 'calendar', name: 'Timetable' },
    { path: '/announcements', icon: 'megaphone', name: 'Announcements' },
    { path: '/profile', icon: 'user', name: 'Profile' },
    { path: '/contact', icon: 'mail', name: 'Contact Us' },
  ];
}