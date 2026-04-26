'use client';

import { useEffect } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/contexts/ProductsContext';
import { formatGuarani, formatWhatsAppMessage, whatsappUrl } from '@/lib/whatsappMessage';

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { settings } = useProducts();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    const msg = formatWhatsAppMessage(
      items.map((it) => ({
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
      }))
    );
    window.open(whatsappUrl(settings.whatsappNumber, msg), '_blank');
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[color:var(--color-shell)] shadow-2xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-5 border-b border-[color:var(--color-cream)]">
          <h2 className="font-display text-2xl">Tu carrito</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
          {items.length === 0 ? (
            <div className="p-10 text-center text-[color:var(--color-taupe)]">
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-cream)]">
              {items.map((it) => (
                <li
                  key={`${it.productId}-${it.size ?? ''}-${it.color ?? ''}`}
                  className="p-4 flex gap-3"
                >
                  <div className="w-16 h-20 bg-[color:var(--color-cream)] rounded overflow-hidden flex-shrink-0">
                    {it.image && (
                      <img src={it.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.name}</p>
                    <p className="text-xs text-[color:var(--color-taupe)] mt-0.5">
                      {[it.size, it.color].filter(Boolean).join(' · ') || 'Sin variante'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(it.productId, it.quantity - 1, {
                            size: it.size,
                            color: it.color,
                          })
                        }
                        className="p-1 border border-[color:var(--color-cream)] rounded"
                        aria-label="Restar"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{it.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(it.productId, it.quantity + 1, {
                            size: it.size,
                            color: it.color,
                          })
                        }
                        className="p-1 border border-[color:var(--color-cream)] rounded"
                        aria-label="Sumar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() =>
                          removeItem(it.productId, { size: it.size, color: it.color })
                        }
                        className="ml-auto p-1 text-[color:var(--color-taupe)] hover:text-[color:var(--color-terra)]"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatGuarani(it.price * it.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 border-t border-[color:var(--color-cream)] bg-[color:var(--color-shell)]">
          <div className="flex justify-between mb-3">
            <span className="text-sm uppercase tracking-wider">Total</span>
            <span className="font-display text-xl">{formatGuarani(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em] disabled:opacity-50"
          >
            Pedir por WhatsApp
          </button>
        </div>
      </aside>
    </>
  );
}
