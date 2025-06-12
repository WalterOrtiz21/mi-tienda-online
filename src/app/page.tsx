// src/app/page.tsx

'use client';

import { useState, useMemo, SetStateAction } from 'react';
import { Product, ViewMode } from '@/lib/types';
import { getCategories, filterProducts } from '@/lib/products';
import { useProducts } from '@/contexts/ProductsContext';
import Header from '@/components/ui/Header';
import Sidebar from '@/components/ui/Sidebar';
import ProductCard from '@/components/ui/ProductCard';
import ProductModal from '@/components/ui/ProductModal';
import FragranceAdvisor from '@/components/ui/FragranceAdvisor';
import Footer from '@/components/ui/Footer';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { products, settings, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvisor, setShowAdvisor] = useState(false);

  const categories = getCategories(products);
  const filteredProducts = useMemo(() => 
    filterProducts(products, selectedCategory, searchTerm),
    [products, selectedCategory, searchTerm]
  );

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
        storeIcon={settings.storeIcon}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section con Asesor IA */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Descubre tu Fragancia Perfecta
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Explora nuestra colección exclusiva de perfumes y encuentra el aroma que define tu personalidad
          </p>
          <button
            onClick={() => setShowAdvisor(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
          >
            <Sparkles className="w-6 h-6" />
            <span>✨ Encuentra tu Aroma Ideal con IA</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'all' ? 'Todos los Productos' : categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-lg text-gray-500 ml-2">({filteredProducts.length})</span>
              </h2>
            </div>

            {/* Products Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isListView={viewMode === 'list'}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {showAdvisor && (
        <FragranceAdvisor
          products={products}
          onProductSelect={(product: SetStateAction<Product | null>) => {
            setSelectedProduct(product);
            setShowAdvisor(false);
          }}
          onClose={() => setShowAdvisor(false)}
        />
      )}

      <Footer 
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
      />
    </div>
  );
}