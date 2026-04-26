'use client';

import { useState } from 'react';
import { X, Star, MessageCircle, ChevronLeft, ChevronRight, Palette, Ruler, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { formatGuarani } from '@/lib/whatsappMessage';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { settings } = useProducts();
  const { addItem } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!product) return null;

  const allImages = (() => {
    const images: string[] = [];
    if (product.image) images.push(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && img !== product.image) images.push(img);
      });
    }
    return images;
  })();

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % allImages.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + allImages.length) % allImages.length);

  const handleWhatsAppClick = () => {
    sendWhatsAppMessage(
      product,
      { size: selectedSize, color: selectedColor },
      settings.whatsappNumber
    );
  };

  const handleAddToCart = () => {
    addItem(product, {
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
  };

  const onOffer = product.originalPrice && product.originalPrice > product.price;
  const discount = onOffer
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-[color:var(--color-shell)] rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto relative shadow-2xl border border-[color:var(--color-cream)]">
        <div className="sticky top-0 right-0 z-10 flex justify-end p-3 sm:p-4 bg-[color:var(--color-shell)]/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-2 bg-[color:var(--color-cream)] rounded-full hover:bg-[color:var(--color-tan)]/30 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-6 pb-3 sm:pb-6 -mt-16 pt-16">
          <div className="md:flex md:space-x-6">
            {/* Imagen */}
            <div className="md:w-1/2 mb-6 md:mb-0">
              <div className="relative h-64 sm:h-80 md:h-96 mb-4">
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${product.name} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-[color:var(--color-shell)]/90 text-[color:var(--color-cocoa)] p-2 rounded-full shadow-lg"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-[color:var(--color-shell)]/90 text-[color:var(--color-cocoa)] p-2 rounded-full shadow-lg"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-[color:var(--color-shell)]/90 text-[color:var(--color-cocoa)] px-2 py-1 rounded-full text-xs font-medium">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-[color:var(--color-cocoa)]'
                          : 'border-[color:var(--color-cream)]'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:w-1/2">
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow capitalize">{product.subcategory}</p>
                {!product.inStock && (
                  <span className="text-xs bg-[color:var(--color-taupe)] text-[color:var(--color-shell)] px-3 py-1 rounded-full tracking-wider uppercase">
                    Agotado
                  </span>
                )}
              </div>

              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[color:var(--color-cocoa)] mb-3">
                {product.name}
              </h2>

              <div className="flex items-center space-x-4 text-sm text-[color:var(--color-taupe)] mb-4">
                {product.brand && <span><strong>Marca:</strong> {product.brand}</span>}
                <span>
                  <strong>Para:</strong>{' '}
                  {product.gender === 'mujer' ? 'Mujer' : product.gender === 'hombre' ? 'Hombre' : 'Unisex'}
                </span>
              </div>

              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-[color:var(--color-tan)] text-[color:var(--color-tan)]'
                        : 'text-[color:var(--color-cream)]'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-[color:var(--color-taupe)]">({product.rating})</span>
              </div>

              <p className="text-[color:var(--color-cocoa)]/80 mb-6 text-sm sm:text-base leading-relaxed">
                {product.description}
              </p>

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Ruler className="w-4 h-4 mr-2 text-[color:var(--color-taupe)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--color-cocoa)]">Selecciona tu talle</h3>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                        className={`p-2 text-sm border rounded-md transition-colors ${
                          selectedSize === size
                            ? 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] border-[color:var(--color-cocoa)]'
                            : 'border-[color:var(--color-cream)] text-[color:var(--color-cocoa)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Palette className="w-4 h-4 mr-2 text-[color:var(--color-taupe)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--color-cocoa)]">Colores disponibles</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                        className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                          selectedColor === color
                            ? 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] border-[color:var(--color-cocoa)]'
                            : 'border-[color:var(--color-cream)] text-[color:var(--color-cocoa)]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.material && (
                <div className="mb-6 text-sm text-[color:var(--color-taupe)]">
                  <strong>Material:</strong> {product.material}
                </div>
              )}

              {product.features.length > 0 && (
                <div className="mb-6">
                  <p className="eyebrow mb-2">Características</p>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, i) => (
                      <span
                        key={i}
                        className="bg-[color:var(--color-cream)] text-[color:var(--color-cocoa)] px-3 py-1 rounded-full text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 bg-[color:var(--color-shell)] pt-6 border-t border-[color:var(--color-cream)]">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display text-3xl text-[color:var(--color-cocoa)]">
                    {formatGuarani(product.price)}
                  </span>
                  {onOffer && (
                    <>
                      <span className="text-base line-through text-[color:var(--color-taupe)]">
                        {formatGuarani(product.originalPrice!)}
                      </span>
                      <span className="bg-[color:var(--color-terra)] text-[color:var(--color-shell)] px-2 py-0.5 rounded text-xs font-semibold">
                        −{discount}%
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="flex-1 py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Agregar al carrito
                  </button>
                  <button
                    onClick={handleWhatsAppClick}
                    disabled={!product.inStock}
                    className="flex-1 py-3 border border-[color:var(--color-cocoa)] text-[color:var(--color-cocoa)] text-sm uppercase tracking-[.2em] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>

                {(selectedSize || selectedColor) && (
                  <div className="mt-3 text-xs text-[color:var(--color-taupe)] bg-[color:var(--color-cream)] p-2 rounded">
                    <strong>Seleccionado:</strong>
                    {selectedSize && ` Talle: ${selectedSize}`}
                    {selectedColor && ` Color: ${selectedColor}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
