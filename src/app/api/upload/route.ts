// src/app/api/upload/route.ts - Versión con revalidación forzada

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

const CONTENT_DIR = process.env.CONTENT_DIR || '/opt/annyamodas/CONTENT';
const UPLOAD_DIR = join(CONTENT_DIR, 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ensureUploadDir = async () => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Upload directory ensured: ${UPLOAD_DIR}`);
  } catch (error) {
    console.log(`📁 Upload directory already exists: ${UPLOAD_DIR}`);
  }
};

const generateFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueName = randomUUID();
  return `${uniqueName}.${extension}`;
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

    console.log(`📄 File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validaciones
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' }, 
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed' }, 
        { status: 400 }
      );
    }

    await ensureUploadDir();

    const fileName = generateFileName(file.name);
    const filePath = join(UPLOAD_DIR, fileName);
    
    console.log(`💾 Saving file to: ${filePath}`);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`✅ File saved: ${filePath}`);

    // 🔥 CRÍTICO: Forzar revalidación inmediata
    try {
      // Revalidar múltiples rutas para asegurar que Next.js detecte el archivo
      revalidatePath(`/uploads/${fileName}`);
      revalidatePath('/uploads/[...filename]', 'page');
      revalidatePath('/', 'layout');
      
      console.log(`🔄 Paths revalidated for: ${fileName}`);
      
      // También forzar limpieza de cache
      if (typeof fetch !== 'undefined') {
        // Hacer una request interna para "calentar" la ruta
        const baseUrl = request.headers.get('host') || 'localhost:8080';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const testUrl = `${protocol}://${baseUrl}/uploads/${fileName}`;
        
        // Request no-bloqueante para precalentar la ruta
        fetch(testUrl, { method: 'HEAD' }).catch(() => {
          console.log('Preload request sent');
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Revalidation warning:`, error);
    }

    // URL final
    const host = request.headers.get('host') || 'annyamodas.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

    console.log(`🌐 Generated URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type,
      // Agregar timestamp para debugging
      timestamp: new Date().toISOString(),
      savedPath: filePath
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureUploadDir();
    
    const { readdir } = await import('fs/promises');
    const files = await readdir(UPLOAD_DIR);
    
    return NextResponse.json({ 
      message: 'Upload endpoint is working',
      uploadDir: UPLOAD_DIR,
      maxFileSize: '5MB',
      allowedTypes: ALLOWED_TYPES,
      filesCount: files.length,
      files: files.slice(0, 10),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}