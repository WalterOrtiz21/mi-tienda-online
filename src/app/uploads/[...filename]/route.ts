// src/app/uploads/[...filename]/route.ts - Versión para producción Docker

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

// 🎯 CONFIGURACIÓN FIJA PARA DOCKER/PRODUCCIÓN
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const getUploadDir = () => {
  if (isProduction) {
    // En producción Docker, siempre usar ruta fija
    return '/opt/annyamodas/CONTENT/uploads';
  }
  
  // En desarrollo, usar configuración flexible
  if (process.env.CONTENT_DIR_HOST) {
    return join(process.env.CONTENT_DIR_HOST, 'uploads');
  }
  if (process.env.CONTENT_DIR) {
    return join(process.env.CONTENT_DIR, 'uploads');
  }
  
  return '/home/womx/annyamodas/CONTENT/uploads';
};

const UPLOAD_DIR = getUploadDir();

console.log(`🖼️ Inicializando servir imágenes:`);
console.log(`  Environment: ${process.env.NODE_ENV}`);
console.log(`  Upload dir: ${UPLOAD_DIR}`);
console.log(`  Is production: ${isProduction}`);

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
    'ico': 'image/x-icon'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const requestId = Date.now().toString().slice(-6);
  
  try {
    const { filename } = await params;
    const filePath = join(UPLOAD_DIR, ...filename);
    const fullFilename = filename.join('/');

    console.log(`🖼️ [${requestId}] ===== SIRVIENDO IMAGEN (PRODUCCIÓN) =====`);
    console.log(`🖼️ [${requestId}] Archivo: ${fullFilename}`);
    console.log(`🖼️ [${requestId}] Ruta: ${filePath}`);
    console.log(`🖼️ [${requestId}] Upload dir: ${UPLOAD_DIR}`);
    console.log(`🖼️ [${requestId}] Host: ${request.headers.get('host')}`);
    console.log(`🖼️ [${requestId}] Protocol: ${request.headers.get('x-forwarded-proto')}`);

    // 🔍 VERIFICAR ARCHIVO CON DIAGNÓSTICO DETALLADO
    let fileStats;
    try {
      fileStats = await stat(filePath);
      console.log(`✅ [${requestId}] Archivo encontrado:`);
      console.log(`  - Tamaño: ${fileStats.size} bytes`);
      console.log(`  - Creado: ${fileStats.birthtime}`);
      console.log(`  - Modificado: ${fileStats.mtime}`);
      console.log(`  - Permisos: ${fileStats.mode?.toString(8)}`);
    } catch (error) {
      console.log(`❌ [${requestId}] Archivo NO encontrado: ${filePath}`);
      console.log(`❌ [${requestId}] Error:`, error);
      
      // 🔍 DIAGNÓSTICO DETALLADO EN CASO DE ERROR
      try {
        console.log(`🔍 [${requestId}] Diagnóstico del directorio:`);
        
        // Verificar directorio uploads
        try {
          const uploadDirStat = await stat(UPLOAD_DIR);
          console.log(`📂 [${requestId}] Directorio uploads existe:`);
          console.log(`  - Permisos: ${uploadDirStat.mode?.toString(8)}`);
          console.log(`  - Es directorio: ${uploadDirStat.isDirectory()}`);
          
          // Listar contenido del directorio
          const { readdir } = await import('fs/promises');
          const dirContents = await readdir(UPLOAD_DIR);
          console.log(`📁 [${requestId}] Contenido directorio (${dirContents.length} archivos):`);
          dirContents.slice(0, 10).forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
          
          if (dirContents.length > 10) {
            console.log(`  ... y ${dirContents.length - 10} archivos más`);
          }
          
        } catch (dirError) {
          console.log(`❌ [${requestId}] Directorio uploads no accesible:`, dirError);
          
          // Verificar directorio padre
          try {
            const parentDir = '/opt/annyamodas/CONTENT';
            const parentStat = await stat(parentDir);
            console.log(`📂 [${requestId}] Directorio padre existe: ${parentDir}`);
            console.log(`  - Permisos: ${parentStat.mode?.toString(8)}`);
            
            const { readdir } = await import('fs/promises');
            const parentContents = await readdir(parentDir);
            console.log(`📁 [${requestId}] Contenido directorio padre:`);
            parentContents.forEach((item, index) => {
              console.log(`  ${index + 1}. ${item}`);
            });
            
          } catch (parentError) {
            console.log(`❌ [${requestId}] Directorio padre no accesible:`, parentError);
          }
        }
        
      } catch (diagError) {
        console.log(`❌ [${requestId}] Error en diagnóstico:`, diagError);
      }
      
      return NextResponse.json({ 
        error: 'Image not found',
        requestedFile: fullFilename,
        searchedPath: filePath,
        uploadDir: UPLOAD_DIR,
        environment: process.env.NODE_ENV,
        requestId: requestId
      }, { status: 404 });
    }

    // 📖 LEER Y SERVIR ARCHIVO
    console.log(`📖 [${requestId}] Leyendo archivo...`);
    const fileBuffer = await readFile(filePath);
    console.log(`✅ [${requestId}] Archivo leído: ${fileBuffer.length} bytes`);
    
    const mimeType = getMimeType(fullFilename);
    console.log(`🎭 [${requestId}] MIME type: ${mimeType}`);
    
    // 🎯 HEADERS OPTIMIZADOS PARA PRODUCCIÓN
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 año para producción
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Last-Modified': fileStats.mtime.toUTCString(),
      'ETag': `"${fileStats.size}-${fileStats.mtime.getTime()}"`,
      
      // Headers de debug
      'X-Served-At': new Date().toISOString(),
      'X-Request-Id': requestId,
      'X-File-Size': fileBuffer.length.toString(),
      'X-Upload-Dir': UPLOAD_DIR,
      'X-Environment': process.env.NODE_ENV || 'unknown'
    });

    console.log(`📤 [${requestId}] Headers configurados:`);
    console.log(`  - Content-Type: ${mimeType}`);
    console.log(`  - Content-Length: ${fileBuffer.length}`);
    console.log(`  - Cache-Control: public, max-age=31536000`);

    console.log(`✅ [${requestId}] ===== IMAGEN SERVIDA EXITOSAMENTE =====`);

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error(`❌ [${requestId}] ===== ERROR SIRVIENDO IMAGEN =====`);
    console.error(`❌ [${requestId}] Error:`, error);
    console.error(`❌ [${requestId}] Stack:`, error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      requestId: requestId,
      uploadDir: UPLOAD_DIR,
      environment: process.env.NODE_ENV,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  console.log('🔄 OPTIONS request para CORS (producción)');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'public, max-age=86400'
    },
  });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    const filePath = join(UPLOAD_DIR, ...filename);
    const fullFilename = filename.join('/');

    console.log(`👁️ HEAD request para: ${fullFilename} (producción)`);

    const fileStats = await stat(filePath);
    const mimeType = getMimeType(fullFilename);
    
    console.log(`✅ HEAD response - Archivo existe: ${fileStats.size} bytes`);
    
    return new NextResponse(null, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileStats.size.toString(),
        'Last-Modified': fileStats.mtime.toUTCString(),
        'Cache-Control': 'public, max-age=31536000',
        'X-Environment': 'production'
      }
    });
  } catch (error) {
    console.log(`❌ HEAD request - Archivo no encontrado (producción)`);
    return new NextResponse(null, { status: 404 });
  }
}