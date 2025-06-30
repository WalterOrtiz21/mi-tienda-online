// src/lib/types.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  category: 'prendas' | 'calzados';
  subcategory: string;
  gender: 'hombre' | 'mujer' | 'unisex';
  sizes: string[];
  colors?: string[];
  material?: string;
  brand?: string;
  rating: number;
  inStock: boolean;
  features: string[];
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

export interface Subcategories {
  prendas: string[];
  calzados: string[];
}

export type ViewMode = 'grid' | 'list';

export interface StoreState {
  selectedProduct: Product | null;
  favorites: number[];
  selectedCategory: string;
  selectedGender: string;
  selectedSize: string;
  searchTerm: string;
  viewMode: ViewMode;
  showFilters: boolean;
}

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

export const CATEGORIES = {
  prendas: {
    name: 'Prendas',
    subcategories: [
      'remeras', 'camisas', 'pantalones', 'jeans', 'vestidos', 
      'faldas', 'shorts', 'buzos', 'camperas', 'ropa-interior'
    ]
  },
  calzados: {
    name: 'Calzados',
    subcategories: [
      'zapatillas', 'zapatos', 'botas', 'sandalias', 
      'ojotas', 'botinetas', 'mocasines'
    ]
  }
} as const;