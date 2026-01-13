// src/components/ui/ProductCard.tsx

'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, Star, Heart, Tag, Palette } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscount, getGenderIcon } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';


interface ProductCardProps {
  product: Product;
  isListView?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({
  product,
  isListView = false,
  isFavorite,
  onToggleFavorite,
  onViewDetails
}: ProductCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();

  const handleAddToCart = () => {
    // Agregar con el primer talle y color disponible
    const defaultSize = product.sizes?.[0];
    const defaultColor = product.colors?.[0];
    addToCart(product, defaultSize, defaultColor);
    setIsCartOpen(true);
  };

  // Detectar si es móvil para mostrar/ocultar descripción
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const availableSizes = product.sizes?.slice(0, 3) || []; // Mostrar solo 3 talles
  const availableColors = product.colors?.slice(0, 3) || []; // Mostrar solo 3 colores

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${isListView ? 'flex' : ''}`}>
      <div className={`relative ${isListView ? 'w-32 sm:w-48 flex-shrink-0' : ''}`}>
        <img
          src={product.image}
          alt={product.name}
          className={`w-full object-cover ${isListView ? 'h-full' : 'h-48 sm:h-64'}`}
        />

        {/* Overlay de agotado */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-base bg-red-500 px-3 py-1 rounded-full">
              Agotado
            </span>
          </div>
        )}

        {/* Badge de descuento */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            -{calculateDiscount(product.price, product.originalPrice!)}%
          </div>
        )}

        {/* Botón de favorito */}
        <button
          onClick={() => onToggleFavorite(product.id)}
          className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100 transition-all"
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>

        {/* Badge de categoría */}
        <div className="absolute bottom-2 left-2">
          <span className="text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded-full">
            {product.category === 'prendas' ? '👕' : '👟'} {product.subcategory}
          </span>
        </div>
      </div>

      <div className={`p-3 sm:p-4 flex-1 flex flex-col ${isListView ? 'justify-between' : ''}`}>
        {/* Header con marca y género */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {product.brand && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {product.brand}
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {getGenderIcon(product.gender)} {product.gender}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-xs sm:text-sm text-gray-600">{product.rating}</span>
          </div>
        </div>

        {/* Nombre del producto */}
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Descripción - solo en vista lista o desktop */}
        {(isListView || !isMobile) && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Material */}
        {product.material && (
          <div className="mb-3">
            <span className="text-xs text-gray-500">
              <Tag className="w-3 h-3 inline mr-1" />
              {product.material}
            </span>
          </div>
        )}

        {/* Talles disponibles */}
        {availableSizes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-1 flex-wrap">
              <span className="text-xs text-gray-500 mr-1">Talles:</span>
              {availableSizes.map((size) => (
                <span key={size} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {size}
                </span>
              ))}
              {product.sizes && product.sizes.length > 3 && (
                <span className="text-xs text-gray-500">+{product.sizes.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Colores disponibles */}
        {availableColors.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-1">
              <Palette className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500 mr-1">Colores:</span>
              <div className="flex space-x-1">
                {availableColors.map((color, index) => (
                  <span
                    key={index}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                  >
                    {color.length > 8 ? `${color.substring(0, 8)}...` : color}
                  </span>
                ))}
                {product.colors && product.colors.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features - solo las primeras 3 en mobile */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.features.slice(0, isListView ? 5 : 3).map((feature, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {feature}
            </span>
          ))}
          {product.features.length > 3 && !isListView && (
            <span className="text-xs text-gray-500">+{product.features.length - 3}</span>
          )}
        </div>

        {/* Precio y botones de acción */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {/* Precio */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.originalPrice!)}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                    -{calculateDiscount(product.price, product.originalPrice!)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Botones - Grid de 2 columnas siempre visible */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onViewDetails(product)}
              className="px-3 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver</span>
            </button>

            <button
              onClick={handleAddToCart}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${product.inStock
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              disabled={!product.inStock}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{product.inStock ? 'Agregar' : 'Agotado'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}