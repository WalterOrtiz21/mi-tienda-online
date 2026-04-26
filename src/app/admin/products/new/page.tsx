'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import ProductFormPage from '@/components/admin/ProductFormPage';
import type { Product } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const { show } = useToast();

  return (
    <ProductFormPage
      mode="new"
      onSave={async (data: Omit<Product, 'id'>) => {
        const ok = await addProduct(data);
        if (ok) {
          show({ message: 'Producto creado' });
          router.push('/admin/products');
        } else {
          show({ message: 'Error al crear producto' });
          throw new Error('save failed');
        }
      }}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
