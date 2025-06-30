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
import Footer from '@/components/ui/Footer';
import { ShoppingBag, Star, Shirt } from 'lucide-react';

export default function Home() {
  const { products, settings, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Datos calculados
  const categories = getCategories(products);
  
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(
      products, 
      selectedCategory, 
      searchTerm, 
      selectedGender,
      selectedSize
    );
    return filtered;
  }, [products, selectedCategory, searchTerm, selectedGender, selectedSize]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGender, selectedSize, searchTerm, itemsPerPage]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset filtros específicos al cambiar categoría
    setSelectedGender('all');
    setSelectedSize('all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section optimizado para móvil */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shirt className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black mb-2 sm:mb-4">
            Prendas & Calzados de Moda
          </h1>
          <p className="text-base sm:text-xl text-gray-800 mb-4 sm:mb-8 px-4">
            Descubre las últimas tendencias en prendas y calzados para toda la familia
          </p>
          
          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {products.filter(p => p.category === 'prendas').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Prendas</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {products.filter(p => p.category === 'calzados').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Calzados</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {products.filter(p => p.inStock).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">En Stock</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 inline" />
                {(products.reduce((acc, p) => acc + p.rating, 0) / products.length).toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Rating</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
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
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">
                    {selectedCategory === 'all' ? 'Todos los Productos' : categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                    {filteredProducts.length > itemsPerPage && ` • Página ${currentPage} de ${totalPages}`}
                  </p>
                </div>
                
                {/* Selector de items per page - oculto en móvil */}
                <div className="hidden sm:flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Mostrar:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Filtros activos */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedGender !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {selectedGender === 'mujer' && '👩 Mujer'}
                    {selectedGender === 'hombre' && '👨 Hombre'}
                    {selectedGender === 'unisex' && '👥 Unisex'}
                    <button
                      onClick={() => setSelectedGender('all')}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSize !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    📏 Talle {selectedSize}
                    <button
                      onClick={() => setSelectedSize('all')}
                      className="ml-2 text-green-500 hover:text-green-700"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Products Grid optimizado para móvil */}
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
                : 'space-y-4 sm:space-y-6'
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
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
                {(selectedGender !== 'all' || selectedSize !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedGender('all');
                      setSelectedSize('all');
                      setSearchTerm('');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* Paginación optimizada para móvil */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ant
                </button>
                
                {/* Números de página - menos en móvil */}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 sm:px-3 py-2 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'border-blue-500 bg-blue-500 text-white'
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
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sig
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

      <Footer 
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
      />
    </div>
  );
}