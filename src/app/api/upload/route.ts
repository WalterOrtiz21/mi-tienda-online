// src/app/api/upload/route.ts - Versión que funciona en local y producción

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import mimeTypes from 'mime-types';

// 🔧 CONFIGURACIÓN INTELIGENTE PARA LOCAL Y PRODUCCIÓN
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuración flexible usando variables de entorno
const getContentDir = () => {
  // 1. Si está definido CONTENT_DIR_HOST, usarlo (para local personalizado)
  if (process.env.CONTENT_DIR_HOST) {
    return process.env.CONTENT_DIR_HOST;
  }
  
  // 2. Si está definido CONTENT_DIR, usarlo (para producción Docker)
  if (process.env.CONTENT_DIR) {
    return process.env.CONTENT_DIR;
  }
  
  // 3. Fallback por entorno
  if (isProduction) {
    return '/opt/annyamodas/CONTENT';
  } else {
    return join(process.cwd(), 'public');
  }
};

const CONTENT_DIR = getContentDir();
const UPLOAD_DIR = join(CONTENT_DIR, 'uploads');

console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📁 Content dir: ${CONTENT_DIR}`);
console.log(`📂 Upload dir: ${UPLOAD_DIR}`);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/gif'
];

// Firmas de archivos para validación real (magic numbers)
const FILE_SIGNATURES: { [key: string]: number[][] } = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG/EXIF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP usa RIFF container)
  ]
};

const ensureUploadDir = async () => {
  try {
    // Crear directorio recursivamente
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Upload directory ensured: ${UPLOAD_DIR}`);
    
    // Verificar permisos escribiendo un archivo de test
    const testFile = join(UPLOAD_DIR, '.test-write-access');
    await writeFile(testFile, 'test');
    
    // Limpiar archivo de test
    const { unlink } = await import('fs/promises');
    await unlink(testFile);
    
    console.log(`✅ Directory is writable: ${UPLOAD_DIR}`);
    
  } catch (error) {
    console.error(`❌ Error ensuring upload directory:`, error);
    throw new Error(`Cannot create or write to upload directory: ${UPLOAD_DIR}`);
  }
};

const generateFileName = (originalName: string, detectedMime: string): string => {
  // Obtener extensión correcta basada en MIME type
  const correctExtension = mimeTypes.extension(detectedMime);
  const timestamp = Date.now();
  const uniqueName = randomUUID();
  
  return `${timestamp}-${uniqueName}.${correctExtension || 'jpg'}`;
};

// Función para detectar tipo MIME real por firmas de archivo
const detectMimeTypeBySignature = (buffer: Buffer): string | null => {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        // Para WebP, necesitamos verificar más bytes
        if (mimeType === 'image/webp') {
          // Verificar que contiene "WEBP" en la posición correcta
          const webpSignature = Buffer.from('WEBP', 'ascii');
          const webpStart = buffer.indexOf(webpSignature);
          if (webpStart !== -1) {
            return 'image/webp';
          }
        } else {
          return mimeType;
        }
      }
    }
  }
  return null;
};

// Validación completa del archivo
const validateFile = (file: File, buffer: Buffer) => {
  const errors: string[] = [];
  
  // 1. Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)`);
  }
  
  if (file.size < 100) {
    errors.push(`Archivo muy pequeño: ${file.size} bytes`);
  }

  // 2. Detectar MIME type real
  const detectedMime = detectMimeTypeBySignature(buffer);
  
  if (!detectedMime) {
    errors.push(`No se pudo detectar el tipo de archivo. Asegúrate de subir una imagen válida.`);
    return { isValid: false, errors, detectedMime: null };
  }

  // 3. Validar que sea un tipo permitido
  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    errors.push(`Tipo de archivo no permitido: ${detectedMime}. Solo se permiten: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // 4. Verificar inconsistencias entre extensión y contenido real
  const declaredMime = file.type;
  const extensionMime = mimeTypes.lookup(file.name);
  
  const warnings: string[] = [];
  
  if (declaredMime && declaredMime !== detectedMime) {
    warnings.push(`Tipo declarado (${declaredMime}) no coincide con el contenido real (${detectedMime})`);
  }
  
  if (extensionMime && extensionMime !== detectedMime) {
    warnings.push(`Extensión sugiere ${extensionMime} pero el contenido es ${detectedMime}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedMime,
    declaredMime,
    extensionMime
  };
};

