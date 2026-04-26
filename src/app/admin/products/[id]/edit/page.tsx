'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import ProductFormPage from '@/components/admin/ProductFormPage';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { products, updateProduct, loadAll, isLoading } = useProducts();
  const { show } = useToast();

  // Asegurar que el producto archivado esté cargado
  useEffect(() => {
    if (products.length === 0) loadAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = products.find((p) => p.id === id);

  if (isLoading && !product) {
    return <p className="text-[color:var(--color-taupe)]">Cargando…</p>;
  }
  if (!product) {
    return (
      <div className="space-y-3">
        <p className="text-[color:var(--color-taupe)]">Producto no encontrado.</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="text-sm underline text-[color:var(--color-cocoa)]"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <ProductFormPage
      mode="edit"
      product={product}
      onSave={async (data: Omit<Product, 'id'>) => {
        const ok = await updateProduct(id, data);
        if (ok) {
          show({ message: 'Cambios guardados' });
          router.push('/admin/products');
        } else {
          show({ message: 'Error al guardar' });
          throw new Error('save failed');
        }
      }}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
