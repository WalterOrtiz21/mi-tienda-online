// src/app/api/health/route.ts

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/database';

export async function GET() {
  try {
    const dbConnected = await testConnection();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: '1.0.0'
    };

    return NextResponse.json(health, {
      status: dbConnected ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}