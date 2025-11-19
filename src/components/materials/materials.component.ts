import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { MaterialsService, Material } from '../../services/materials.service';
// FIX: Import `Faculty` type to resolve type inference issues.
import { UNILAG_FACULTIES, Faculty } from '../../data/unilag-courses';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialsComponent implements OnInit {
  // FIX: Add explicit types for injected services to prevent 'unknown' type errors.
  authService: AuthService = inject(AuthService);
  notificationService: NotificationService = inject(NotificationService);
  materialsService: MaterialsService = inject(MaterialsService);
  
  isAdmin = this.authService.isAdmin();
  isSuperAdmin = this.authService.isSuperAdmin();
  isLoading = signal(true);
  searchTerm = signal('');
  selectedDepartment = signal('');
  selectedLevel = signal<number | null>(null);
  allDepartments = signal<string[]>([]);

  // Upload modal state
  isUploadModalOpen = signal(false);
  fileToUpload = signal<File | null>(null);
  newMaterialTitle = signal('');
  newMaterialCourse = signal('');
  newMaterialDepartment = signal('');
  newMaterialLevel = signal<number | null>(null);

  // Delete modal state
  isDeleteModalOpen = signal(false);
  materialToDelete = signal<Material | null>(null);

  private allMaterials = signal<Material[]>([]);

  filteredMaterials = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const dept = this.selectedDepartment();
    const level = this.selectedLevel();
    let materials = this.allMaterials();

    if (this.isSuperAdmin && dept) {
      materials = materials.filter(m => m.department === dept);
    }
    
    if (level) {
      materials = materials.filter(m => m.level === level);
    }

    if (!term) {
      return materials;
    }
    return materials.filter(
      material =>
        material.title.toLowerCase().includes(term) ||
        material.course.toLowerCase().includes(term)
    );
  });
  
  ngOnInit() {
    this.loadMaterials();
    if (this.isSuperAdmin) {
      // FIX: Add explicit type to flatMap callback parameter to resolve 'unknown[]' type error.
      const depts = UNILAG_FACULTIES.flatMap((f: Faculty) => f.courses);
      this.allDepartments.set([...new Set(depts)].sort());
    } else {
      // Default filter to student's level
      this.selectedLevel.set(this.authService.currentUser()?.level ?? null);
    }
  }

  loadMaterials() {
    this.isLoading.set(true);
    this.materialsService.getMaterials().then(materials => {
      this.allMaterials.set(materials);
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

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileToUpload.set(file);
      this.newMaterialTitle.set(file.name.replace(/\.[^/.]+$/, ""));
      this.newMaterialCourse.set('');
      this.newMaterialDepartment.set('');
      this.newMaterialLevel.set(this.authService.currentUser()?.level ?? 100);
      this.isUploadModalOpen.set(true);
      input.value = ''; // Reset file input
    }
  }

  cancelUpload() {
    this.isUploadModalOpen.set(false);
    this.fileToUpload.set(null);
    this.newMaterialTitle.set('');
    this.newMaterialCourse.set('');
    this.newMaterialDepartment.set('');
    this.newMaterialLevel.set(null);
  }

  async confirmUpload() {
    const file = this.fileToUpload();
    if (!file || !this.newMaterialTitle() || !this.newMaterialCourse() || !this.newMaterialLevel()) {
      this.notificationService.show('Title, Course, and Level are required.', 'warning');
      return;
    }

    if (this.isSuperAdmin && !this.newMaterialDepartment()) {
      this.notificationService.show('As Super Admin, you must select a department.', 'warning');
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'xls', 'xlsx', 'txt', 'rtf', 'odt', 'odp'];
    
    if (!supportedTypes.includes(fileExtension)) {
      this.notificationService.show(`Unsupported file type: .${fileExtension}`, 'error');
      return;
    }

    const newMaterialData: any = {
      title: this.newMaterialTitle(),
      course: this.newMaterialCourse(),
      level: this.newMaterialLevel(),
      type: fileExtension as any,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    };

    const department = this.isSuperAdmin ? this.newMaterialDepartment() : undefined;
    const uploadedMaterial = await this.materialsService.uploadMaterial(newMaterialData, file, department);
    
    if (uploadedMaterial) {
      this.allMaterials.update(m => [uploadedMaterial, ...m]);
      this.notificationService.show('Material uploaded successfully.', 'success');
      this.cancelUpload();
    }
  }

  private deleteMaterial(material: Material) {
    this.materialsService.deleteMaterial(material).then((success) => {
      if(success) {
        this.allMaterials.update(materials => materials.filter(m => m.id !== material.id));
        this.notificationService.show('Material deleted successfully.', 'success');
      }
    });
  }

  // --- Delete Modal Methods ---
  openDeleteModal(material: Material) {
    this.materialToDelete.set(material);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.materialToDelete.set(null);
  }

  confirmDelete() {
    const material = this.materialToDelete();
    if (material) {
      this.deleteMaterial(material);
    }
    this.closeDeleteModal();
  }
}
