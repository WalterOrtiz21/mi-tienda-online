'use client';

import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { formatGuarani } from '@/lib/whatsappMessage';

const isOnOffer = (p: Product) => !!(p.originalPrice && p.originalPrice > p.price);

const discountPercent = (p: Product) =>
  isOnOffer(p) ? Math.round((1 - p.price / p.originalPrice!) * 100) : 0;

const isNewArrival = (p: Product & { createdAt?: string }) => {
  if (!p.createdAt) return false;
  const days = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  return days <= 14;
};

export default function ProductCard({
  product,
  isListView = false,
  onViewDetails,
}: {
  product: Product;
  isListView?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onViewDetails?: (p: Product) => void;
}) {
  const { isFavorite: isFav, toggle } = useFavorites();
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);

  const onOffer = isOnOffer(product);
  const discount = discountPercent(product);
  const isNew = isNewArrival(product);
  const fav = isFav(product.id);

  const secondImage =
    product.images && product.images.length > 0 ? product.images[0] : null;
  const displayImage = hovered && secondImage ? secondImage : product.image;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes?.[0];
    addItem(product, { size: defaultSize });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <article
      className={`group cursor-pointer ${isListView ? 'flex gap-4' : ''}`}
      onClick={() => onViewDetails?.(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`relative bg-[color:var(--color-cream)] overflow-hidden rounded ${
          isListView ? 'w-32 aspect-square flex-shrink-0' : 'aspect-[3/4]'
        }`}
      >
        {displayImage && (
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {onOffer && (
          <span className="absolute top-2 left-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm">
            −{discount}%
          </span>
        )}
        {!onOffer && isNew && (
          <span className="absolute top-2 left-2 border border-[color:var(--color-cocoa)] text-[color:var(--color-cocoa)] bg-[color:var(--color-shell)]/90 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm">
            NUEVO
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-2 right-2 bg-[color:var(--color-taupe)] text-[color:var(--color-shell)] text-[10px] tracking-wider px-2 py-0.5 rounded-sm">
            AGOTADO
          </span>
        )}

        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFav}
            aria-label="Favorito"
            className="p-2 bg-[color:var(--color-shell)] rounded-full shadow"
          >
            <Heart
              className={`w-4 h-4 ${
                fav
                  ? 'fill-[color:var(--color-terra)] text-[color:var(--color-terra)]'
                  : 'text-[color:var(--color-cocoa)]'
              }`}
            />
          </button>
          {product.inStock && (
            <button
              onClick={handleQuickAdd}
              aria-label="Agregar al carrito"
              className="p-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] rounded-full shadow"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`mt-3 ${isListView ? 'flex-1 mt-0' : ''}`}>
        <h3 className="font-display text-base text-[color:var(--color-cocoa)]">
          {product.name}
        </h3>
        <p className="text-xs text-[color:var(--color-taupe)] mt-0.5 capitalize">
          {product.subcategory}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-medium text-[color:var(--color-cocoa)]">
            {formatGuarani(product.price)}
          </span>
          {onOffer && (
            <span className="text-xs line-through text-[color:var(--color-taupe)]">
              {formatGuarani(product.originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
