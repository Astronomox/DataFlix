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
  selectedLevel = signal<number | null>(null);
  selectedCourse = signal<string>('');
  selectedLocation = signal<string>('');

  // Delete modal state
  isDeleteModalOpen = signal(false);
  entryToDelete = signal<TimetableEntry | null>(null);

  // Edit modal state
  isEditModalOpen = signal(false);
  entryToEdit = signal<TimetableEntry | null>(null);
  editableEntry: Partial<Omit<TimetableEntry, 'id'>> = {
    course: '',
    time: '',
    location: '',
    day: 'Monday',
    level: null,
    department: '',
  };

  newEntry: Omit<TimetableEntry, 'id' | 'department'> = {
    course: '',
    time: '',
    location: '',
    day: 'Monday',
    level: null,
  };
  departmentForNewEntry = signal<string | null>('');

  readonly weekdays: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  courses = computed(() => {
    const allCourses = this.timetable().map(entry => entry.course);
    return [...new Set(allCourses)].sort();
  });

  locations = computed(() => {
    const allLocations = this.timetable().map(entry => entry.location);
    return [...new Set(allLocations)].sort();
  });

  isAnyFilterActive = computed(() => this.selectedDepartment() !== '' || this.selectedLevel() !== null || this.selectedCourse() !== '' || this.selectedLocation() !== '');

  filteredTimetable = computed(() => {
    let filtered = this.timetable();
    const course = this.selectedCourse();
    const location = this.selectedLocation();
    const dept = this.selectedDepartment();
    const level = this.selectedLevel();

    if (this.isSuperAdmin && dept) {
      filtered = filtered.filter(entry => entry.department === dept);
    }
    if (level) {
      filtered = filtered.filter(entry => entry.level === level || !entry.level);
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
    const user = this.authService.currentUser();
    if (this.isSuperAdmin) {
      const depts = UNILAG_FACULTIES.flatMap(f => f.courses);
      this.allDepartments.set([...new Set(depts)].sort());
      this.newEntry.level = null; // Super Admin can post to all levels by default
    } else {
      const userLevel = user?.level ?? null;
      // Default filter to user's level
      this.selectedLevel.set(userLevel);
      // For basic admins, pre-fill and lock their level for new entries
      if (this.isAdmin) {
          this.newEntry.level = user?.level ?? 100;
      }
    }
  }

  async loadTimetable() {
    this.isLoading.set(true);
    const data = await this.timetableService.getTimetable();
    this.timetable.set(data);
    this.isLoading.set(false);
  }

  async addEntry() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.newEntry.course || !this.newEntry.time || !this.newEntry.location || !this.newEntry.day) {
        this.notificationService.show('All fields are required.', 'warning');
        return;
    }
    
    const departmentForPost = this.isSuperAdmin ? this.departmentForNewEntry() : user.department;

    if (this.isSuperAdmin && departmentForPost === '') {
      this.notificationService.show('Please select a department or "All Departments" for the new entry.', 'warning');
      return;
    }

    const entryData = { ...this.newEntry };
    if (this.isAdmin && !this.isSuperAdmin) {
      entryData.level = user.level;
    }

    const addedEntry = await this.timetableService.addEntry(entryData, departmentForPost);
    if (addedEntry) {
      this.timetable.update(entries => [...entries, addedEntry]);
      this.notificationService.show('Entry added successfully!', 'success');
      // Reset form
      const defaultLevel = (this.isAdmin && !this.isSuperAdmin) ? user.level : null;
      this.newEntry = { course: '', time: '', location: '', day: 'Monday', level: defaultLevel };
      if (this.isSuperAdmin) {
        this.departmentForNewEntry.set('');
      }
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

  onLevelChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLevel.set(value ? Number(value) : null);
