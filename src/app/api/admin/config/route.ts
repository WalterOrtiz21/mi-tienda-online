// src/app/api/admin/config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import bcrypt from 'bcryptjs';

// GET - Obtener configuración del admin (sin password)
export async function GET() {
  try {
    const results = await executeQuery(
      'SELECT COUNT(*) as has_admin FROM users WHERE role = "admin"'
    ) as any[];

    return NextResponse.json({
      hasAdminUser: results[0].has_admin > 0,
      authMethod: 'session' // o 'database' si usas DB
    });
  } catch (error) {
    console.error('Error checking admin config:', error);
    return NextResponse.json(
      { error: 'Failed to get admin config' },
      { status: 500 }
    );
  }
}

// POST - Crear usuario admin en base de datos (opcional para futuro)
export async function POST(request: NextRequest) {
  try {
    const { email, password, currentPassword } = await request.json();

    // Validar que sea una contraseña fuerte
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Verificar si ya existe un admin
    const existingAdmins = await executeQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
    ) as any[];

    if (existingAdmins[0].count > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Crear usuario admin
    await executeQuery(
      'INSERT INTO users (email, password, role) VALUES (?, ?, "admin")',
      [email, hashedPassword]
    );

    return NextResponse.json({
      message: 'Admin user created successfully',
      email: email
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}