// Función para obtener información detallada del archivo
const getFileInfo = (file: File, buffer: Buffer, validation: any) => {
  const stats = {
    originalName: file.name,
    originalSize: file.size,
    originalType: file.type,
    detectedMime: validation.detectedMime,
    isValid: validation.isValid,
    errors: validation.errors || [],
    warnings: validation.warnings || [],
    uploadTimestamp: new Date().toISOString(),
    bufferSize: buffer.length,
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    environment: process.env.NODE_ENV,
    uploadDir: UPLOAD_DIR
  };

  return stats;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    console.log(`📄 File received: ${file.name}, size: ${file.size}, declared type: ${file.type}`);

    // Convertir archivo a buffer para análisis
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validación completa
    const validation = validateFile(file, buffer);
    
    if (!validation.isValid) {
      console.log('❌ File validation failed:', validation.errors);
      return NextResponse.json({
        error: 'Archivo inválido',
        details: validation.errors,
        fileInfo: getFileInfo(file, buffer, validation)
      }, { status: 400 });
    }

    // Advertencias (no bloquean upload)
    if (validation.warnings && validation.warnings.length > 0) {
      console.log('⚠️ File warnings:', validation.warnings);
    }

    // 🔧 CREAR DIRECTORIO Y VERIFICAR PERMISOS
    try {
      await ensureUploadDir();
    } catch (dirError) {
      console.error('❌ Directory creation failed:', dirError);
      return NextResponse.json({
        error: 'No se pudo crear el directorio de uploads',
        details: dirError instanceof Error ? dirError.message : 'Unknown directory error',
        uploadDir: UPLOAD_DIR,
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }

    // Generar nombre con extensión correcta
    const fileName = generateFileName(file.name, validation.detectedMime!);
    const filePath = join(UPLOAD_DIR, fileName);
    
    console.log(`💾 Saving file to: ${filePath}`);

    // 🔧 GUARDAR ARCHIVO CON MANEJO DE ERRORES DETALLADO
    try {
      await writeFile(filePath, buffer);
      console.log(`✅ File saved: ${filePath}`);
    } catch (writeError) {
      console.error('❌ File write failed:', writeError);
      
      // Intentar diagnóstico del error
      const diagnosis = {
        filePath,
        uploadDir: UPLOAD_DIR,
        environment: process.env.NODE_ENV,
        error: writeError instanceof Error ? writeError.message : 'Unknown write error',
        bufferSize: buffer.length,
        pathExists: false,
        dirPermissions: 'unknown'
      };

      // Verificar si el directorio padre existe
      try {
        const parentStat = await stat(UPLOAD_DIR);
        diagnosis.pathExists = true;
        diagnosis.dirPermissions = parentStat.mode?.toString(8) || 'unknown';
      } catch (statError) {
        diagnosis.pathExists = false;
      }

      return NextResponse.json({
        error: 'No se pudo guardar el archivo',
        details: writeError instanceof Error ? writeError.message : 'Unknown error',
        diagnosis
      }, { status: 500 });
    }

    // Revalidación agresiva
    try {
      revalidatePath(`/uploads/${fileName}`);
      revalidatePath('/uploads/[...filename]', 'page');
      revalidatePath('/', 'layout');
      revalidateTag('images');
      revalidateTag('uploads');
      
      console.log(`🔄 Aggressive revalidation completed for: ${fileName}`);
      
    } catch (error) {
      console.log(`⚠️ Revalidation warning:`, error);
    }

    // 🔧 CONSTRUIR URL CORRECTA SEGÚN ENTORNO
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (isDevelopment ? 'http' : 'https');
    const cacheBuster = Date.now();
    
    // En desarrollo la URL es diferente porque usamos public/uploads
    const publicUrl = `${protocol}://${host}/uploads/${fileName}?v=${cacheBuster}`;

    console.log(`🌐 Generated URL: ${publicUrl}`);

    // Información completa del archivo
    const fileInfo = getFileInfo(file, buffer, validation);

    // Response con headers anti-cache
    const response = NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      mimeType: validation.detectedMime,
      cacheBuster: cacheBuster,
      timestamp: new Date().toISOString(),
      savedPath: filePath,
      fileInfo: fileInfo,
      validation: {
        isValid: validation.isValid,
        warnings: validation.warnings,
        detectedMime: validation.detectedMime,
        declaredMime: validation.declaredMime,
        extensionMime: validation.extensionMime
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        isDevelopment,
        uploadDir: UPLOAD_DIR,
        contentDir: CONTENT_DIR
      }
    });

    // Headers para evitar cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      uploadDir: UPLOAD_DIR,
      stack: isDevelopment ? (error instanceof Error ? error.stack : 'No stack') : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verificar que el directorio existe
    try {
      await ensureUploadDir();
    } catch (dirError) {
      return NextResponse.json({
        error: 'Upload directory not accessible',
        uploadDir: UPLOAD_DIR,
        environment: process.env.NODE_ENV,
        details: dirError instanceof Error ? dirError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    const files = await readdir(UPLOAD_DIR);
    
    // Obtener información detallada de cada archivo
    const fileDetails = await Promise.all(
      files.slice(0, 20).map(async (filename) => {
        try {
          const filePath = join(UPLOAD_DIR, filename);
          const stats = await stat(filePath);
          const mimeType = mimeTypes.lookup(filename) || 'unknown';
          
          return {
            name: filename,
            size: stats.size,
            mimeType: mimeType,
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/uploads/${filename}`
          };
        } catch (error) {
          return {
            name: filename,
            error: 'No se pudo obtener información del archivo'
          };
        }
      })
    );

    const response = NextResponse.json({ 
      message: 'Upload endpoint is working',
      uploadDir: UPLOAD_DIR,
      contentDir: CONTENT_DIR,
      maxFileSize: '5MB',
      allowedTypes: ALLOWED_MIME_TYPES,
      filesCount: files.length,
      recentFiles: fileDetails,
      timestamp: new Date().toISOString(),
      supportedSignatures: Object.keys(FILE_SIGNATURES),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
        isProduction,
        isDevelopment
      }
    });

    // Anti-cache headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      uploadDir: UPLOAD_DIR,
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}

// DELETE endpoint para eliminar archivos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter required' },
        { status: 400 }
      );
    }

    // Validar que el filename no contenga paths maliciosos
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filePath = join(UPLOAD_DIR, filename);
    
    try {
      await stat(filePath); // Verificar que existe
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      
      console.log(`🗑️ File deleted: ${filePath}`);
      
      // Revalidar cache
      revalidatePath(`/uploads/${filename}`);
      revalidateTag('images');
      
      return NextResponse.json({
        success: true,
        message: `File ${filename} deleted successfully`,
        environment: process.env.NODE_ENV
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}