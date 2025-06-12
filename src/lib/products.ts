// src/lib/products.ts

import { Product, Category, Subcategories } from './types';

export const products: Product[] = [
  // Perfumes
  {
    id: 1,
    name: "Chanel No. 5",
    price: 15000,
    originalPrice: 18000,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400",
    description: "El perfume más icónico del mundo. Una fragancia floral aldehídica atemporal.",
    category: "perfumes",
    subcategory: "mujer",
    rating: 4.8,
    inStock: true,
    features: ["100ml", "Larga duración", "Original"],
    tags: ["floral", "clásico", "elegante"]
  },
  {
    id: 2,
    name: "Dior Sauvage",
    price: 12000,
    originalPrice: 14000,
    image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400",
    description: "Una fragancia fresca y especiada que evoca paisajes salvajes.",
    category: "perfumes",
    subcategory: "hombre",
    rating: 4.7,
    inStock: true,
    features: ["100ml", "Fresco", "Versátil"],
    tags: ["fresco", "especiado", "masculino"]
  },
  // Ropa Shein
  {
    id: 3,
    name: "Vestido Floral Vintage",
    price: 8500,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    description: "Hermoso vestido con estampado floral, perfecto para ocasiones especiales.",
    category: "ropa",
    subcategory: "vestidos",
    rating: 4.5,
    inStock: true,
    features: ["Tallas S-XL", "Algodón", "Lavable"],
    tags: ["vintage", "floral", "elegante"]
  },
  {
    id: 4,
    name: "Blusa Casual Oversize",
    price: 4500,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
    description: "Blusa cómoda y moderna, ideal para uso diario.",
    category: "ropa",
    subcategory: "blusas",
    rating: 4.3,
    inStock: true,
    features: ["Tallas S-XXL", "Poliéster", "Cómoda"],
    tags: ["casual", "cómoda", "moderna"]
  },
  {
    id: 5,
    name: "Pantalón Cargo Streetwear",
    price: 7200,
    originalPrice: 9000,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400",
    description: "Pantalón cargo moderno con múltiples bolsillos.",
    category: "ropa",
    subcategory: "pantalones",
    rating: 4.6,
    inStock: false,
    features: ["Tallas S-XL", "Resistente", "Multi-bolsillos"],
    tags: ["streetwear", "urbano", "funcional"]
  },
  {
    id: 6,
    name: "Crop Top Básico",
    price: 3500,
    originalPrice: 4500,
    image: "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=400",
    description: "Top corto básico, perfecto para combinar.",
    category: "ropa",
    subcategory: "tops",
    rating: 4.4,
    inStock: true,
    features: ["Tallas XS-L", "Algodón", "Básico"],
    tags: ["básico", "versátil", "juvenil"]
  }
];

export const subcategories: Subcategories = {
  perfumes: ['mujer', 'hombre'],
  ropa: ['vestidos', 'blusas', 'pantalones', 'tops']
};

// Utilidades
export const getCategories = (products: Product[]): Category[] => [
  { id: 'all', name: 'Todos', count: products.length },
  { id: 'perfumes', name: 'Perfumes', count: products.filter(p => p.category === 'perfumes').length },
  { id: 'ropa', name: 'Ropa', count: products.filter(p => p.category === 'ropa').length }
];

export const filterProducts = (
  products: Product[], 
  category: string, 
  searchTerm: string,
  gender?: string
): Product[] => {
  return products.filter(product => {
    // Filtro de categoría
    const matchesCategory = category === 'all' || product.category === category;
    
    // Filtro de búsqueda
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de género (solo aplicar si se especifica un género y el producto es perfume)
    let matchesGender = true;
    if (gender && gender !== 'all') {
      if (product.category === 'perfumes') {
        if (gender === 'unisex') {
          // Para unisex: productos marcados como unisex O sin género definido
          matchesGender = product.gender === 'unisex' || !product.gender;
        } else {
          // Para hombre/mujer: coincidencia exacta
          matchesGender = product.gender === gender;
        }
      } else {
        // Si no es perfume, no aplicar filtro de género
        matchesGender = true;
      }
    }
    
    return matchesCategory && matchesSearch && matchesGender;
  });
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG'
  }).format(price);
};

export const calculateDiscount = (price: number, originalPrice: number): number => {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};