'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Product } from '@/lib/types';

const STORAGE_KEY = 'annya:cart';

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
};

type CartOpts = { size?: string; color?: string; quantity?: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, opts?: CartOpts) => void;
  removeItem: (productId: number, opts?: { size?: string; color?: string }) => void;
  updateQuantity: (
    productId: number,
    qty: number,
    opts?: { size?: string; color?: string }
  ) => void;
  clear: () => void;
  itemCount: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (
  a: CartItem,
  productId: number,
  size?: string,
  color?: string
) =>
  a.productId === productId &&
  (a.size ?? null) === (size ?? null) &&
  (a.color ?? null) === (color ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = (product: Product, opts: CartOpts = {}) => {
    const qty = opts.quantity ?? 1;
    setItems((prev) => {
      const idx = prev.findIndex((it) =>
        sameLine(it, product.id, opts.size, opts.color)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: qty,
          size: opts.size,
          color: opts.color,
        },
      ];
    });
  };

  const removeItem = (
    productId: number,
    opts: { size?: string; color?: string } = {}
  ) => {
    setItems((prev) =>
      prev.filter((it) => !sameLine(it, productId, opts.size, opts.color))
    );
  };

  const updateQuantity = (
    productId: number,
    qty: number,
    opts: { size?: string; color?: string } = {}
  ) => {
    if (qty <= 0) {
      removeItem(productId, opts);
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        sameLine(it, productId, opts.size, opts.color) ? { ...it, quantity: qty } : it
      )
    );
  };

  const clear = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((s, it) => s + it.price * it.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, itemCount, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
