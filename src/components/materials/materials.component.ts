import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { MaterialsService, Material } from '../../services/materials.service';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialsComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  materialsService = inject(MaterialsService);
  
  isAdmin = this.authService.isAdmin();
  isLoading = signal(true);
  searchTerm = signal('');

  // Upload modal state
  isUploadModalOpen = signal(false);
  fileToUpload = signal<File | null>(null);
  newMaterialTitle = signal('');
  newMaterialCourse = signal('');

  // Delete modal state
  isDeleteModalOpen = signal(false);
  materialToDelete = signal<Material | null>(null);

  private allMaterials = signal<Material[]>([]);

  filteredMaterials = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.allMaterials();
    }
    return this.allMaterials().filter(
      material =>
        material.title.toLowerCase().includes(term) ||
        material.course.toLowerCase().includes(term)
    );
  });
  
  ngOnInit() {
    this.loadMaterials();
  }

  loadMaterials() {
    this.isLoading.set(true);
    this.materialsService.getMaterials().then(materials => {
      this.allMaterials.set(materials);
      this.isLoading.set(false);
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  triggerFileInput() {
    document.getElementById('file-upload-input')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileToUpload.set(file);
      this.newMaterialTitle.set(file.name.replace(/\.[^/.]+$/, ""));
      this.newMaterialCourse.set('');
      this.isUploadModalOpen.set(true);
      input.value = ''; // Reset file input
    }
  }

  cancelUpload() {
    this.isUploadModalOpen.set(false);
    this.fileToUpload.set(null);
    this.newMaterialTitle.set('');
    this.newMaterialCourse.set('');
  }

  async confirmUpload() {
    const file = this.fileToUpload();
    if (!file || !this.newMaterialTitle() || !this.newMaterialCourse()) {
      this.notificationService.show('Title and Course are required.', 'warning');
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'xls', 'xlsx', 'txt', 'rtf', 'odt', 'odp'];
    
    if (!supportedTypes.includes(fileExtension)) {
      this.notificationService.show(`Unsupported file type: .${fileExtension}`, 'error');
      return;
    }

    const newMaterialData = {
      title: this.newMaterialTitle(),
      course: this.newMaterialCourse(),
      type: fileExtension as any,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    };

    const uploadedMaterial = await this.materialsService.uploadMaterial(newMaterialData, file);
    
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