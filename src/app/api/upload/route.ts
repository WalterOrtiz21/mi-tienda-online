// src/app/api/upload/route.ts - Versión que funciona con configuración flexible

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import mimeTypes from 'mime-types';

// 🔧 CONFIGURACIÓN INTELIGENTE PARA DESARROLLO Y PRODUCCIÓN
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const getContentDir = () => {
  console.log('🔧 Detectando entorno y configuración...');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  CONTENT_DIR_HOST: ${process.env.CONTENT_DIR_HOST || 'undefined'}`);
  console.log(`  CONTENT_DIR: ${process.env.CONTENT_DIR || 'undefined'}`);

  // 🎯 PRIORIDAD 1: CONTENT_DIR_HOST (para mapeo de volumen)
  if (process.env.CONTENT_DIR_HOST) {
    console.log('🔧 Usando CONTENT_DIR_HOST:', process.env.CONTENT_DIR_HOST);
    return process.env.CONTENT_DIR_HOST;
  }
  
  // 🎯 PRIORIDAD 2: CONTENT_DIR (variable estándar)
  if (process.env.CONTENT_DIR) {
    console.log('🔧 Usando CONTENT_DIR:', process.env.CONTENT_DIR);
    return process.env.CONTENT_DIR;
  }
  
  // 🎯 FALLBACK POR ENTORNO
  if (isProduction) {
    console.log('🔧 Producción - fallback a /opt/annyamodas/CONTENT');
    return '/opt/annyamodas/CONTENT';
  } else {
    console.log('🔧 Desarrollo - fallback a directorio público');
    return join(process.cwd(), 'public');
  }
};

const CONTENT_DIR = getContentDir();
const UPLOAD_DIR = join(CONTENT_DIR, 'uploads');

console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📁 Content dir: ${CONTENT_DIR}`);
console.log(`📂 Upload dir: ${UPLOAD_DIR}`);
console.log(`🏠 PWD: ${process.cwd()}`);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/gif'
];

const FILE_SIGNATURES: { [key: string]: number[][] } = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]]
};

const ensureUploadDir = async () => {
  try {
    console.log(`📁 Verificando directorio: ${UPLOAD_DIR}`);
    
    // Verificar si ya existe
    try {
      const dirStat = await stat(UPLOAD_DIR);
      console.log(`✅ Directorio ya existe: ${UPLOAD_DIR}`);
      console.log(`📊 Permisos: ${dirStat.mode?.toString(8)}`);
      return; // Si existe, no hacer nada más
    } catch {
      console.log(`📁 Directorio no existe, creando: ${UPLOAD_DIR}`);
    }
    
    // Intentar crear directorio
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`✅ Directorio uploads creado: ${UPLOAD_DIR}`);
    
    // Verificar permisos de escritura
    const testFile = join(UPLOAD_DIR, '.test-write-access');
    await writeFile(testFile, 'test');
    console.log(`✅ Permisos de escritura verificados`);
    
    const { unlink } = await import('fs/promises');
    await unlink(testFile);
    console.log(`✅ Test file eliminado`);
    
  } catch (error) {
    console.error(`❌ Error con directorio ${UPLOAD_DIR}:`, error);
    
    // Información adicional para debug
    if (error && typeof error === 'object') {
      const nodeError = error as any;
      console.error(`❌ Error code: ${nodeError.code || 'unknown'}`);
      console.error(`❌ Error path: ${nodeError.path || 'unknown'}`);
    }
    
    console.log(`🔍 Intentando diagnóstico del directorio padre...`);
    
    // Intentar verificar directorio padre
    try {
      const parentDir = CONTENT_DIR;
      const parentStat = await stat(parentDir);
      console.log(`📂 Directorio padre existe: ${parentDir}`);
      console.log(`📊 Permisos padre: ${parentStat.mode?.toString(8)}`);
    } catch (parentError) {
      console.error(`❌ Directorio padre no accesible: ${CONTENT_DIR}`, parentError);
    }
    
    throw error;
  }
};

const generateFileName = (originalName: string, detectedMime: string): string => {
  const extension = mimeTypes.extension(detectedMime) || 'jpg';
  const timestamp = Date.now();
  const uniqueName = randomUUID();
  
  const fileName = `${timestamp}-${uniqueName}.${extension}`;
  console.log(`📝 Nombre generado: ${fileName} (original: ${originalName})`);
  return fileName;
};

