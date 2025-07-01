// src/lib/products.ts

import { Product, Category, Subcategories } from './types';

// Productos de ejemplo para prendas y calzados
export const products: Product[] = [
  // PRENDAS
  {
    id: 1,
    name: "Remera Oversize Algodón",
    price: 4500,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400"
    ],
    description: "Remera cómoda y moderna, perfecta para uso diario. Corte oversize y tela suave.",
    category: "prendas",
    subcategory: "remeras",
    gender: "unisex",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Negro", "Blanco", "Gris", "Navy"],
    material: "100% Algodón",
    brand: "Urban Style",
    rating: 4.5,
    inStock: true,
    features: ["Oversize", "Algodón suave", "Unisex"],
    tags: ["casual", "cómoda", "básica", "algodón"]
  },
  {
    id: 2,
    name: "Jean Skinny Mujer",
    price: 8500,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400",
    description: "Jean ajustado de corte skinny, ideal para looks casuales y elegantes.",
    category: "prendas",
    subcategory: "jeans",
    gender: "mujer",
    sizes: ["26", "28", "30", "32", "34"],
    colors: ["Azul claro", "Azul oscuro", "Negro"],
    material: "98% Algodón, 2% Elastano",
    brand: "Denim Co",
    rating: 4.7,
    inStock: true,
    features: ["Skinny fit", "Tiro alto", "Stretch"],
    tags: ["skinny", "jeans", "mujer", "ajustado"]
  },
  // CALZADOS
  {
    id: 6,
    name: "Zapatillas Running Deportivas",
    price: 12000,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"
    ],
    description: "Zapatillas profesionales para running con tecnología de amortiguación.",
    category: "calzados",
    subcategory: "zapatillas",
    gender: "unisex",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    colors: ["Negro/Blanco", "Azul/Gris", "Rojo/Negro"],
    material: "Mesh transpirable y EVA",
    brand: "RunTech",
    rating: 4.9,
    inStock: true,
    features: ["Amortiguación", "Transpirable", "Antideslizante"],
    tags: ["running", "deportivo", "cómodo", "transpirable"]
  }
];

export const subcategories: Subcategories = {
  prendas: ['remeras', 'camisas', 'pantalones', 'jeans', 'vestidos', 'faldas', 'shorts', 'buzos', 'camperas'],
  calzados: ['zapatillas', 'zapatos', 'botas', 'sandalias', 'ojotas', 'botinetas', 'mocasines']
};

// Utilidades actualizadas
export const getCategories = (products: Product[]): Category[] => [
  { 
    id: 'all', 
    name: 'Todos', 
    count: products.length,
    icon: '🌟'
  },
  { 
    id: 'prendas', 
    name: 'Prendas', 
    count: products.filter(p => p.category === 'prendas').length,
    icon: '👕'
  },
  { 
    id: 'calzados', 
    name: 'Calzados', 
    count: products.filter(p => p.category === 'calzados').length,
    icon: '👟'
  }
];

export const filterProducts = (
  products: Product[], 
  category: string, 
  searchTerm: string,
  gender?: string,
  size?: string
): Product[] => {
  return products.filter(product => {
    // Filtro de categoría
    const matchesCategory = category === 'all' || product.category === category;
    
    // Filtro de búsqueda
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de género
    const matchesGender = !gender || gender === 'all' || product.gender === gender;
    
    // Filtro de talle
    const matchesSize = !size || size === 'all' || (product.sizes && product.sizes.includes(size));
    
    return matchesCategory && matchesSearch && matchesGender && matchesSize;
  });
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const calculateDiscount = (price: number, originalPrice: number): number => {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const getGenderIcon = (gender: string): string => {
  switch (gender) {
    case 'mujer': return '👩';
    case 'hombre': return '👨';
    case 'unisex': return '👥';
    default: return '👤';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'prendas': return '👕';
    case 'calzados': return '👟';
    default: return '🛍️';
  }
};

// Funciones útiles para prendas y calzados
export const getSizesByCategory = (category: string): string[] => {
  if (category === 'prendas') {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  } else if (category === 'calzados') {
    return ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
  }
  return [];
};

// Función para obtener productos relacionados
export const getRelatedProducts = (product: Product, allProducts: Product[], limit: number = 4): Product[] => {
  return allProducts
    .filter(p => 
      p.id !== product.id && 
      (p.category === product.category || p.gender === product.gender)
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

// Función para obtener productos en descuento
export const getDiscountedProducts = (products: Product[]): Product[] => {
  return products.filter(p => p.originalPrice && p.originalPrice > p.price);
};

// Función para obtener productos más vendidos (basado en rating)
export const getBestSellingProducts = (products: Product[], limit: number = 6): Product[] => {
  return products
    .filter(p => p.inStock)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};