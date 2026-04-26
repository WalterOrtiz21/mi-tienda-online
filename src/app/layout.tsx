import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Annya Modas',
  description: 'Prendas y calzados — boutique online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AuthProvider>
          <ProductsProvider>
            <FavoritesProvider>
              <CartProvider>{children}</CartProvider>
            </FavoritesProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
