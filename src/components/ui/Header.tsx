// src/components/ui/Header.tsx

'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface HeaderProps {
  storeName?: string;
  whatsappNumber?: string;
  storeIcon?: string;
}

export default function Header({
  storeName = "Tu Tienda Online",
  whatsappNumber = "+595 98 123 4567",
  storeIcon
}: HeaderProps) {
  const { getItemCount, setIsCartOpen } = useCart();
  const itemCount = getItemCount();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {storeIcon && (
              <img
                src={storeIcon}
                alt={`${storeName} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{storeName}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-sm text-gray-600">WhatsApp: {whatsappNumber}</span>

            {/* Botón del Carrito */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}