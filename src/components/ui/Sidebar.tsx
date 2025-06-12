// src/components/ui/Sidebar.tsx

import { Search, Grid, List, ChevronDown, ChevronRight } from 'lucide-react';
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
  products: Product[]; // Agregar productos para filtros dinámicos
  selectedGender: string;
  onGenderChange: (gender: string) => void;
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
  onGenderChange
}: SidebarProps) {
  const [isPerfumeFiltersOpen, setIsPerfumeFiltersOpen] = useState(selectedCategory === 'perfumes');
  
  // Calcular conteos para filtros de género (solo perfumes)
  const perfumeProducts = products.filter(p => p.category === 'perfumes');
  const genderCounts = {
    all: perfumeProducts.length,
    mujer: perfumeProducts.filter(p => p.gender === 'mujer').length,
    hombre: perfumeProducts.filter(p => p.gender === 'hombre').length,
    unisex: perfumeProducts.filter(p => p.gender === 'unisex' || !p.gender).length
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'perfumes' && selectedCategory === 'perfumes') {
      // Si ya está seleccionado perfumes, toggle los filtros
      setIsPerfumeFiltersOpen(!isPerfumeFiltersOpen);
    } else {
      onCategoryChange(categoryId);
      
      // Auto-expandir filtros de perfumes cuando se selecciona
      if (categoryId === 'perfumes') {
        setIsPerfumeFiltersOpen(true);
      } else {
        setIsPerfumeFiltersOpen(false);
        // Reset gender filter when switching away from perfumes
        if (selectedGender !== 'all') {
          onGenderChange('all');
        }
      }
    }
  };
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
              <div key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === category.id 
                      ? 'bg-black text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center">
                    {category.name}
                    {category.id === 'perfumes' && (
                      <span className="ml-2">
                        {isPerfumeFiltersOpen && selectedCategory === 'perfumes' ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </span>
                  <span className="text-sm">{category.count}</span>
                </button>

                {/* Filtros de género colapsables para perfumes */}
                {category.id === 'perfumes' && selectedCategory === 'perfumes' && isPerfumeFiltersOpen && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">Filtrar por género:</div>
                    {[
                      { id: 'all', name: 'Todos', count: genderCounts.all, icon: '🌟' },
                      { id: 'mujer', name: 'Para Mujer', count: genderCounts.mujer, icon: '👩' },
                      { id: 'hombre', name: 'Para Hombre', count: genderCounts.hombre, icon: '👨' },
                      { id: 'unisex', name: 'Unisex', count: genderCounts.unisex, icon: '👥' }
                    ].map((gender) => (
                      <button
                        key={gender.id}
                        onClick={() => onGenderChange(gender.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between text-sm ${
                          selectedGender === gender.id 
                            ? 'bg-purple-500 text-white' 
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Vista</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}