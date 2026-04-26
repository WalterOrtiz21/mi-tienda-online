'use client';

import { Product } from '@/lib/types';
import { formatGuarani } from '@/lib/whatsappMessage';
import ProductActionsMenu from './ProductActionsMenu';

type Props = {
  product: Product;
  storeName?: string;
  onToggleStock: (next: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

export default function ProductCardAdmin({
  product,
  storeName,
  onToggleStock,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: Props) {
  const onOffer = !!(product.originalPrice && product.originalPrice > product.price);

  return (
    <div
      className={`bg-[color:var(--color-shell)] rounded-lg shadow-sm p-3 flex gap-3 ${
        product.archived ? 'opacity-60' : ''
      }`}
    >
      <button onClick={onEdit} className="flex-shrink-0" aria-label="Editar">
        <img
          src={product.image}
          alt=""
          className="w-20 h-24 object-cover rounded bg-[color:var(--color-cream)]"
          loading="lazy"
        />
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={onEdit} className="text-left w-full block">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <p className="text-xs text-[color:var(--color-taupe)] capitalize truncate">
            {product.category} · {product.subcategory}
            {product.brand ? ` · ${product.brand}` : ''}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-medium">{formatGuarani(product.price)}</span>
            {onOffer && (
              <span className="text-xs line-through text-[color:var(--color-taupe)]">
                {formatGuarani(product.originalPrice!)}
              </span>
            )}
          </div>
        </button>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {product.archived && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-taupe)] text-[color:var(--color-shell)] tracking-wider uppercase">
              Archivado
            </span>
          )}
          {!product.archived && !product.inStock && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-terra)] text-[color:var(--color-shell)] tracking-wider uppercase">
              Agotado
            </span>
          )}
          {onOffer && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] tracking-wider uppercase">
              Oferta
            </span>
          )}

          <label className="ml-auto inline-flex items-center gap-2 text-xs cursor-pointer select-none">
            <span>Stock</span>
            <span className="relative inline-block w-9 h-5">
              <input
                type="checkbox"
                checked={product.inStock}
                onChange={(e) => onToggleStock(e.target.checked)}
                className="peer sr-only"
                aria-label="Toggle stock"
              />
              <span className="absolute inset-0 rounded-full bg-[color:var(--color-cream)] peer-checked:bg-[color:var(--color-cocoa)] transition-colors" />
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[color:var(--color-shell)] shadow transition-transform peer-checked:translate-x-4" />
            </span>
          </label>
        </div>
      </div>

      <div className="flex-shrink-0 self-start">
        <ProductActionsMenu
          product={product}
          storeName={storeName}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
