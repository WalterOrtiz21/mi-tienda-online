// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { settingsAPI } from '@/lib/database';

// GET - Obtener configuración
export async function GET() {
  try {
    const settings = await settingsAPI.get();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const settingsData = await request.json();
    
    // Validar datos requeridos
    if (!settingsData.storeName || !settingsData.whatsappNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: storeName, whatsappNumber' },
        { status: 400 }
      );
    }

    const success = await settingsAPI.update(settingsData);
    
    if (success) {
      return NextResponse.json({ message: 'Settings updated successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}