// src/components/ui/ProductModal.tsx

import { useState } from 'react';
import { X, Star, MessageCircle, ChevronLeft, ChevronRight, Palette, Ruler } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscount } from '@/lib/products';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { useProducts } from '@/contexts/ProductsContext'; // ✅ Importar para obtener settings

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { settings } = useProducts(); // ✅ Obtener settings con número de WhatsApp
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!product) return null;

  // Combinar imagen principal con imágenes adicionales
  const allImages = (() => {
    const images = [];
    
    if (product.image) {
      images.push(product.image);
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && img !== product.image) {
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

  // ✅ USAR NÚMERO DINÁMICO DESDE SETTINGS
  const handleWhatsAppClick = () => {
    sendWhatsAppMessage(
      product, 
      { size: selectedSize, color: selectedColor },
      settings.whatsappNumber // ✅ Pasar el número desde settings
    );
  };

  return (
    <div className="fixed inset-0 bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto relative shadow-2xl border border-gray-200">
        <div className="sticky top-0 right-0 z-10 flex justify-end p-3 sm:p-4 bg-white bg-opacity-95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-3 sm:px-6 pb-3 sm:pb-6 -mt-16 pt-16">
          <div className="md:flex md:space-x-6">
            {/* Image Section with Carousel */}
            <div className="md:w-1/2 mb-6 md:mb-0">
              {/* Main Image */}
              <div className="relative h-64 sm:h-80 md:h-96 mb-4">
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={`${product.name} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                
                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
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
            <div className="md:w-1/2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {product.category === 'prendas' ? '👕 Prendas' : '👟 Calzados'}
                  </span>
                  <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    {product.subcategory}
                  </span>
                </div>
                {!product.inStock && (
                  <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
                    Agotado
                  </span>
                )}
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
              
              {/* Brand and Gender */}
              <div className="flex items-center space-x-4 mb-4">
                {product.brand && (
                  <div className="text-sm text-gray-600">
                    <strong>Marca:</strong> {product.brand}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <strong>Para:</strong> {product.gender === 'mujer' ? '👩 Mujer' : product.gender === 'hombre' ? '👨 Hombre' : '👥 Unisex'}
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 text-sm sm:text-base">{product.description}</p>
              
              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Ruler className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Selecciona tu talle</h3>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                        className={`p-2 text-sm border rounded-lg transition-colors ${
                          selectedSize === size
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Palette className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Colores disponibles</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          selectedColor === color
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Material */}
              {product.material && (
                <div className="mb-6">
                  <div className="text-sm text-gray-600">
                    <strong>Material:</strong> {product.material}
                  </div>
                </div>
              )}
              
              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Características</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <span key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs sm:text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Price and Buy Button */}
              <div className="sticky bottom-0 bg-white pt-6 border-t">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1">
                        <span className="text-base sm:text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                          -{calculateDiscount(product.price, product.originalPrice)}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleWhatsAppClick}
                    disabled={!product.inStock}
                    className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base font-medium ${
                      product.inStock
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{product.inStock ? 'Comprar por WhatsApp' : 'No Disponible'}</span>
                  </button>
                </div>
                
                {/* Selected options summary */}
                {(selectedSize || selectedColor) && (
                  <div className="mt-3 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Seleccionado:</strong>
                    {selectedSize && ` Talle: ${selectedSize}`}
                    {selectedColor && ` Color: ${selectedColor}`}
                  </div>
                )}
                
                {/* ✅ MOSTRAR NÚMERO DE WHATSAPP ACTUAL */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  📞 WhatsApp: {settings.whatsappNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}