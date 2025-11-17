import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-announcements',
  template: `
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Announcements</h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">Latest news and updates from the department.</p>
        </div>
      </div>
      
      @if(isAdmin) {
        <div class="mb-8 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg">
          <h3 class="text-lg font-bold mb-4">Post a New Announcement</h3>
          <form (ngSubmit)="postAnnouncement()" #announcementForm="ngForm" class="space-y-4">
            <input type="text" placeholder="Title" [(ngModel)]="newAnnouncement.title" name="title" required class="w-full bg-white/20 dark:bg-gray-700/50 p-2 rounded-lg border border-white/30 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <textarea placeholder="Content..." [(ngModel)]="newAnnouncement.content" name="content" required rows="4" class="w-full bg-white/20 dark:bg-gray-700/50 p-2 rounded-lg border border-white/30 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            <button type="submit" [disabled]="announcementForm.invalid" class="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">Post Announcement</button>
          </form>
        </div>
      }

      @if(isLoading()) {
        <div class="flex justify-center items-center p-16">
          <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      } @else {
        <div class="space-y-6">
          @for(announcement of announcements(); track announcement.id) {
            <div class="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-800 dark:text-white">{{ announcement.title }}</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Posted by {{ announcement.author }} on {{ announcement.date | date: 'mediumDate' }}</p>
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ announcement.content }}</p>
              @if(isAdmin) {
                <button (click)="openDeleteModal(announcement)" class="absolute top-4 right-4 text-red-500 hover:text-red-700">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                </button>
              }
            </div>
          } @empty {
            <div class="mt-8 p-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg text-center">
              <svg class="w-16 h-16 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
              <h2 class="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">No Announcements Yet</h2>
              <p class="mt-2 text-gray-500 dark:text-gray-400">Check back later for updates from the department.</p>
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete Confirmation Modal -->
    @if (isDeleteModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" (click)="closeDeleteModal()">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="flex items-center">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-bold text-gray-900 dark:text-white">Delete Announcement</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <span class="font-semibold">"{{ announcementToDelete()?.title }}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button (click)="confirmDelete()" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">
              Confirm Delete
            </button>
            <button (click)="closeDeleteModal()" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
  `,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent implements OnInit {
  announcementsService = inject(AnnouncementsService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  isLoading = signal(true);
  isAdmin = this.authService.isAdmin();
  announcements = signal<Announcement[]>([]);

  // Delete modal state
  isDeleteModalOpen = signal(false);
  announcementToDelete = signal<Announcement | null>(null);
  
  newAnnouncement = {
    title: '',
    content: ''
  };

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.isLoading.set(true);
    this.announcementsService.getAnnouncements().then(data => {
      this.announcements.set(data);
      this.isLoading.set(false);
    });
  }

  postAnnouncement() {
    const author = this.authService.currentUser()?.name || 'Admin';
    this.announcementsService.createAnnouncement(this.newAnnouncement.title, this.newAnnouncement.content, author)
      .then(announcement => {
        if (announcement) {
          this.announcements.update(list => [announcement, ...list]);
          this.notificationService.show('Announcement posted!', 'success');
          this.newAnnouncement.title = '';
          this.newAnnouncement.content = '';
        }
      });
  }

  private deleteAnnouncement(id: string) {
    this.announcementsService.deleteAnnouncement(id).then((success) => {
      if(success) {
        this.announcements.update(list => list.filter(a => a.id !== id));
        this.notificationService.show('Announcement deleted.', 'success');
      }
    });
  }

  // --- Delete Modal Methods ---
  openDeleteModal(announcement: Announcement) {
    this.announcementToDelete.set(announcement);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.announcementToDelete.set(null);
  }

  confirmDelete() {
    const announcement = this.announcementToDelete();
    if (announcement) {
      this.deleteAnnouncement(announcement.id);
    }
    this.closeDeleteModal();
  }
}