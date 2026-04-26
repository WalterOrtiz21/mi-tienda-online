// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { productAPI } from '@/lib/database';

// GET - Obtener todos los productos. ?includeArchived=true para admin.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const products = await productAPI.getAll({ includeArchived });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();
    
    // Validar datos requeridos
    if (!productData.name || !productData.price || !productData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, description' },
        { status: 400 }
      );
    }

    const newProduct = await productAPI.create(productData);
    
    if (newProduct) {
      return NextResponse.json(newProduct, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}