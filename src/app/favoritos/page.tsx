'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import ProductModal from '@/components/ui/ProductModal';
import CartDrawer from '@/components/ui/CartDrawer';
import { useProducts } from '@/contexts/ProductsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/lib/types';

export default function FavoritosPage() {
  const { products, settings, isLoading } = useProducts();
  const { favoriteIds, count } = useFavorites();
  const { itemCount: cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const favorites = products.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] pt-16">
      <Header
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
        favoritesCount={count}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="eyebrow">Tu lista</p>
        <h1 className="font-display text-4xl mt-1 mb-8">Favoritos</h1>

        {isLoading ? (
          <p className="text-[color:var(--color-taupe)]">Cargando…</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
            <p className="mt-4 text-[color:var(--color-taupe)]">No tenés favoritos todavía.</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em]"
            >
              Explorar tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((p) => (
              <ProductCard key={p.id} product={p} onViewDetails={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      <Footer storeName={settings.storeName} whatsappNumber={settings.whatsappNumber} />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
