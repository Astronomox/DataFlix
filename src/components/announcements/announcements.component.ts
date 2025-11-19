import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { UNILAG_FACULTIES } from '../../data/unilag-courses';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
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
  editableAnnouncement = { title: '', content: '', level: null as number | null };

  newAnnouncement = {
    title: '',
    content: '',
    level: null as number | null,
  };
  departmentForNewAnnouncement = '';

  filteredAnnouncements = computed(() => {
    const dept = this.selectedDepartment();
    const level = this.selectedLevel();
    let announcements = this.announcements();

    if (this.isSuperAdmin && dept) {
      announcements = announcements.filter(a => a.department === dept);
    }

    if (level) {
      // Show announcements for the specific level OR announcements for all levels
      announcements = announcements.filter(a => a.level === level || !a.level);
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
    const author = this.authService.currentUser()?.name || 'Admin';
    const department = this.isSuperAdmin ? this.departmentForNewAnnouncement : undefined;

    if (this.isSuperAdmin && !department) {
      this.notificationService.show('Please select a department to post the announcement to.', 'warning');
      return;
    }

    this.announcementsService.createAnnouncement(this.newAnnouncement.title, this.newAnnouncement.content, author, department, this.newAnnouncement.level)
      .then(announcement => {
        if (announcement) {
          this.announcements.update(list => [announcement, ...list]);
          this.notificationService.show('Announcement posted!', 'success');
          // Reset form
          this.newAnnouncement.title = '';
          this.newAnnouncement.content = '';
          this.newAnnouncement.level = (this.isAdmin && !this.isSuperAdmin) ? (this.authService.currentUser()?.level ?? 100) : null;
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
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.announcementToEdit.set(null);
  }

  async confirmEdit() {
    const announcement = this.announcementToEdit();
    if (!announcement || !this.editableAnnouncement.title || !this.editableAnnouncement.content) {
        this.notificationService.show('Title and Content cannot be empty.', 'warning');
        return;
    }
    
    const updatedAnnouncement = await this.announcementsService.updateAnnouncement(announcement.id, {
        title: this.editableAnnouncement.title,
        content: this.editableAnnouncement.content,
        level: this.editableAnnouncement.level,
    });

    if (updatedAnnouncement) {
        this.announcements.update(list => list.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
        this.notificationService.show('Announcement updated successfully.', 'success');
        this.closeEditModal();
    }
  }
}