const detectMimeTypeBySignature = (buffer: Buffer): string | null => {
  console.log(`🔍 Detectando MIME type, buffer size: ${buffer.length} bytes`);
  
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        if (mimeType === 'image/webp') {
          const webpSignature = Buffer.from('WEBP', 'ascii');
          const isWebp = buffer.indexOf(webpSignature) !== -1;
          console.log(`🔍 WebP check: ${isWebp ? 'Sí' : 'No'}`);
          return isWebp ? 'image/webp' : null;
        }
        console.log(`✅ MIME detectado: ${mimeType}`);
        return mimeType;
      }
    }
  }
  
  console.log(`❌ No se pudo detectar MIME type`);
  return null;
};

const validateFile = (file: File, buffer: Buffer) => {
  console.log(`🔍 Validando archivo: ${file.name} (${file.size} bytes, tipo: ${file.type})`);
  
  const errors: string[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    errors.push(`Archivo muy grande: ${sizeMB}MB (máximo 5MB)`);
    console.log(`❌ Archivo muy grande: ${sizeMB}MB`);
  }
  
  if (file.size < 100) {
    errors.push(`Archivo muy pequeño: ${file.size} bytes`);
    console.log(`❌ Archivo muy pequeño: ${file.size} bytes`);
  }

  const detectedMime = detectMimeTypeBySignature(buffer);
  
  if (!detectedMime) {
    errors.push(`No se pudo detectar el tipo de archivo`);
    console.log(`❌ MIME type no detectado`);
    return { isValid: false, errors, detectedMime: null };
  }

  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    errors.push(`Tipo no permitido: ${detectedMime}`);
    console.log(`❌ Tipo no permitido: ${detectedMime}`);
  }

  const isValid = errors.length === 0;
  console.log(`${isValid ? '✅' : '❌'} Validación: ${isValid ? 'EXITOSA' : 'FALLIDA'}`);
  
  return {
    isValid,
    errors,
    detectedMime
  };
};

