// src/lib/imageUpload.ts

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Validar archivo en el frontend
const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen debe ser menor a 5MB' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)' };
  }

  return { valid: true };
};

// Subir imagen individual usando la API local
export const uploadImage = async (file: File): Promise<UploadResult> => {
  try {
    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);

    // Subir a nuestra API
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Error al subir la imagen' };
    }

    // Convertir URL relativa a absoluta
    const fullUrl = result.url.startsWith('http') 
      ? result.url 
      : `${window.location.origin}${result.url}`;

    return {
      success: true,
      url: fullUrl
    };

  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
};

// Subir múltiples imágenes
export const uploadMultipleImages = async (files: FileList): Promise<UploadResult[]> => {
  const uploadPromises = Array.from(files).map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

// Función para eliminar imagen (implementación futura)
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraer filename de la URL
    const filename = imageUrl.split('/').pop();
    
    const response = await fetch(`/api/upload/${filename}`, {
      method: 'DELETE'
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Función para comprimir imagen antes de subir (opcional)
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