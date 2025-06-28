// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { productAPI } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    const productData = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const updatedProduct = await productAPI.update(id, productData);
    
    if (updatedProduct) {
      return NextResponse.json(updatedProduct);
    } else {
      return NextResponse.json(
        { error: 'Product not found or failed to update' },
        { status: 404 }
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
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id: idParam } = await context.params;
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
        { error: 'Product not found or failed to delete' },
        { status: 404 }
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