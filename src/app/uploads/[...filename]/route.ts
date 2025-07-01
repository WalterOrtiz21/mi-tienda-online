// src/app/uploads/[...filename]/route.ts - Sin cache agresivo

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIR = process.env.CONTENT_DIR || '/opt/annyamodas/CONTENT';
const UPLOAD_DIR = join(CONTENT_DIR, 'uploads');

const getMimeType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    const filePath = join(UPLOAD_DIR, ...filename);
    const fullFilename = filename.join('/');

    console.log(`🖼️ Sirviendo imagen: ${filePath}`);

    // Verificar que el archivo existe
    try {
      await stat(filePath);
    } catch (error) {
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = await readFile(filePath);
    
    // Determinar tipo MIME
    const mimeType = getMimeType(fullFilename);
    
    // Headers SIN cache agresivo para development
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=60', // Solo 1 minuto de cache
      'Access-Control-Allow-Origin': '*',
      'Last-Modified': new Date().toUTCString(),
    });

    console.log(`✅ Imagen servida: ${fullFilename} (${mimeType})`);

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}