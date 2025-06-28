// src/lib/localImageUpload.ts

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Configuración
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Asegurar que el directorio existe
const ensureUploadDir = async () => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Generar nombre único para archivo
const generateFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase();
  const uniqueName = randomUUID();
  return `${uniqueName}.${extension}`;
};

// Validar archivo
const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'La imagen debe ser menor a 5MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)' };
  }

  return { valid: true };
};

// Subir imagen local
export const uploadImageLocal = async (file: File): Promise<UploadResult> => {
  try {
    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Asegurar que el directorio existe
    await ensureUploadDir();

    // Generar nombre único
    const fileName = generateFileName(file.name);
    const filePath = join(UPLOAD_DIR, fileName);

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar archivo
    await writeFile(filePath, buffer);

    // Retornar URL pública
    const publicUrl = `/uploads/${fileName}`;

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error('Error uploading image locally:', error);
    return { success: false, error: 'Error al subir la imagen' };
  }
};

// API Route para manejar uploads
// Crear archivo: src/app/api/upload/route.ts
export const handleImageUpload = async (request: Request) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadImageLocal(file);

    if (result.success) {
      return Response.json({ url: result.url });
    } else {
      return Response.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Upload API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};