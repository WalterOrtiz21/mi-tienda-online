// src/lib/types.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string; // Imagen principal (backward compatibility)
  images?: string[]; // Array de múltiples imágenes
  description: string;
  category: 'perfumes' | 'ropa';
  subcategory: string;
  gender?: 'hombre' | 'mujer' | 'unisex'; // Nuevo campo para perfumes
  rating: number;
  inStock: boolean;
  features: string[];
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Subcategories {
  [key: string]: string[];
}

export type ViewMode = 'grid' | 'list';

export interface StoreState {
  selectedProduct: Product | null;
  favorites: number[];
  selectedCategory: string;
  searchTerm: string;
  viewMode: ViewMode;
  showFilters: boolean;
}