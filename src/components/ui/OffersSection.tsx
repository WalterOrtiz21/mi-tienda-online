'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import { isOnOffer, discountPercent } from '@/lib/products';
import ProductCard from './ProductCard';

export default function OffersSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const offers = products
    .filter(isOnOffer)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 8);

  if (offers.length === 0) return null;

  return (
    <section id="ofertas" className="scroll-mt-20 py-16 bg-[color:var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Solo esta semana</p>
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl sm:text-4xl">Ofertas</h2>
          <Link
            href="#catalogo"
            className="text-xs uppercase tracking-[.2em] border-b border-[color:var(--color-cocoa)] pb-0.5"
          >
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {offers.map((p) => (
            <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
          ))}
        </div>
      </div>
    </section>
  );
}
