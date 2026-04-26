import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import type { Product } from '@/lib/types';

const sampleProduct = (over: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Test',
  description: '',
  price: 1000,
  image: '',
  category: 'prendas',
  subcategory: 'remeras',
  gender: 'unisex',
  sizes: [],
  rating: 4,
  inStock: true,
  features: [],
  tags: [],
  ...over,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => localStorage.clear());

  it('inicia vacío', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('addItem suma item nuevo', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' }));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(1);
    expect(result.current.total).toBe(100);
  });

  it('addItem mismo producto+talle suma cantidad', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' });
      result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);
  });

  it('addItem mismo producto distinto talle es item separado', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' });
      result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'L' });
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.itemCount).toBe(2);
  });

  it('updateQuantity y removeItem', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' }));
    act(() => result.current.updateQuantity(1, 3, { size: 'M' }));
    expect(result.current.itemCount).toBe(3);
    expect(result.current.total).toBe(300);

    act(() => result.current.removeItem(1, { size: 'M' }));
    expect(result.current.items).toEqual([]);
  });

  it('clear vacía', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(sampleProduct({ id: 1, price: 100 })));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });

  it('persiste en localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(sampleProduct({ id: 1, price: 100 }), { size: 'M' }));
    const raw = localStorage.getItem('annya:cart');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toHaveLength(1);
  });
});
