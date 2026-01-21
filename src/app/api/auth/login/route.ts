// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import bcrypt from 'bcryptjs';

interface AdminUser {
    id: number;
    username: string;
    password_hash: string;
}

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password requerido' },
                { status: 400 }
            );
        }

        // Buscar usuario admin en la BD
        const rows = await executeQuery(
            'SELECT * FROM admin_users WHERE username = ?',
            ['admin']
        ) as AdminUser[];

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Usuario no encontrado' },
                { status: 401 }
            );
        }

        const user = rows[0];

        // Verificar password con bcrypt
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (isValid) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Password incorrecto' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}

