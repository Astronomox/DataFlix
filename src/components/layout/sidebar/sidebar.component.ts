import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
<aside
  class="w-64 bg-white dark:bg-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out
         fixed inset-y-0 left-0 z-40 transform"
  [class.translate-x-0]="isOpen()"
  [class.-translate-x-full]="!isOpen()"
  [class.p-4]="isOpen()">
  
  <div class="py-4 text-gray-500 dark:text-gray-400" [class.hidden]="!isOpen()">
    <a class="ml-6 text-lg font-bold text-gray-800 dark:text-gray-200" href="#">
      DataFlix
    </a>
    <ul class="mt-6">
      @for (link of navLinks; track link.path) {
        <li class="relative px-2">
          <a
            [routerLink]="link.path"
            routerLinkActive="text-gray-800 dark:text-gray-100 bg-purple-50 dark:bg-gray-700"
            [routerLinkActiveOptions]="{ exact: true }"
            class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg p-4">
            <span
              class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg"
              aria-hidden="true"
              [routerLinkActive]="'block'"
              [routerLinkActiveOptions]="{ exact: true }"
              class="hidden"
            ></span>
            
            <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">
              @if (link.icon === 'layout-dashboard') {
                <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path><path d="M22 3v5h-5"></path>
              }
              @if (link.icon === 'graduation-cap') {
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0l8.59-3.908Z"></path><path d="M6 12v4c0 4.5 3 5 6 5s6-.5 6-5v-4"></path>
              }
              @if (link.icon === 'calendar-days') {
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>
              }
              @if (link.icon === 'volume-2') {
                <path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              }
              @if (link.icon === 'user-circle') {
                <path d="M18 20a6 6 0 0 0-12 0"></path><circle cx="12" cy="10" r="4"></circle><circle cx="12" cy="12" r="10"></circle>
              }
              @if (link.icon === 'mail') {
                <rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              }
              @if (link.icon === 'sparkle') {
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              }
            </svg>
            <span class="ml-4">{{ link.name }}</span>
          </a>
        </li>
      }
    </ul>
  </div>
</aside>
`,
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
