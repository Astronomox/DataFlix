import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { UNILAG_FACULTIES } from '../../data/unilag-courses';

@Component({
  selector: 'app-announcements',
  standalone: true,
  template: `
<div class="container mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Announcements</h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">Latest news and updates from the department.</p>
        </div>
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div class="relative w-full md:w-48">
              <select 
                (change)="onLevelChange($event)"
                [ngModel]="selectedLevel()"
                class="w-full pl-4 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                <option [ngValue]="null">All Levels</option>
                <option [value]="100">100 Level</option>
                <option [value]="200">200 Level</option>
                <option [value]="300">300 Level</option>
                <option [value]="400">400 Level</option>
                <option [value]="500">500 Level</option>
                <option [value]="600">600 Level</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          @if (isSuperAdmin) {
            <div class="relative w-full md:w-64">
              <select 
                (change)="onDepartmentChange($event)"
                class="w-full pl-4 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                <option value="">All Departments</option>
                @for(dept of allDepartments(); track dept) {
                  <option [value]="dept">{{dept}}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          }
        </div>
      </div>
      
      @if(isAdmin) {
        <div class="mb-8 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg">
          <h3 class="text-lg font-bold mb-4">Post a New Announcement</h3>
          <form (ngSubmit)="postAnnouncement()" #announcementForm="ngForm" class="space-y-4">
            @if (isSuperAdmin) {
              <div>
                <label for="departmentSelect" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post to Department</label>
                <div class="relative">
                  <select 
                    id="departmentSelect"
                    name="departmentForNewAnnouncement"
                    [(ngModel)]="departmentForNewAnnouncement"
                    required
                    class="w-full bg-white/20 dark:bg-gray-700/50 p-2.5 rounded-lg border border-white/30 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                    <option value="" disabled>Select a department</option>
                    <option [ngValue]="null">All Departments</option>
                    @for(dept of allDepartments(); track dept) {
                      <option [value]="dept" class="text-black dark:text-white bg-white dark:bg-gray-800">{{dept}}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            }
             <div>
                <label for="levelSelect" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Level</label>
                @if (isSuperAdmin) {
                 <select 
                    id="levelSelect"
                    name="levelForNewAnnouncement"
                    [(ngModel)]="newAnnouncement.level"
                    class="w-full bg-white/20 dark:bg-gray-700/50 p-2.5 rounded-lg border border-white/30 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option [ngValue]="null">All Levels</option>
                    <option [ngValue]="100">100 Level</option>
                    <option [ngValue]="200">200 Level</option>
                    <option [ngValue]="300">300 Level</option>
                    <option [ngValue]="400">400 Level</option>
                    <option [ngValue]="500">500 Level</option>
                    <option [ngValue]="600">600 Level</option>
                 </select>
                } @else {
                  <input type="text"
                    [value]="authService.currentUser()?.level + ' Level'"
                    disabled
                    class="w-full bg-white/10 dark:bg-gray-700/50 p-2.5 rounded-lg border border-white/30 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                }
              </div>
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
          @for(announcement of filteredAnnouncements(); track announcement.id) {
            <div class="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <h2 class="text-xl font-bold text-gray-800 dark:text-white">{{ announcement.title }}</h2>
              <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap gap-x-4 gap-y-2">
                <span>Posted by {{ announcement.author }} on {{ announcement.date | date: 'mediumDate' }}</span>
                @if(announcement.level) {
                  <span class="inline-block bg-green-200 text-green-800 font-semibold px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                    {{ announcement.level }} Level
                  </span>
                } @else if (announcement.level === null) {
                   <span class="inline-block bg-purple-200 text-purple-800 font-semibold px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
                    All Levels
                  </span>
                }
                @if(isSuperAdmin) {
                  <span class="font-semibold text-purple-600 dark:text-purple-400">| {{ announcement.department || 'All Departments' }}</span>
                }
              </div>
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ announcement.content }}</p>
              @if(isAdmin) {
                <div class="absolute top-4 right-4 flex items-center space-x-2">
                  <button (click)="openEditModal(announcement)" class="p-1 text-blue-500 hover:text-blue-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                  </button>
                  <button (click)="openDeleteModal(announcement)" class="p-1 text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                  </button>
                </div>
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

    <!-- Edit Announcement Modal -->
    @if (isEditModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" (click)="closeEditModal()">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Announcement</h3>
          <form (ngSubmit)="confirmEdit()" #editForm="ngForm" class="space-y-4">
            @if (isSuperAdmin) {
              <div>
                <label for="editDepartment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <select id="editDepartment" name="editDepartment" [(ngModel)]="editableAnnouncement.department" required
                        class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option [ngValue]="null">All Departments</option>
                  @for(dept of allDepartments(); track dept) {
                    <option [value]="dept">{{dept}}</option>
                  }
                </select>
              </div>
            }
            <div>
              <label for="editLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Level</label>
              @if (isSuperAdmin) {
                <select id="editLevel" name="editLevel" [(ngModel)]="editableAnnouncement.level"
                        class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option [ngValue]="null">All Levels</option>
                  <option [ngValue]="100">100 Level</option>
                  <option [ngValue]="200">200 Level</option>
                  <option [ngValue]="300">300 Level</option>
                  <option [ngValue]="400">400 Level</option>
                  <option [ngValue]="500">500 Level</option>
                  <option [ngValue]="600">600 Level</option>
                </select>
              } @else {
                  <input type="text"
                    [value]="authService.currentUser()?.level + ' Level'"
                    disabled
                    class="w-full bg-gray-200 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed">
              }
            </div>
            <div>
              <label for="editTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input type="text" id="editTitle" name="editTitle" [(ngModel)]="editableAnnouncement.title" required
                class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
            </div>
            <div>
              <label for="editContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
              <textarea id="editContent" name="editContent" [(ngModel)]="editableAnnouncement.content" required rows="6"
                class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"></textarea>
            </div>
            <div class="flex justify-end space-x-4 pt-4">
              <button type="button" (click)="closeEditModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button type="submit" [disabled]="editForm.invalid" class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    }

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
  isSuperAdmin = this.authService.isSuperAdmin();
  
  private announcements = signal<Announcement[]>([]);
  allDepartments = signal<string[]>([]);
  selectedDepartment = signal('');
  selectedLevel = signal<number | null>(null);

  // Delete modal state
  isDeleteModalOpen = signal(false);
  announcementToDelete = signal<Announcement | null>(null);
  
  // Edit modal state
  isEditModalOpen = signal(false);
  announcementToEdit = signal<Announcement | null>(null);
  editableAnnouncement = { title: '', content: '', level: null as number | null, department: null as string | null };

  newAnnouncement = {
    title: '',
    content: '',
    level: null as number | null,
  };
  departmentForNewAnnouncement: string | null = '';

  filteredAnnouncements = computed(() => {
    const dept = this.selectedDepartment();
    const level = this.selectedLevel();
    let announcements = this.announcements();

    if (this.isSuperAdmin && dept) {
      announcements = announcements.filter(a => a.department === dept);
    }

    if (level) {
      // Strictly filter by the selected level. Announcements for "All Levels" are not included.
      announcements = announcements.filter(a => a.level === level);
    }
    
    return announcements;
  });

  ngOnInit() {
    this.loadAnnouncements();
    if (this.isSuperAdmin) {
      const depts = UNILAG_FACULTIES.flatMap(f => f.courses);
      this.allDepartments.set([...new Set(depts)].sort());
      this.newAnnouncement.level = null; // Super Admin can post to all levels by default
    } else {
      const userLevel = this.authService.currentUser()?.level ?? null;
      // Default filter to user's level
      this.selectedLevel.set(userLevel);
      // For basic admins, pre-fill and lock their level for new announcements
      if (this.isAdmin) {
          this.newAnnouncement.level = userLevel ?? 100;
      }
    }
  }

  loadAnnouncements() {
    this.isLoading.set(true);
    this.announcementsService.getAnnouncements().then(data => {
      this.announcements.set(data);
      this.isLoading.set(false);
    });
  }

  onDepartmentChange(event: Event) {
    this.selectedDepartment.set((event.target as HTMLSelectElement).value);
  }

  onLevelChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLevel.set(value ? Number(value) : null);
  }

  postAnnouncement() {
    const user = this.authService.currentUser();
    if (!user) return;

    const author = user.name || 'Admin';
    
    const departmentForPost = this.isSuperAdmin
      ? this.departmentForNewAnnouncement
      : user.department;

    if (this.isSuperAdmin && departmentForPost === '') {
      this.notificationService.show('Please select a department or "All Departments" to post the announcement to.', 'warning');
      return;
    }
    
    const levelForPost = (this.isAdmin && !this.isSuperAdmin)
      ? user.level
      : this.newAnnouncement.level;

    this.announcementsService.createAnnouncement(this.newAnnouncement.title, this.newAnnouncement.content, author, departmentForPost, levelForPost)
      .then(announcement => {
        if (announcement) {
          this.announcements.update(list => [announcement, ...list]);
          this.notificationService.show('Announcement posted!', 'success');
          // Reset form
          this.newAnnouncement.title = '';
          this.newAnnouncement.content = '';
          this.newAnnouncement.level = (this.isAdmin && !this.isSuperAdmin) ? (user.level) : null;
          if (this.isSuperAdmin) {
            this.departmentForNewAnnouncement = '';
          }
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

  // --- Edit Modal Methods ---
  openEditModal(announcement: Announcement) {
    this.announcementToEdit.set(announcement);
    this.editableAnnouncement.title = announcement.title;
    this.editableAnnouncement.content = announcement.content;
    this.editableAnnouncement.level = announcement.level ?? null;
    this.editableAnnouncement.department = announcement.department ?? null;
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.announcementToEdit.set(null);
  }

  async confirmEdit() {
    const user = this.authService.currentUser();
    const announcement = this.announcementToEdit();
    if (!announcement || !user || !this.editableAnnouncement.title || !this.editableAnnouncement.content) {
        this.notificationService.show('Title and Content cannot be empty.', 'warning');
        return;
    }

    const updates: Partial<Omit<Announcement, 'id'>> = {
        title: this.editableAnnouncement.title,
        content: this.editableAnnouncement.content,
    };

    if (this.isSuperAdmin) {
        updates.level = this.editableAnnouncement.level;
        updates.department = this.editableAnnouncement.department;
    } else {
        // For basic admins, force the level and department to be their own.
        updates.level = user.level;
        updates.department = user.department;
    }
    
    const updatedAnnouncement = await this.announcementsService.updateAnnouncement(announcement.id, updates);

    if (updatedAnnouncement) {
        this.announcements.update(list => list.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
        this.notificationService.show('Announcement updated successfully.', 'success');
        this.closeEditModal();
    }
  }
}