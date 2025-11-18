import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { UNILAG_FACULTIES, Faculty } from '../../data/unilag-courses';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  currentUser = this.authService.currentUser;

  isEditing = signal(false);
  isLoading = signal(false);
  isUploading = signal(false);
  
  faculties: Faculty[] = UNILAG_FACULTIES;
  selectedFaculty = signal<Faculty | null>(null);
  levels = [100, 200, 300, 400, 500, 600];

  // Form model for editing
  editableUser = {
    name: '',
    department: '',
    birthday: '',
    phone: '',
    level: 100
  };

  userAvatarUrl = computed(() => {
    const user = this.currentUser();
    if (user?.photourl) {
      return user.photourl;
    }
    const name = user?.name.replace(' ', '+') || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=6D28D9&color=fff&size=128&bold=true`;
  });

  private findFacultyForDepartment(department: string): Faculty | null {
    return this.faculties.find(f => f.courses.includes(department)) || null;
  }

  startEditing(): void {
    const user = this.currentUser();
    if (user) {
      this.editableUser.name = user.name;
      this.editableUser.department = user.department;
      this.editableUser.birthday = user.birthday || '';
      this.editableUser.phone = user.phone || '';
      this.editableUser.level = user.level;
      this.selectedFaculty.set(this.findFacultyForDepartment(user.department));
      this.isEditing.set(true);
    }
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.selectedFaculty.set(null);
  }

  async saveProfile(): Promise<void> {
    const user = this.currentUser();
    if (!user || !this.editableUser.name) {
      this.notificationService.show('Name cannot be empty.', 'error');
      return;
    }

    this.isLoading.set(true);
    const dataToSave = {
      name: this.editableUser.name,
      department: this.editableUser.department,
      birthday: this.editableUser.birthday || null,
      phone: this.editableUser.phone || null,
      level: this.editableUser.level,
    };
    const success = await this.authService.updateUserProfile(user.id, dataToSave);
    
    if (success) {
      this.isEditing.set(false);
    }
    this.isLoading.set(false);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const user = this.currentUser();

    if (file && user) {
      this.isUploading.set(true);
      await this.authService.updateProfilePicture(user, file);
      this.isUploading.set(false);
    }
  }
}