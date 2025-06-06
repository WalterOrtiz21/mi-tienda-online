// src/components/ui/ProductModal.tsx

import { useState } from 'react';
import { X, Star, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscount } from '@/lib/products';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  // Combinar imagen principal con imágenes adicionales
  const allImages = (() => {
    const images = [];
    
    // Siempre agregar imagen principal primero
    if (product.image) {
      images.push(product.image);
    }
    
    // Agregar imágenes adicionales (sin duplicar la principal)
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && img !== product.image) { // Evitar duplicados
          images.push(img);
        }
      });
    }
    
    return images;
  })();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="md:flex">
            {/* Image Section with Carousel */}
            <div className="md:w-1/2 relative">
              {/* Main Image */}
              <div className="relative h-96 md:h-full">
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={`${product.name} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows (only if multiple images) */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip (only if multiple images) */}
              {allImages.length > 1 && (
                <div className="flex space-x-2 p-4 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {product.category === 'perfumes' ? 'Perfume' : 'Ropa'}
                </span>
                {!product.inStock && (
                  <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
                    Agotado
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">({product.rating})</span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">{product.description}</p>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Características</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <span key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t">
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{calculateDiscount(product.price, product.originalPrice)}% OFF
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => sendWhatsAppMessage(product)}
                  disabled={!product.inStock}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                    product.inStock
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{product.inStock ? 'Comprar' : 'No Disponible'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}