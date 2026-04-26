'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'annya:favorites';

type FavoritesContextValue = {
  favoriteIds: number[];
  toggle: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed.filter((n) => typeof n === 'number'));
        }
      }
    } catch {
      // localStorage no disponible
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds, hydrated]);

  const toggle = (productId: number) =>
    setFavoriteIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

  const isFavorite = (productId: number) => favoriteIds.includes(productId);

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, toggle, isFavorite, count: favoriteIds.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
