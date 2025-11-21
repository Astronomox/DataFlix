import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { MaterialsService, Material } from '../../services/materials.service';
import { UNILAG_FACULTIES } from '../../data/unilag-courses';

@Component({
  selector: 'app-materials',
  standalone: true,
  templateUrl: './materials.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialsComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  materialsService = inject(MaterialsService);
  
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
  newMaterialDepartment = signal<string | null>('');
  newMaterialLevel = signal<number | null>(null);

  // Edit modal state
  isEditModalOpen = signal(false);
  materialToEdit = signal<Material | null>(null);
  editableMaterial = {
    title: '',
    course: '',
    level: null as number | null,
    department: null as string | null
  };

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
      // Show materials for the specific level OR materials for all levels
      materials = materials.filter(m => m.level === level || !m.level);
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
      const depts = UNILAG_FACULTIES.flatMap(f => f.courses);
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
      // For Super Admin, default to "All Levels". For others, default to their level.
      this.newMaterialLevel.set(this.isSuperAdmin ? null : (this.authService.currentUser()?.level ?? 100));
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
    const user = this.authService.currentUser();
    if (!user) return;

    const file = this.fileToUpload();
    if (!file || !this.newMaterialTitle() || !this.newMaterialCourse()) {
      this.notificationService.show('Title and Course are required.', 'warning');
      return;
    }
    
    const levelForUpload = (this.isAdmin && !this.isSuperAdmin) 
        ? user.level 
        : this.newMaterialLevel();
    
    const departmentForUpload = this.isSuperAdmin
      ? this.newMaterialDepartment()
      : user.department;

    if (this.isSuperAdmin && departmentForUpload === '') {
      this.notificationService.show('As Super Admin, you must select a department or "All Departments".', 'warning');
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
      level: levelForUpload,
      type: fileExtension as any,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    };

    const uploadedMaterial = await this.materialsService.uploadMaterial(newMaterialData, file, departmentForUpload);
    
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

  // --- Edit Modal Methods ---
  openEditModal(material: Material) {
    this.materialToEdit.set(material);
    this.editableMaterial = {
      title: material.title,
      course: material.course,
      level: material.level ?? null,
      department: material.department ?? null,
    };
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.materialToEdit.set(null);
  }

  async confirmEdit() {
    const user = this.authService.currentUser();
    const material = this.materialToEdit();
    if (!material || !user || !this.editableMaterial.title || !this.editableMaterial.course) {
        this.notificationService.show('Title and Course cannot be empty.', 'warning');
        return;
    }

    const updates: Partial<Omit<Material, 'id'>> = {
        title: this.editableMaterial.title,
        course: this.editableMaterial.course,
    };

    if (this.isSuperAdmin) {
        updates.level = this.editableMaterial.level;
        updates.department = this.editableMaterial.department;
    }

    const updatedMaterial = await this.materialsService.updateMaterial(material.id, updates);

    if (updatedMaterial) {
        this.allMaterials.update(materials => materials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
        this.notificationService.show('Material updated successfully.', 'success');
        this.closeEditModal();
    }
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
