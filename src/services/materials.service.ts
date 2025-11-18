import { Injectable, inject } from '@angular/core';
import { supabase } from '../supabase.config';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export interface Material {
  id: string;
  title: string;
  course: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'zip' | 'xls' | 'xlsx' | 'txt' | 'rtf' | 'odt' | 'odp';
  size: string;
  upload_date: string;
  file_path: string;
  file_url?: string;
  department: string;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  async getMaterials(): Promise<Material[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isSuperAdmin && !user.department) {
      this.notificationService.show('Could not determine your department.', 'error');
      return [];
    }

    try {
      let query = supabase
        .from('materials')
        .select('*');

      if (!isSuperAdmin) {
        query = query.eq('department', user.department!);
      }

      const { data, error } = await query.order('upload_date', { ascending: false });

      if (error) throw error;
      
      return data.map(material => {
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(material.file_path);
        return { ...material, file_url: publicUrl };
      }) as Material[];
    } catch (error: any) {
      console.error("Error fetching materials:", error.message);
      this.notificationService.show('Error fetching materials. Please check your network connection and try again.', 'error');
      return [];
    }
  }

  async deleteMaterial(material: Material): Promise<boolean> {
    try {
      const { error: storageError } = await supabase.storage
        .from('materials')
        .remove([material.file_path]);

      if (storageError) throw storageError;

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error("Error deleting material:", error.message);
      this.notificationService.show(error.message || 'Could not delete material. Please try again.', 'error');
      return false;
    }
  }

  async uploadMaterial(newMaterialData: Omit<Material, 'id' | 'upload_date' | 'file_path' | 'file_url' | 'department'>, file: File): Promise<Material | null> {
    const user = this.authService.currentUser();
    if (!user?.department) {
      this.notificationService.show('Could not determine your department to upload material.', 'error');
      return null;
    }
    
    const filePath = `${user.department.replace(/\s+/g, '_')}/${newMaterialData.course.replace(/\s+/g, '_')}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const materialToInsert = {
          ...newMaterialData,
          department: user.department,
          upload_date: new Date().toISOString().split('T')[0],
          file_path: filePath,
      };
      
      const { data, error } = await supabase
          .from('materials')
          .insert(materialToInsert)
          .select()
          .single();
      
      if (error) {
          await supabase.storage.from('materials').remove([filePath]);
          throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(data.file_path);
      return { ...data, file_url: publicUrl } as Material;

    } catch (error: any) {
      console.error("Error uploading material:", error.message);
      this.notificationService.show(error.message || 'Failed to upload material. Please try again.', 'error');
      return null;
    }
  }
}
