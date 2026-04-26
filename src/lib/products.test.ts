import { describe, it, expect } from 'vitest';
import { isOnOffer, discountPercent, isNewArrival } from './products';
import type { Product } from './types';

const base = (over: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'p',
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

describe('isOnOffer', () => {
  it('true cuando original > price', () => {
    expect(isOnOffer(base({ price: 800, originalPrice: 1000 }))).toBe(true);
  });
  it('false sin originalPrice', () => {
    expect(isOnOffer(base({ price: 800 }))).toBe(false);
  });
  it('false cuando original <= price', () => {
    expect(isOnOffer(base({ price: 1000, originalPrice: 1000 }))).toBe(false);
  });
});

describe('discountPercent', () => {
  it('redondea correctamente', () => {
    expect(discountPercent(base({ price: 600, originalPrice: 1000 }))).toBe(40);
    expect(discountPercent(base({ price: 750, originalPrice: 1000 }))).toBe(25);
  });
  it('0 si no está en oferta', () => {
    expect(discountPercent(base({ price: 1000 }))).toBe(0);
  });
});

describe('isNewArrival', () => {
  it('true para fechas <14 días', () => {
    const recent = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(isNewArrival(base({ createdAt: recent }))).toBe(true);
  });
  it('false para fechas viejas', () => {
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    expect(isNewArrival(base({ createdAt: old }))).toBe(false);
  });
  it('false sin createdAt', () => {
    expect(isNewArrival(base({}))).toBe(false);
  });
});
