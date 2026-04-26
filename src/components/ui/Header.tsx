'use client';

import { useEffect, useRef, useState } from 'react';
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

const focusCatalogSearch = () => {
  const input = document.getElementById('catalog-search') as HTMLInputElement | null;
  const target = document.getElementById('catalogo');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Demoramos el focus para que el scroll arranque y el input quede visible.
  setTimeout(() => input?.focus(), 350);
};

export default function Header({
  favoritesCount = 0,
  cartCount = 0,
  onCartClick,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [favPulse, setFavPulse] = useState(false);
  const prevCartRef = useRef(cartCount);
  const prevFavRef = useRef(favoritesCount);

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

  // Pulse cuando suma item al carrito
  useEffect(() => {
    if (cartCount > prevCartRef.current) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 400);
      prevCartRef.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCartRef.current = cartCount;
  }, [cartCount]);

  // Pulse al sumar favorito
  useEffect(() => {
    if (favoritesCount > prevFavRef.current) {
      setFavPulse(true);
      const t = setTimeout(() => setFavPulse(false), 400);
      prevFavRef.current = favoritesCount;
      return () => clearTimeout(t);
    }
    prevFavRef.current = favoritesCount;
  }, [favoritesCount]);

  const handleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    focusCatalogSearch();
  };

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
          <Link href="/?gender=mujer#catalogo">Mujer</Link>
          <Link href="/?gender=hombre#catalogo">Hombre</Link>
          <Link href="/?cat=calzados#catalogo">Calzado</Link>
          <Link href="/#ofertas">Ofertas</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={handleSearch} aria-label="Buscar" className="p-1">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/favoritos" aria-label="Favoritos" className="relative p-1">
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-[10px] font-bold leading-none rounded-full px-1.5 py-0.5 ${
                  favPulse ? 'animate-badge-pulse' : ''
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </Link>
          <button onClick={onCartClick} aria-label="Carrito" className="relative p-1">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 bg-[color:var(--color-terra)] text-[color:var(--color-shell)] text-[10px] font-bold leading-none rounded-full px-1.5 py-0.5 ${
                  cartPulse ? 'animate-badge-pulse' : ''
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
