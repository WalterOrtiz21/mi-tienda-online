'use client';

import { Product } from '@/lib/types';
import { isNewArrival } from '@/lib/products';
import ProductCard from './ProductCard';

export default function NewArrivalsSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const recent = products.filter(isNewArrival);
  const list =
    recent.length >= 4
      ? recent
      : [...products].sort((a, b) => {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0;
          const db = b.createdAt ? Date.parse(b.createdAt) : 0;
          return db - da;
        });

  const top = list.slice(0, 8);
  if (top.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Lo más reciente</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">Recién llegados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {top.map((p) => (
            <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
          ))}
        </div>
      </div>
    </section>
  );
}
