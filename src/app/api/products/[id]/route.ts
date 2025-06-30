// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { productAPI } from '@/lib/database';

// GET - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await productAPI.getById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const productData = await request.json();
    
    // Validar datos requeridos
    if (!productData.name || productData.price === undefined || !productData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, description' },
        { status: 400 }
      );
    }

    // Validar categoría
    if (!['prendas', 'calzados'].includes(productData.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be "prendas" or "calzados"' },
        { status: 400 }
      );
    }

    // Validar género
    if (!['hombre', 'mujer', 'unisex'].includes(productData.gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be "hombre", "mujer", or "unisex"' },
        { status: 400 }
      );
    }

    // Asegurar que sizes sea un array
    if (!productData.sizes) {
      productData.sizes = [];
    } else if (!Array.isArray(productData.sizes)) {
      return NextResponse.json(
        { error: 'Sizes must be an array' },
        { status: 400 }
      );
    }

    // Asegurar que colors sea un array (opcional)
    if (productData.colors && !Array.isArray(productData.colors)) {
      return NextResponse.json(
        { error: 'Colors must be an array' },
        { status: 400 }
      );
    }

    const updatedProduct = await productAPI.update(id, productData);
    
    if (updatedProduct) {
      return NextResponse.json(updatedProduct);
    } else {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const success = await productAPI.delete(id);
    
    if (success) {
      return NextResponse.json({ message: 'Product deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}