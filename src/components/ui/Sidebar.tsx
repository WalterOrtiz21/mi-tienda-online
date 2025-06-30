// src/components/ui/Sidebar.tsx

import { Search, Grid, List, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Category, ViewMode, Product } from '@/lib/types';
import { useState } from 'react';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  products: Product[];
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  selectedSize: string; // ✅ Agregado
  onSizeChange: (size: string) => void; // ✅ Agregado
}

export default function Sidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  products,
  selectedGender,
  onGenderChange,
  selectedSize,
  onSizeChange
}: SidebarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Calcular conteos para filtros
  const genderCounts = {
    all: products.length,
    mujer: products.filter(p => p.gender === 'mujer').length,
    hombre: products.filter(p => p.gender === 'hombre').length,
    unisex: products.filter(p => p.gender === 'unisex').length
  };

  // Obtener talles únicos de productos disponibles
  const availableSizes = Array.from(
    new Set(
      products
        .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
        .flatMap(p => p.sizes || [])
    )
  ).sort((a, b) => {
    // Ordenar talles: primero números, luego letras
    const isANumber = !isNaN(Number(a));
    const isBNumber = !isNaN(Number(b));
    
    if (isANumber && isBNumber) {
      return Number(a) - Number(b);
    } else if (isANumber && !isBNumber) {
      return 1;
    } else if (!isANumber && isBNumber) {
      return -1;
    } else {
      // Ambos son letras, orden alfabético específico para prendas
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      return a.localeCompare(b);
    }
  });

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsFiltersOpen(true);
  };

  // Componente de filtros
  const FiltersContent = () => (
    <>
      {/* Filtro de Género */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          👤 Para quién
        </h3>
        <div className="space-y-2">
          {[
            { id: 'all', name: 'Todos', count: genderCounts.all, icon: '🌟' },
            { id: 'mujer', name: 'Mujer', count: genderCounts.mujer, icon: '👩' },
            { id: 'hombre', name: 'Hombre', count: genderCounts.hombre, icon: '👨' },
            { id: 'unisex', name: 'Unisex', count: genderCounts.unisex, icon: '👥' }
          ].map((gender) => (
            <button
              key={gender.id}
              onClick={() => onGenderChange(gender.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-sm ${
                selectedGender === gender.id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              disabled={gender.count === 0}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xs">{gender.icon}</span>
                <span>{gender.name}</span>
              </span>
              <span className="text-xs opacity-75">{gender.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Talles */}
      {availableSizes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            📏 Talles
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSizeChange('all')}
              className={`px-2 py-2 text-xs rounded-lg transition-colors ${
                selectedSize === 'all' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(selectedSize === size ? 'all' : size)}
                className={`px-2 py-2 text-xs rounded-lg transition-colors ${
                  selectedSize === size 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full bg-white rounded-lg shadow-md p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium">Filtros</span>
          </div>
          <ChevronRight 
            className={`w-5 h-5 transition-transform ${isMobileFiltersOpen ? 'rotate-90' : ''}`} 
          />
        </button>
        
        {/* Mobile Filters Dropdown */}
        {isMobileFiltersOpen && (
          <div className="mt-2 bg-white rounded-lg shadow-md p-4">
            <FiltersContent />
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Categorías</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === category.id 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center">
                    {category.name}
                    {category.id === 'prendas' && ' 👕'}
                    {category.id === 'calzados' && ' 👟'}
                  </span>
                  <span className="text-sm">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtros adicionales */}
          <div className="mb-6">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-3"
            >
              <span>Filtros</span>
              {isFiltersOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            
            {isFiltersOpen && <FiltersContent />}
          </div>

          {/* View Mode */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vista</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg flex-1 flex items-center justify-center ${
                  viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg flex-1 flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedGender !== 'all' || selectedSize !== 'all' || searchTerm) && (
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  onGenderChange('all');
                  onSizeChange('all');
                  onSearchChange('');
                }}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}