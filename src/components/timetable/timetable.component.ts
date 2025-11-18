import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableService, TimetableEntry, Day } from '../../services/timetable.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { UNILAG_FACULTIES } from '../../data/unilag-courses';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableComponent implements OnInit {
  timetableService = inject(TimetableService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  isLoading = signal(true);
  isAdmin = this.authService.isAdmin();
  isSuperAdmin = this.authService.isSuperAdmin();
  timetable = signal<TimetableEntry[]>([]);
  
  allDepartments = signal<string[]>([]);
  selectedDepartment = signal<string>('');
  selectedCourse = signal<string>('');
  selectedLocation = signal<string>('');

  // Delete modal state
  isDeleteModalOpen = signal(false);
  entryToDelete = signal<TimetableEntry | null>(null);

  newEntry: Omit<TimetableEntry, 'id' | 'department'> = {
    course: '',
    time: '',
    location: '',
    day: 'Monday',
  };

  readonly weekdays: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  courses = computed(() => {
    const allCourses = this.timetable().map(entry => entry.course);
    return [...new Set(allCourses)].sort();
  });

  locations = computed(() => {
    const allLocations = this.timetable().map(entry => entry.location);
    return [...new Set(allLocations)].sort();
  });

  isAnyFilterActive = computed(() => this.selectedDepartment() !== '' || this.selectedCourse() !== '' || this.selectedLocation() !== '');

  filteredTimetable = computed(() => {
    let filtered = this.timetable();
    const course = this.selectedCourse();
    const location = this.selectedLocation();
    const dept = this.selectedDepartment();

    if (this.isSuperAdmin && dept) {
      filtered = filtered.filter(entry => entry.department === dept);
    }
    if (course) {
      filtered = filtered.filter(entry => entry.course === course);
    }
    if (location) {
      filtered = filtered.filter(entry => entry.location === location);
    }

    // Group by day for easier rendering
    return this.weekdays.reduce((acc, day) => {
      acc[day] = filtered
        .filter(entry => entry.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
      return acc;
    }, {} as Record<Day, TimetableEntry[]>);
  });

  // FIX: Removed duplicate 'showNoFilterResultsMessage' property.
  showNoFilterResultsMessage = computed(() => {
    return this.timetable().length > 0 && 
           this.isAnyFilterActive() && 
           // Fix: Explicitly type `day` to resolve `unknown` type error from `Object.values`.
           Object.values(this.filteredTimetable()).every((day: TimetableEntry[]) => day.length === 0);
  });

  ngOnInit() {
    this.loadTimetable();
    if (this.isSuperAdmin) {
      const depts = UNILAG_FACULTIES.flatMap(f => f.courses);
      this.allDepartments.set([...new Set(depts)].sort());
    }
  }

  async loadTimetable() {
    this.isLoading.set(true);
    const data = await this.timetableService.getTimetable();
    this.timetable.set(data);
    this.isLoading.set(false);
  }

  async addEntry() {
    if (!this.newEntry.course || !this.newEntry.time || !this.newEntry.location || !this.newEntry.day) {
        this.notificationService.show('All fields are required.', 'warning');
        return;
    }
    const addedEntry = await this.timetableService.addEntry(this.newEntry);
    if (addedEntry) {
      this.timetable.update(entries => [...entries, addedEntry]);
      this.notificationService.show('Entry added successfully!', 'success');
      // Reset form
      this.newEntry = { course: '', time: '', location: '', day: 'Monday' };
    }
  }

  private async deleteEntry(id: string) {
    const success = await this.timetableService.deleteEntry(id);
    if (success) {
      this.timetable.update(entries => entries.filter(entry => entry.id !== id));
      this.notificationService.show('Entry deleted successfully.', 'success');
    }
  }

  onDepartmentChange(event: Event) {
    this.selectedDepartment.set((event.target as HTMLSelectElement).value);
  }

  onCourseChange(event: Event) {
    this.selectedCourse.set((event.target as HTMLSelectElement).value);
  }

  onLocationChange(event: Event) {
    this.selectedLocation.set((event.target as HTMLSelectElement).value);
  }

  clearFilters() {
    this.selectedDepartment.set('');
    this.selectedCourse.set('');
    this.selectedLocation.set('');
    // Need to reset the dropdowns manually if they are not bound with ngModel
    if (this.isSuperAdmin) {
      (document.getElementById('departmentFilter') as HTMLSelectElement).value = '';
    }
    (document.getElementById('courseFilter') as HTMLSelectElement).value = '';
    (document.getElementById('locationFilter') as HTMLSelectElement).value = '';
  }

  // --- Delete Modal Methods ---
  openDeleteModal(entry: TimetableEntry) {
    this.entryToDelete.set(entry);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.entryToDelete.set(null);
  }

  confirmDelete() {
    const entry = this.entryToDelete();
    if (entry) {
      this.deleteEntry(entry.id);
    }
    this.closeDeleteModal();
  }
}