export async function POST(request: NextRequest) {
  console.log('🚀 ===== INICIO UPLOAD REQUEST =====');
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Host: ${request.headers.get('host')}`);
  console.log(`🔒 Protocol: ${request.headers.get('x-forwarded-proto') || 'http'}`);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No se envió archivo');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Archivo recibido:`);
    console.log(`  - Nombre: ${file.name}`);
    console.log(`  - Tamaño: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  - Tipo declarado: ${file.type}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`📦 Buffer creado: ${buffer.length} bytes`);

    const validation = validateFile(file, buffer);
    
    if (!validation.isValid) {
      console.log('❌ Validación fallida:', validation.errors);
      return NextResponse.json({
        error: 'Archivo inválido',
        details: validation.errors
      }, { status: 400 });
    }

    console.log('✅ Archivo válido, procediendo a guardarlo...');
    
    // 🎯 VERIFICAR DIRECTORIO
    try {
      await ensureUploadDir();
    } catch (dirError) {
      console.error('❌ ===== ERROR DE DIRECTORIO =====');
      console.error('Error:', dirError);
      
      return NextResponse.json({
        error: 'Error de configuración del servidor',
        details: 'No se puede acceder al directorio de uploads',
        dirError: dirError instanceof Error ? dirError.message : 'Error desconocido',
        uploadDir: UPLOAD_DIR,
        contentDir: CONTENT_DIR,
        suggestion: 'Verificar permisos del directorio o configuración de volúmenes'
      }, { status: 500 });
    }

    const fileName = generateFileName(file.name, validation.detectedMime!);
    const filePath = join(UPLOAD_DIR, fileName);
    
    console.log(`💾 Guardando archivo:`);
    console.log(`  - Ruta completa: ${filePath}`);
    console.log(`  - Directorio: ${UPLOAD_DIR}`);
    console.log(`  - Nombre final: ${fileName}`);

    try {
      await writeFile(filePath, buffer);
      console.log(`✅ Archivo guardado exitosamente en: ${filePath}`);
    } catch (writeError) {
      console.error(`❌ Error guardando archivo:`, writeError);
      return NextResponse.json({
        error: 'Error guardando archivo',
        details: writeError instanceof Error ? writeError.message : 'Error desconocido',
        filePath: filePath
      }, { status: 500 });
    }

    // Verificar que el archivo se guardó correctamente
    try {
      const savedStats = await stat(filePath);
      console.log(`✅ Verificación post-guardado:`);
      console.log(`  - Tamaño en disco: ${savedStats.size} bytes`);
      console.log(`  - Permisos: ${savedStats.mode?.toString(8)}`);
      console.log(`  - Creado: ${savedStats.birthtime}`);
    } catch (verifyError) {
      console.error(`❌ Error verificando archivo guardado:`, verifyError);
    }

    // Revalidación
    revalidatePath('/uploads');
    console.log(`🔄 Cache revalidado`);

    // 🎯 CONSTRUCCIÓN INTELIGENTE DE URL
    const host = request.headers.get('host') || 'localhost:3000';
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSsl = request.headers.get('x-forwarded-ssl');
    
    // Detectar HTTPS de manera más robusta
    let protocol = 'http';
    if (forwardedProto === 'https' || forwardedSsl === 'on') {
      protocol = 'https';
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      protocol = 'http';
    } else {
      // Para dominios públicos, asumir HTTPS
      protocol = 'https';
    }
    
    const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

    console.log(`🌐 URL construida:`);
    console.log(`  - Host: ${host}`);
    console.log(`  - Protocol: ${protocol}`);
    console.log(`  - Forwarded-Proto: ${forwardedProto || 'none'}`);
    console.log(`  - Forwarded-SSL: ${forwardedSsl || 'none'}`);
    console.log(`  - URL completa: ${publicUrl}`);

    const responseData = {
      success: true,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      mimeType: validation.detectedMime,
      timestamp: new Date().toISOString(),
      savedPath: filePath,
      uploadDir: UPLOAD_DIR,
      environment: process.env.NODE_ENV
    };

    console.log(`📤 Respuesta exitosa para: ${fileName}`);

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Access-Control-Allow-Origin', '*');

    console.log('✅ ===== UPLOAD COMPLETADO EXITOSAMENTE =====');
    return response;

  } catch (error) {
    console.error('❌ ===== ERROR GENERAL EN UPLOAD =====');
    console.error('Error completo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      uploadDir: UPLOAD_DIR,
      contentDir: CONTENT_DIR,
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('📋 ===== LISTANDO ARCHIVOS =====');
  console.log(`📂 Directory: ${UPLOAD_DIR}`);
  
  try {
    // Verificar directorio antes de listar
    try {
      await ensureUploadDir();
    } catch (dirError) {
      console.error(`❌ No se puede acceder al directorio:`, dirError);
      return NextResponse.json({
        error: 'Upload directory not accessible',
        uploadDir: UPLOAD_DIR,
        contentDir: CONTENT_DIR,
        details: dirError instanceof Error ? dirError.message : 'Error desconocido'
      }, { status: 500 });
    }
    
    const files = await readdir(UPLOAD_DIR);
    console.log(`📁 Archivos encontrados: ${files.length}`);
    
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
          console.error(`❌ Error leyendo ${filename}:`, error);
          return {
            name: filename,
            error: 'No se pudo leer'
          };
        }
      })
    );

    const responseData = { 
      message: 'Upload endpoint funcionando',
      uploadDir: UPLOAD_DIR,
      contentDir: CONTENT_DIR,
      maxFileSize: '5MB',
      allowedTypes: ALLOWED_MIME_TYPES,
      filesCount: files.length,
      recentFiles: fileDetails,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        isDevelopment,
        pwd: process.cwd(),
        uid: process.getuid ? process.getuid() : 'N/A',
        gid: process.getgid ? process.getgid() : 'N/A'
      }
    };

    console.log('✅ ===== LISTADO COMPLETADO =====');
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ Error en GET:', error);
    return NextResponse.json({
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Error desconocido',
      uploadDir: UPLOAD_DIR
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ ===== ELIMINANDO ARCHIVO =====');
  
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    console.log(`🗑️ Archivo a eliminar: ${filename}`);
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename requerido' }, { status: 400 });
    }

    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Filename inválido' }, { status: 400 });
    }

    const filePath = join(UPLOAD_DIR, filename);
    console.log(`🗑️ Ruta completa: ${filePath}`);
    
    try {
      const fileStats = await stat(filePath);
      console.log(`📄 Archivo encontrado: ${fileStats.size} bytes`);
      
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      
      console.log(`✅ Archivo eliminado: ${filePath}`);
      
      revalidatePath('/uploads');
      
      return NextResponse.json({
        success: true,
        message: `Archivo ${filename} eliminado`,
        deletedPath: filePath
      });
      
    } catch (error) {
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Error en DELETE:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}