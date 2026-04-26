import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
);

describe('FavoritesContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia vacío', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('toggle suma y resta', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => result.current.toggle(1));
    expect(result.current.favoriteIds).toEqual([1]);
    expect(result.current.isFavorite(1)).toBe(true);

    act(() => result.current.toggle(1));
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.isFavorite(1)).toBe(false);
  });

  it('persiste en localStorage', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => result.current.toggle(42));
    expect(localStorage.getItem('annya:favorites')).toBe('[42]');
  });

  it('hidrata de localStorage', () => {
    localStorage.setItem('annya:favorites', '[7,9]');
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favoriteIds).toEqual([7, 9]);
  });
});
