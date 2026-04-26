// src/app/api/upload/route.ts
// Upload de imágenes a Supabase Storage (bucket público 'products').

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import mimeTypes from 'mime-types';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

const BUCKET = 'products';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Magic numbers para detectar el tipo real del archivo (no confiar en file.type).
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF, validamos "WEBP" más abajo
  ],
};

const detectMimeBySignature = (buffer: Buffer): string | null => {
  for (const [mime, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const sig of signatures) {
      const match = sig.every((byte, i) => buffer[i] === byte);
      if (!match) continue;
      if (mime === 'image/webp') {
        if (buffer.indexOf(Buffer.from('WEBP', 'ascii')) !== -1) return 'image/webp';
      } else {
        return mime;
      }
    }
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)` },
        { status: 400 }
      );
    }
    if (file.size < 100) {
      return NextResponse.json({ error: 'Archivo muy pequeño' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectMimeBySignature(buffer);

    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return NextResponse.json(
        {
          error: 'Tipo de archivo no permitido',
          details: `Detectado: ${detectedMime ?? 'desconocido'}. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const ext = mimeTypes.extension(detectedMime) || 'jpg';
    const fileName = `${Date.now()}-${randomUUID()}.${ext}`;

    const admin = getSupabaseAdmin();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: detectedMime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'No se pudo subir la imagen', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
      size: file.size,
      mimeType: detectedMime,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.from(BUCKET).list('', {
      limit: 20,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const files = (data ?? []).map((f) => ({
      name: f.name,
      size: f.metadata?.size,
      created: f.created_at,
      url: admin.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
    }));
    return NextResponse.json({
      message: 'Upload endpoint is working',
      bucket: BUCKET,
      maxFileSize: '5MB',
      allowedTypes: ALLOWED_MIME_TYPES,
      filesCount: files.length,
      recentFiles: files,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename parameter required' }, { status: 400 });
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from(BUCKET).remove([filename]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `File ${filename} deleted` });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
