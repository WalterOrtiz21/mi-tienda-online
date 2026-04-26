'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { filterProducts, getCategories } from '@/lib/products';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';

export default function CatalogSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSize] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const categories: Category[] = useMemo(() => getCategories(products), [products]);

  const filtered = useMemo(
    () =>
      filterProducts(products, selectedCategory, searchTerm, selectedGender, selectedSize),
    [products, selectedCategory, searchTerm, selectedGender, selectedSize]
  );

  useEffect(() => setPage(1), [selectedCategory, selectedGender, selectedSize, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section id="catalogo" className="pb-20">
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(c) => {
          setSelectedCategory(c);
          setSelectedGender('all');
        }}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <p className="eyebrow">{filtered.length} productos</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">
          {selectedCategory === 'all'
            ? 'Todo el catálogo'
            : categories.find((c) => c.id === selectedCategory)?.name ?? 'Catálogo'}
        </h2>

        {paged.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
            <p className="mt-4 text-[color:var(--color-taupe)]">
              No encontramos nada con esos filtros.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedGender('all');
                setSearchTerm('');
              }}
              className="mt-4 text-sm underline text-[color:var(--color-cocoa)]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm border border-[color:var(--color-cream)] rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-[color:var(--color-taupe)] mx-4">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm border border-[color:var(--color-cream)] rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
