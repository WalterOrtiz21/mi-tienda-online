// src/app/api/auth/change-password/route.ts

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
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Passwords requeridos' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
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

        // Verificar password actual con bcrypt
        const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isCurrentValid) {
            return NextResponse.json(
                { success: false, error: 'Contraseña actual incorrecta' },
                { status: 401 }
            );
        }

        // Generar hash del nuevo password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar password en la BD
        await executeQuery(
            'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
            [newPasswordHash, 'admin']
        );

        return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error cambiando password:', error);
        return NextResponse.json(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
