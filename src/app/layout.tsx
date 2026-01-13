// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import CartModal from '@/components/ui/CartModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tu Tienda Online - Perfumes y Moda',
  description: 'Los mejores perfumes y moda al mejor precio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              {children}
              <CartModal />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}