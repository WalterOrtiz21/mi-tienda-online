// src/components/ui/ProductModal.tsx

import { X, Star, MessageCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscount } from '@/lib/products';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="md:flex">
            <div className="md:w-1/2">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-96 md:h-full object-cover"
              />
            </div>
            
            <div className="md:w-1/2 p-8">
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
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
              
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
              
              <p className="text-gray-700 mb-6 text-lg">{product.description}</p>
              
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
                  <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
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
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                    product.inStock
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{product.inStock ? 'Comprar por WhatsApp' : 'No Disponible'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}