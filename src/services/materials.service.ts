import { Injectable, inject, effect } from '@angular/core';
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
  department: string | null;
  level?: number;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private materialsPromise: Promise<Material[]> | null = null;

  constructor() {
    effect(() => {
      // When current user changes (login/logout), clear the cache.
      this.authService.currentUser(); 
      this.materialsPromise = null;
    });
  }

  async getMaterials(): Promise<Material[]> {
    if (this.materialsPromise) {
      return this.materialsPromise;
    }

    const user = this.authService.currentUser();
    if (!user) return [];

    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isSuperAdmin && !user.department) {
      this.notificationService.show('Could not determine your department.', 'error');
      return [];
    }

    this.materialsPromise = (async () => {
      try {
        let query = supabase
          .from('materials')
          .select('*');

        if (!isSuperAdmin) {
          query = query.or(`department.eq.${user.department!},department.is.null`);
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
        this.materialsPromise = null; // Clear promise on error to allow retries
        return [];
      }
    })();
    return this.materialsPromise;
  }

  async getRecentMaterials(limit: number): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Material[];
    } catch (error: any) {
      console.error("Error fetching recent materials:", error.message);
      this.notificationService.show('Could not fetch recent uploads.', 'error');
      return [];
    }
  }

  async updateMaterial(id: string, updates: Partial<Omit<Material, 'id'>>): Promise<Material | null> {
    try {
        const { data, error } = await supabase
            .from('materials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        this.materialsPromise = null; // Invalidate cache
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(data.file_path);
        return { ...data, file_url: publicUrl } as Material;
    } catch (error: any) {
        console.error("Error updating material:", error.message);
        this.notificationService.show('Could not update material. Please try again.', 'error');
        return null;
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
      
      this.materialsPromise = null; // Invalidate cache
      return true;
    } catch (error: any) {
      console.error("Error deleting material:", error.message);
      this.notificationService.show(error.message || 'Could not delete material. Please try again.', 'error');
      return false;
    }
  }

  async uploadMaterial(newMaterialData: Omit<Material, 'id' | 'upload_date' | 'file_path' | 'file_url' | 'department'>, file: File, department: string | null | undefined): Promise<Material | null> {
    if (department === undefined) {
      this.notificationService.show('Could not determine department for material upload.', 'error');
      return null;
    }
    
    // Helper function to sanitize strings for use in file paths.
    // Replaces whitespace and common invalid characters with an underscore.
    const sanitizeForPath = (str: string) => str.replace(/[\s/\\?%*:|"<>]/g, '_');
    
    const departmentPath = sanitizeForPath(department ?? 'All_Departments');
    const coursePath = sanitizeForPath(newMaterialData.course);
    const sanitizedFileName = sanitizeForPath(file.name);
    const filePath = `${departmentPath}/${coursePath}/${Date.now()}_${sanitizedFileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      const materialToInsert = {
          ...newMaterialData,
          department: department,
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
      this.materialsPromise = null; // Invalidate cache
      return { ...data, file_url: publicUrl } as Material;

    } catch (error: any) {
      console.error("Error uploading material:", error); // Log the full error object for more context
      let errorMessage = error.message || 'Failed to upload material. Please try again.';
      
      // Provide a more helpful message for the common "Failed to fetch" CORS error.
      if (errorMessage.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Upload failed due to a network error. This is often a CORS issue. Please verify your Supabase project\'s CORS settings.';
      }
      
      this.notificationService.show(errorMessage, 'error', 8000); // Increased duration for readability
      return null;
    }
  }
}