'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Hero from '@/components/ui/Hero';
import ServiceBar from '@/components/ui/ServiceBar';
import OffersSection from '@/components/ui/OffersSection';
import NewArrivalsSection from '@/components/ui/NewArrivalsSection';
import CategoriesSection from '@/components/ui/CategoriesSection';
import CatalogSection from '@/components/ui/CatalogSection';
import ProductModal from '@/components/ui/ProductModal';
import CartDrawer from '@/components/ui/CartDrawer';

export default function Home() {
  const { products, settings, isLoading } = useProducts();
  const { itemCount: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)]">
        <p className="text-[color:var(--color-taupe)]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)]">
      <Header
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
        favoritesCount={favoritesCount}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <Hero />
      <ServiceBar whatsappNumber={settings.whatsappNumber} />

      <OffersSection products={products} onViewDetails={setSelectedProduct} />
      <NewArrivalsSection products={products} onViewDetails={setSelectedProduct} />
      <CategoriesSection />
      <CatalogSection products={products} onViewDetails={setSelectedProduct} />

      <Footer storeName={settings.storeName} whatsappNumber={settings.whatsappNumber} />

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
