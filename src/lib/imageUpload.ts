// src/lib/imageUpload.ts

import { supabase } from './supabase';

const BUCKET_NAME = 'product-images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Generar nombre único para archivo
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase();
  return `${timestamp}-${randomStr}.${extension}`;
};

// Validar archivo
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Tamaño máximo: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen debe ser menor a 5MB' };
  }

  // Tipos permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)' };
  }

  return { valid: true };
};

// Subir imagen individual
export const uploadImage = async (file: File): Promise<UploadResult> => {
  try {
    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generar nombre único
    const fileName = generateFileName(file.name);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: 'Error al subir la imagen' };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
};

// Subir múltiples imágenes
export const uploadMultipleImages = async (files: FileList): Promise<UploadResult[]> => {
  const uploadPromises = Array.from(files).map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

// Eliminar imagen
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraer path del archivo de la URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting image:', error);
    return false;
  }
};

// Optimizar imagen antes de subir (opcional)
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convertir a blob y crear nuevo archivo
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback al archivo original
        }
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};