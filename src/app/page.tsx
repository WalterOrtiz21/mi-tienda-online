// src/app/page.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Datos calculados
  const categories = getCategories(products);
  
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, selectedCategory, searchTerm, selectedGender);
    console.log('Filtering:', { selectedCategory, selectedGender, total: products.length, filtered: filtered.length });
    return filtered;
  }, [products, selectedCategory, searchTerm, selectedGender]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGender, searchTerm, itemsPerPage]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset gender filter when changing to non-perfume categories
    if (category !== 'perfumes') {
      setSelectedGender('all');
    }
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
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Descubre tu Fragancia Perfecta
          </h1>
          <p className="text-xl text-gray-800 mb-8">
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
            onCategoryChange={handleCategoryChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            products={products}
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {selectedCategory === 'all' ? 'Todos los Productos' : categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                    {filteredProducts.length > itemsPerPage && ` • Página ${currentPage} de ${totalPages}`}
                  </p>
                </div>
                
                {/* Selector de items per page */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Mostrar:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {selectedGender !== 'all' && (selectedCategory === 'perfumes' || selectedCategory === 'all') && (
                <div className="flex items-center mt-3 space-x-2">
                  <span className="text-sm text-gray-600">Filtrado por:</span>
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                    {selectedGender === 'mujer' && '👩 Para Mujer'}
                    {selectedGender === 'hombre' && '👨 Para Hombre'}
                    {selectedGender === 'unisex' && '👥 Unisex'}
                    <button
                      onClick={() => setSelectedGender('all')}
                      className="ml-2 text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {paginatedProducts.map((product) => (
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
                {(selectedGender !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedGender('all');
                      setSearchTerm('');
                    }}
                    className="mt-2 text-purple-600 hover:text-purple-800 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
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
          onProductSelect={(product) => {
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