'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Heart, ShoppingBag } from 'lucide-react';
import Wordmark from './Wordmark';

interface HeaderProps {
  storeName?: string;
  whatsappNumber?: string;
  storeIcon?: string;
  favoritesCount?: number;
  cartCount?: number;
  onCartClick?: () => void;
}

export default function Header({
  favoritesCount = 0,
  cartCount = 0,
  onCartClick,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 32));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled
          ? 'bg-[color:var(--color-shell)]/95 backdrop-blur border-b border-[color:var(--color-cream)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Wordmark size="md" />

        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-[.2em] text-[color:var(--color-cocoa)]">
          <Link href="/?cat=mujer">Mujer</Link>
          <Link href="/?cat=hombre">Hombre</Link>
          <Link href="/?cat=calzados">Calzado</Link>
          <Link href="/?cat=ofertas">Ofertas</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button aria-label="Buscar" className="p-1">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/favoritos" aria-label="Favoritos" className="relative p-1">
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-[10px] font-bold leading-none rounded-full px-1.5 py-0.5">
                {favoritesCount}
              </span>
            )}
          </Link>
          <button onClick={onCartClick} aria-label="Carrito" className="relative p-1">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-terra)] text-[color:var(--color-shell)] text-[10px] font-bold leading-none rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
