// src/app/uploads/[...filename]/route.ts - Sin cache agresivo, detección inmediata

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

    console.log(`🖼️ Sirviendo imagen inmediata: ${filePath}`);

    // Verificar que el archivo existe
    let fileStats;
    try {
      fileStats = await stat(filePath);
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
    
    // 🔥 HEADERS SIN CACHE - Detección inmediata
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': fileBuffer.length.toString(),
      // 🚨 SIN CACHE para desarrollo y testing
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      // CORS permisivo
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      // Timestamp para debug
      'X-Served-At': new Date().toISOString(),
      'X-File-Size': fileBuffer.length.toString(),
      'X-File-Modified': fileStats.mtime.toISOString(),
      // Evitar cache del navegador
      'Last-Modified': new Date().toUTCString(),
    });

    console.log(`✅ Imagen servida SIN CACHE: ${fullFilename} (${mimeType})`);

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('❌ Error serving image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}