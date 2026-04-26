# Rediseño front "Boutique cálido" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir el front público con dirección "Boutique cálido" (paleta tierra/crema, serif Playfair + Inter), sumar carrito y favoritos persistentes en localStorage, y reemplazar la home actual por una composición de secciones temáticas con scroll narrado.

**Architecture:** 3 fases secuenciales, cada una deployable. Fase 1 instala el sistema visual (tokens, fonts, header sticky). Fase 2 agrega los contexts de estado (Cart/Favorites) con persistencia + reescribe ProductCard. Fase 3 construye las secciones de la home y la recompone.

**Tech Stack:** Next.js 15.5 (App Router), React 19, Tailwind CSS v4, Supabase, Vitest + Testing Library para lógica pura.

**Spec:** `docs/superpowers/specs/2026-04-26-rediseno-front-boutique-design.md`

---

## File structure

### Phase 1 — Fundaciones
- Modify: `src/app/globals.css` (replace with design tokens)
- Modify: `src/app/layout.tsx` (cargar fuentes)
- Modify: `src/components/ui/Header.tsx` (sticky + scroll behavior)
- Modify: `src/components/ui/Footer.tsx` (restyle)
- Create: `src/components/ui/Wordmark.tsx`

### Phase 2 — Estado + ProductCard
- Create: `vitest.config.ts`, `src/test-setup.ts`
- Create: `src/contexts/CartContext.tsx`, `src/contexts/CartContext.test.tsx`
- Create: `src/contexts/FavoritesContext.tsx`, `src/contexts/FavoritesContext.test.tsx`
- Create: `src/lib/whatsappMessage.ts`, `src/lib/whatsappMessage.test.ts`
- Create: `src/components/ui/CartDrawer.tsx`
- Create: `src/app/favoritos/page.tsx`
- Modify: `src/app/layout.tsx` (envolver con providers)
- Modify: `src/components/ui/Header.tsx` (cablear badges + drawer)
- Modify: `src/components/ui/ProductCard.tsx` (rewrite)
- Modify: `src/components/ui/ProductModal.tsx` (restyle + cart button)

### Phase 3 — Home sections
- Modify: `src/lib/types.ts` (sumar `createdAt`)
- Modify: `src/lib/database.ts` (mapeo + select)
- Modify: `src/lib/products.ts` (helpers)
- Create: `src/lib/products.test.ts`
- Create: `src/components/ui/Hero.tsx`
- Create: `src/components/ui/ServiceBar.tsx`
- Create: `src/components/ui/OffersSection.tsx`
- Create: `src/components/ui/NewArrivalsSection.tsx`
- Create: `src/components/ui/CategoriesSection.tsx`
- Create: `src/components/ui/FilterBar.tsx`
- Create: `src/components/ui/CatalogSection.tsx`
- Modify: `src/app/page.tsx` (reescribir como composición)
- Delete: `src/components/ui/Sidebar.tsx`

---

# Phase 1 — Fundaciones visuales

## Task 1: Design tokens en globals.css

**Files:**
- Modify (replace): `src/app/globals.css`

- [ ] **Step 1: Reemplazar globals.css completo**

```css
@import "tailwindcss";

:root {
  /* Paleta */
  --color-shell:  #faf8f5;
  --color-cream:  #f4ebe1;
  --color-tan:    #c9a87c;
  --color-taupe:  #8b7d6b;
  --color-cocoa:  #4a3729;
  --color-terra:  #a8453a;

  /* Texto */
  --text-primary:   var(--color-cocoa);
  --text-secondary: var(--color-taupe);
  --text-inverse:   var(--color-shell);

  /* Fondos */
  --bg-primary:   var(--color-shell);
  --bg-secondary: var(--color-cream);

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Sombras */
  --shadow-card: 0 8px 24px rgba(74, 55, 41, .08);
  --shadow-lg:   0 16px 40px rgba(74, 55, 41, .12);
}

@theme inline {
  --color-shell:  var(--color-shell);
  --color-cream:  var(--color-cream);
  --color-tan:    var(--color-tan);
  --color-taupe:  var(--color-taupe);
  --color-cocoa:  var(--color-cocoa);
  --color-terra:  var(--color-terra);
  --font-display: var(--font-playfair);
  --font-sans:    var(--font-inter);
}

@layer base {
  * { color-scheme: light; }

  html, body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-inter), system-ui, sans-serif;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-playfair), Georgia, serif;
    font-weight: 500;
    color: var(--text-primary);
  }

  .font-display { font-family: var(--font-playfair), Georgia, serif; }
  .eyebrow {
    font-family: var(--font-inter), sans-serif;
    font-size: 11px;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
}
```

- [ ] **Step 2: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: Compila sin errores. Es probable que warnings de Tailwind sobre clases custom — ignorables si pasa el build.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "Phase 1.1: design tokens en globals.css"
```

---

## Task 2: Cargar Playfair Display + Inter en layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Leer layout.tsx actual para entender qué hay**

Run: `cat src/app/layout.tsx`

- [ ] **Step 2: Reemplazar layout.tsx con la versión que carga las fuentes**

```tsx
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { AuthProvider } from '@/contexts/AuthContext';

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
          <ProductsProvider>{children}</ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

> Nota: si el `layout.tsx` actual no envolvía con `AuthProvider` o `ProductsProvider`, dejá los que ya estaban. Confirmá tras pegar.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Compila. Verifica que `next/font/google` descarga las fuentes (sin red en CI puede fallar — solo aplica en dev local).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Phase 1.2: cargar Playfair Display + Inter"
```

---

## Task 3: Componente Wordmark

**Files:**
- Create: `src/components/ui/Wordmark.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export default function Wordmark({
  size = 'md',
  href = '/',
  className = '',
}: {
  size?: Size;
  href?: string | null;
  className?: string;
}) {
  const content = (
    <span
      className={`font-display font-semibold tracking-tight text-[color:var(--color-cocoa)] ${sizeClasses[size]} ${className}`}
    >
      annya
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Wordmark.tsx
git commit -m "Phase 1.3: componente Wordmark reusable"
```

---

## Task 4: Header sticky con transición transparente→sólido

**Files:**
- Modify (replace): `src/components/ui/Header.tsx`

- [ ] **Step 1: Reemplazar Header.tsx con versión sticky**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Heart, ShoppingBag } from 'lucide-react';
import Wordmark from './Wordmark';

interface HeaderProps {
  storeName?: string;
  whatsappNumber?: string;
  storeIcon?: string;
  // Slots para badges (vienen en Phase 2)
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
```

- [ ] **Step 2: Ajustar la home para compensar el header fixed**

Edit `src/app/page.tsx`: en el div root (`<div className="min-h-screen bg-gray-50">`) agregar `pt-16` para que el contenido no quede tapado.

```diff
-    <div className="min-h-screen bg-gray-50">
+    <div className="min-h-screen bg-[color:var(--bg-primary)] pt-16">
```

- [ ] **Step 3: Build + verificación visual**

Run: `npm run build && npm run dev`
Abrí `http://localhost:3000` y verifica:
- Header transparente sobre el contenido al estar scroll arriba.
- Al scrollear más de 32px, el fondo se vuelve sólido (`shell`) con borde inferior.
- Logo "annya" en serif lowercase.
- Iconos search/♡/🛒 visibles a la derecha. Badges no aparecen porque cartCount=0 y favoritesCount=0.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Header.tsx src/app/page.tsx
git commit -m "Phase 1.4: header sticky con transición transparente→sólido"
```

---

## Task 5: Footer restyle

**Files:**
- Modify (replace): `src/components/ui/Footer.tsx`

- [ ] **Step 1: Leer Footer actual**

Run: `cat src/components/ui/Footer.tsx`

- [ ] **Step 2: Reemplazar con versión nueva**

```tsx
import Wordmark from './Wordmark';

export default function Footer({
  storeName,
  whatsappNumber,
}: {
  storeName?: string;
  whatsappNumber?: string;
}) {
  const wpHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <footer className="mt-20 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Wordmark size="lg" href={null} className="!text-[color:var(--color-shell)]" />
          <p className="mt-4 text-sm text-[color:var(--color-cream)] max-w-xs">
            {storeName ?? 'Annya Modas'} — prendas y calzados, hechos para que te animes.
          </p>
        </div>

        <div>
          <p className="eyebrow !text-[color:var(--color-tan)] mb-3">Ayuda</p>
          <ul className="space-y-2 text-sm">
            <li><a href={wpHref} target="_blank" rel="noopener" className="hover:underline">WhatsApp</a></li>
            <li>Envíos a todo Paraguay</li>
            <li>Cambios y devoluciones</li>
          </ul>
        </div>

        <div>
          <p className="eyebrow !text-[color:var(--color-tan)] mb-3">Contacto</p>
          {whatsappNumber && (
            <p className="text-sm">+{whatsappNumber}</p>
          )}
          <p className="text-sm mt-2 text-[color:var(--color-cream)]">
            © {new Date().getFullYear()} Annya Modas
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Build + visual**

Run: `npm run build && npm run dev`
Verifica el footer al pie de la home: fondo cocoa, texto crema/shell, layout en 3 columnas.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Footer.tsx
git commit -m "Phase 1.5: footer restyle a paleta boutique"
```

---

## Phase 1 checkpoint

```bash
git push origin main
```

Verifica en Vercel que el deploy pasa. La home se ve diferente (paleta nueva, fonts, header sticky) pero la estructura sigue siendo la misma.

---

# Phase 2 — Estado + ProductCard

## Task 6: Setup Vitest + Testing Library

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`
- Modify: `package.json` (script + deps)
- Modify: `tsconfig.json` (incluir vitest globals)

- [ ] **Step 1: Instalar dependencies de test**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Crear vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Crear src/test-setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Agregar script en package.json**

Edit `package.json`, agregar dentro de `"scripts"`:

```json
"test": "vitest"
```

- [ ] **Step 5: Update tsconfig.json para vitest globals**

Edit `tsconfig.json`, sumar `"vitest/globals"` a `compilerOptions.types`. Si no existe el array, agregalo.

```diff
   "compilerOptions": {
+    "types": ["vitest/globals"],
     ...
```

- [ ] **Step 6: Verificar que el setup funciona con un sample**

Crear `src/lib/sample.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('sample', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test -- --run`
Expected: 1 test pasa.

Borrar `src/lib/sample.test.ts` después de confirmar.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/test-setup.ts package.json package-lock.json tsconfig.json
git commit -m "Phase 2.1: setup Vitest + Testing Library"
```

---

## Task 7: FavoritesContext con persistencia

**Files:**
- Create: `src/contexts/FavoritesContext.tsx`
- Create: `src/contexts/FavoritesContext.test.tsx`

- [ ] **Step 1: Escribir el test primero**

```tsx
// src/contexts/FavoritesContext.test.tsx
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
```

- [ ] **Step 2: Run test, verificar que falla**

Run: `npm test -- --run src/contexts/FavoritesContext.test.tsx`
Expected: FAIL — no existe `./FavoritesContext`.

- [ ] **Step 3: Implementar FavoritesContext**

```tsx
// src/contexts/FavoritesContext.tsx
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
        if (Array.isArray(parsed)) setFavoriteIds(parsed.filter((n) => typeof n === 'number'));
      }
    } catch {
      // localStorage no disponible: queda vacío
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
    <FavoritesContext.Provider value={{ favoriteIds, toggle, isFavorite, count: favoriteIds.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
```

- [ ] **Step 4: Run tests, verificar que pasan**

Run: `npm test -- --run src/contexts/FavoritesContext.test.tsx`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/FavoritesContext.tsx src/contexts/FavoritesContext.test.tsx
git commit -m "Phase 2.2: FavoritesContext con persistencia + tests"
```

---

## Task 8: Helper formatWhatsAppMessage

**Files:**
- Create: `src/lib/whatsappMessage.ts`
- Create: `src/lib/whatsappMessage.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// src/lib/whatsappMessage.test.ts
import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage, formatGuarani } from './whatsappMessage';

describe('formatGuarani', () => {
  it('formatea con separador de miles', () => {
    expect(formatGuarani(7200)).toBe('Gs. 7.200');
    expect(formatGuarani(1000000)).toBe('Gs. 1.000.000');
  });
});

describe('formatWhatsAppMessage', () => {
  it('arma mensaje con un item', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Vestido Floral', price: 7200, quantity: 1, size: 'M', color: 'Azul' },
    ]);
    expect(msg).toContain('Hola');
    expect(msg).toContain('Vestido Floral (M, Azul) × 1');
    expect(msg).toContain('Gs. 7.200');
    expect(msg).toContain('Total: Gs. 7.200');
  });

  it('arma mensaje con múltiples items y suma total', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Vestido', price: 7200, quantity: 1 },
      { name: 'Botas', price: 18000, quantity: 2 },
    ]);
    expect(msg).toContain('Vestido × 1');
    expect(msg).toContain('Botas × 2');
    expect(msg).toContain('Total: Gs. 43.200');
  });

  it('omite size/color si no están', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Producto', price: 1000, quantity: 1 },
    ]);
    expect(msg).toContain('Producto × 1');
    expect(msg).not.toContain('()');
  });
});
```

- [ ] **Step 2: Run test, verificar que falla**

Run: `npm test -- --run src/lib/whatsappMessage.test.ts`
Expected: FAIL — no existe el módulo.

- [ ] **Step 3: Implementar el módulo**

```ts
// src/lib/whatsappMessage.ts

export type CartLine = {
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export const formatGuarani = (n: number): string =>
  `Gs. ${Math.round(n).toLocaleString('es-PY').replace(/,/g, '.')}`;

export function formatWhatsAppMessage(items: CartLine[]): string {
  const lines = items.map((it) => {
    const variants = [it.size, it.color].filter(Boolean).join(', ');
    const label = variants ? `${it.name} (${variants})` : it.name;
    return `• ${label} × ${it.quantity} — ${formatGuarani(it.price * it.quantity)}`;
  });

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return `Hola! Quiero pedir:\n\n${lines.join('\n')}\n\nTotal: ${formatGuarani(total)}`;
}

export function whatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run tests, verificar que pasan**

Run: `npm test -- --run src/lib/whatsappMessage.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsappMessage.ts src/lib/whatsappMessage.test.ts
git commit -m "Phase 2.3: helper formatWhatsAppMessage + formatGuarani"
```

---

## Task 9: CartContext con persistencia

**Files:**
- Create: `src/contexts/CartContext.tsx`
- Create: `src/contexts/CartContext.test.tsx`

- [ ] **Step 1: Escribir el test**

```tsx
// src/contexts/CartContext.test.tsx
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
```

- [ ] **Step 2: Run test, verificar que falla**

Run: `npm test -- --run src/contexts/CartContext.test.tsx`
Expected: FAIL — no existe el módulo.

- [ ] **Step 3: Implementar CartContext**

```tsx
// src/contexts/CartContext.tsx
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
  updateQuantity: (productId: number, qty: number, opts?: { size?: string; color?: string }) => void;
  clear: () => void;
  itemCount: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (a: CartItem, productId: number, size?: string, color?: string) =>
  a.productId === productId && (a.size ?? null) === (size ?? null) && (a.color ?? null) === (color ?? null);

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
      const idx = prev.findIndex((it) => sameLine(it, product.id, opts.size, opts.color));
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

  const removeItem = (productId: number, opts: { size?: string; color?: string } = {}) => {
    setItems((prev) => prev.filter((it) => !sameLine(it, productId, opts.size, opts.color)));
  };

  const updateQuantity = (productId: number, qty: number, opts: { size?: string; color?: string } = {}) => {
    if (qty <= 0) {
      removeItem(productId, opts);
      return;
    }
    setItems((prev) =>
      prev.map((it) => (sameLine(it, productId, opts.size, opts.color) ? { ...it, quantity: qty } : it))
    );
  };

  const clear = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, it) => s + it.price * it.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
```

- [ ] **Step 4: Run tests, verificar que pasan**

Run: `npm test -- --run src/contexts/CartContext.test.tsx`
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/CartContext.tsx src/contexts/CartContext.test.tsx
git commit -m "Phase 2.4: CartContext con persistencia + tests"
```

---

## Task 10: Cablear providers y badges en Header

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` (pasa onCartClick + counts a Header)

- [ ] **Step 1: Envolver providers en layout.tsx**

Edit `src/app/layout.tsx`:

```diff
 import { ProductsProvider } from '@/contexts/ProductsContext';
 import { AuthProvider } from '@/contexts/AuthContext';
+import { CartProvider } from '@/contexts/CartContext';
+import { FavoritesProvider } from '@/contexts/FavoritesContext';
```

```diff
       <body>
         <AuthProvider>
-          <ProductsProvider>{children}</ProductsProvider>
+          <ProductsProvider>
+            <FavoritesProvider>
+              <CartProvider>{children}</CartProvider>
+            </FavoritesProvider>
+          </ProductsProvider>
         </AuthProvider>
       </body>
```

- [ ] **Step 2: Conectar contadores en page.tsx**

Edit `src/app/page.tsx`. Importar los hooks:

```diff
 import { useProducts } from '@/contexts/ProductsContext';
+import { useCart } from '@/contexts/CartContext';
+import { useFavorites } from '@/contexts/FavoritesContext';
```

Y dentro del componente, antes del `return`:

```diff
   const { products, settings, isLoading } = useProducts();
+  const { itemCount: cartCount } = useCart();
+  const { count: favoritesCount } = useFavorites();
+  const [cartOpen, setCartOpen] = useState(false);
```

Pasar las props al Header:

```diff
       <Header 
         storeName={settings.storeName}
         whatsappNumber={settings.whatsappNumber}
         storeIcon={settings.storeIcon}
+        favoritesCount={favoritesCount}
+        cartCount={cartCount}
+        onCartClick={() => setCartOpen(true)}
       />
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Compila. Aún no hay drawer renderizado, eso viene en Task 11.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "Phase 2.5: cablear providers + badges en header"
```

---

## Task 11: CartDrawer

**Files:**
- Create: `src/components/ui/CartDrawer.tsx`
- Modify: `src/app/page.tsx` (renderizar el drawer)

- [ ] **Step 1: Crear CartDrawer**

```tsx
// src/components/ui/CartDrawer.tsx
'use client';

import { useEffect } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/contexts/ProductsContext';
import { formatGuarani, formatWhatsAppMessage, whatsappUrl } from '@/lib/whatsappMessage';

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { settings } = useProducts();

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    const msg = formatWhatsAppMessage(
      items.map((it) => ({
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
      }))
    );
    window.open(whatsappUrl(settings.whatsappNumber, msg), '_blank');
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[color:var(--color-shell)] shadow-2xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-5 border-b border-[color:var(--color-cream)]">
          <h2 className="font-display text-2xl">Tu carrito</h2>
          <button onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
          {items.length === 0 ? (
            <div className="p-10 text-center text-[color:var(--color-taupe)]">
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-cream)]">
              {items.map((it) => (
                <li key={`${it.productId}-${it.size ?? ''}-${it.color ?? ''}`} className="p-4 flex gap-3">
                  <div className="w-16 h-20 bg-[color:var(--color-cream)] rounded overflow-hidden flex-shrink-0">
                    {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.name}</p>
                    <p className="text-xs text-[color:var(--color-taupe)] mt-0.5">
                      {[it.size, it.color].filter(Boolean).join(' · ') || 'Sin variante'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(it.productId, it.quantity - 1, { size: it.size, color: it.color })}
                        className="p-1 border border-[color:var(--color-cream)] rounded"
                        aria-label="Restar"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{it.quantity}</span>
                      <button
                        onClick={() => updateQuantity(it.productId, it.quantity + 1, { size: it.size, color: it.color })}
                        className="p-1 border border-[color:var(--color-cream)] rounded"
                        aria-label="Sumar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(it.productId, { size: it.size, color: it.color })}
                        className="ml-auto p-1 text-[color:var(--color-taupe)] hover:text-[color:var(--color-terra)]"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatGuarani(it.price * it.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 border-t border-[color:var(--color-cream)] bg-[color:var(--color-shell)]">
          <div className="flex justify-between mb-3">
            <span className="text-sm uppercase tracking-wider">Total</span>
            <span className="font-display text-xl">{formatGuarani(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em] disabled:opacity-50"
          >
            Pedir por WhatsApp
          </button>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Renderizar el drawer en page.tsx**

Edit `src/app/page.tsx`:

```diff
 import Header from '@/components/ui/Header';
+import CartDrawer from '@/components/ui/CartDrawer';
```

Y antes del cierre del componente (después del `<Footer />`):

```diff
       <Footer ... />
+      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
     </div>
   );
 }
```

- [ ] **Step 3: Build + visual**

Run: `npm run build && npm run dev`
- Click en ícono carrito del header → abre drawer.
- Click en backdrop o X → cierra.
- "Tu carrito está vacío" visible (no hay forma de agregar items aún, viene en Task 12).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/CartDrawer.tsx src/app/page.tsx
git commit -m "Phase 2.6: CartDrawer + integración en home"
```

---

## Task 12: ProductCard rewrite

**Files:**
- Modify (replace): `src/components/ui/ProductCard.tsx`

- [ ] **Step 1: Reemplazar ProductCard con la versión nueva**

```tsx
// src/components/ui/ProductCard.tsx
'use client';

import { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { formatGuarani } from '@/lib/whatsappMessage';

const isOnOffer = (p: Product) => !!(p.originalPrice && p.originalPrice > p.price);
const discountPercent = (p: Product) =>
  isOnOffer(p) ? Math.round((1 - p.price / p.originalPrice!) * 100) : 0;

const isNewArrival = (p: Product & { createdAt?: string }) => {
  if (!p.createdAt) return false;
  const days = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  return days <= 14;
};

export default function ProductCard({
  product,
  isListView = false,
  onViewDetails,
}: {
  product: Product;
  isListView?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onViewDetails?: (p: Product) => void;
}) {
  const { isFavorite: isFav, toggle } = useFavorites();
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);

  const onOffer = isOnOffer(product);
  const discount = discountPercent(product);
  const isNew = isNewArrival(product);
  const fav = isFav(product.id);

  const secondImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const displayImage = hovered && secondImage ? secondImage : product.image;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes?.[0];
    addItem(product, { size: defaultSize });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <article
      className={`group cursor-pointer ${isListView ? 'flex gap-4' : ''}`}
      onClick={() => onViewDetails?.(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative bg-[color:var(--color-cream)] overflow-hidden rounded ${
        isListView ? 'w-32 aspect-square flex-shrink-0' : 'aspect-[3/4]'
      }`}>
        {displayImage && (
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Badges */}
        {onOffer && (
          <span className="absolute top-2 left-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm">
            −{discount}%
          </span>
        )}
        {!onOffer && isNew && (
          <span className="absolute top-2 left-2 border border-[color:var(--color-cocoa)] text-[color:var(--color-cocoa)] bg-[color:var(--color-shell)]/90 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm">
            NUEVO
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-2 right-2 bg-[color:var(--color-taupe)] text-[color:var(--color-shell)] text-[10px] tracking-wider px-2 py-0.5 rounded-sm">
            AGOTADO
          </span>
        )}

        {/* Acciones hover */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFav}
            aria-label="Favorito"
            className="p-2 bg-[color:var(--color-shell)] rounded-full shadow"
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-[color:var(--color-terra)] text-[color:var(--color-terra)]' : 'text-[color:var(--color-cocoa)]'}`} />
          </button>
          {product.inStock && (
            <button
              onClick={handleQuickAdd}
              aria-label="Agregar al carrito"
              className="p-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] rounded-full shadow"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`mt-3 ${isListView ? 'flex-1 mt-0' : ''}`}>
        <h3 className="font-display text-base text-[color:var(--color-cocoa)]">{product.name}</h3>
        <p className="text-xs text-[color:var(--color-taupe)] mt-0.5 capitalize">{product.subcategory}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-medium text-[color:var(--color-cocoa)]">{formatGuarani(product.price)}</span>
          {onOffer && (
            <span className="text-xs line-through text-[color:var(--color-taupe)]">
              {formatGuarani(product.originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Compila. Los helpers van inlineados localmente por ahora; en Task 15 se mueven a `lib/products.ts` y se importan acá.

- [ ] **Step 3: Visual**

`npm run dev` → home → mover el mouse sobre una card:
- Aparecen botones ♡ y 🛒 en la esquina inferior derecha.
- Click en ♡ marca favorito (badge en header sube).
- Click en 🛒 agrega al carrito (badge sube, abrir drawer muestra el item).
- Productos con `originalPrice > price` muestran badge "−40%".

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ProductCard.tsx
git commit -m "Phase 2.7: ProductCard nuevo con badges, hover, quick-add y favoritos"
```

---

## Task 13: ProductModal restyle + add-to-cart

**Files:**
- Modify: `src/components/ui/ProductModal.tsx`

- [ ] **Step 1: Leer ProductModal actual**

Run: `cat src/components/ui/ProductModal.tsx`

- [ ] **Step 2: Aplicar cambios mínimos: paleta + botón cart**

Edit `src/components/ui/ProductModal.tsx`. Tres cambios:

**a)** Importar el cart hook arriba:
```tsx
import { useCart } from '@/contexts/CartContext';
import { formatGuarani } from '@/lib/whatsappMessage';
```

**b)** Agregar dentro del componente (antes del return):
```tsx
const { addItem } = useCart();
const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
```

(Si ya hay un `useState` para `selectedSize` reusalo, no dupliques.)

**c)** Agregar un botón "Agregar al carrito" junto al botón de WhatsApp:
```tsx
<button
  onClick={() => {
    addItem(product, { size: selectedSize, color: selectedColor });
  }}
  className="flex-1 py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em] disabled:opacity-50"
  disabled={!product.inStock}
>
  Agregar al carrito
</button>
```

**d)** Reemplazar clases tailwind viejas (bg-blue-X, text-gray-X) por las nuevas variables. Buscar:
- `bg-gray-50` → `bg-[color:var(--color-cream)]`
- `text-gray-900` → `text-[color:var(--color-cocoa)]`
- `text-gray-600`, `text-gray-700` → `text-[color:var(--color-taupe)]`
- `bg-blue-*` → `bg-[color:var(--color-cocoa)]`

> Si el modal tiene mucho de bg-blue/text-gray, tomate 5 min de pase global con find/replace antes de buildear. Trade-off OK porque ya el modal es ~302 líneas.

- [ ] **Step 3: Build + visual**

Run: `npm run build && npm run dev`
Click en una card → modal abre con paleta nueva. Botón "Agregar al carrito" suma al carrito.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ProductModal.tsx
git commit -m "Phase 2.8: ProductModal restyle + add-to-cart"
```

---

## Task 14: Página /favoritos

**Files:**
- Create: `src/app/favoritos/page.tsx`

- [ ] **Step 1: Crear la página**

```tsx
// src/app/favoritos/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import ProductModal from '@/components/ui/ProductModal';
import CartDrawer from '@/components/ui/CartDrawer';
import { useProducts } from '@/contexts/ProductsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/lib/types';

export default function FavoritosPage() {
  const { products, settings, isLoading } = useProducts();
  const { favoriteIds, count } = useFavorites();
  const { itemCount: cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const favorites = products.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] pt-16">
      <Header
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
        favoritesCount={count}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="eyebrow">Tu lista</p>
        <h1 className="font-display text-4xl mt-1 mb-8">Favoritos</h1>

        {isLoading ? (
          <p className="text-[color:var(--color-taupe)]">Cargando…</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
            <p className="mt-4 text-[color:var(--color-taupe)]">No tenés favoritos todavía.</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-sm uppercase tracking-[.2em]"
            >
              Explorar tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((p) => (
              <ProductCard key={p.id} product={p} onViewDetails={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      <Footer storeName={settings.storeName} whatsappNumber={settings.whatsappNumber} />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Build + visual**

Run: `npm run build && npm run dev`
- Ir a `/favoritos` → empty state si no marcaste nada.
- Marcar 1-2 favoritos en la home, refrescar `/favoritos` → aparecen.

- [ ] **Step 3: Commit y push de phase 2**

```bash
git add src/app/favoritos/page.tsx
git commit -m "Phase 2.9: página /favoritos"
git push origin main
```

Verifica deploy en Vercel.

---

# Phase 3 — Secciones de la home

## Task 15: createdAt en tipo Product + DB mapping + helpers + tests

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/database.ts`
- Modify: `src/lib/products.ts`
- Create: `src/lib/products.test.ts`

- [ ] **Step 1: Agregar createdAt al tipo Product**

Edit `src/lib/types.ts`:
```diff
   features: string[];
   tags: string[];
+  createdAt?: string; // ISO date desde Postgres
 }
```

- [ ] **Step 2: Mapear created_at en database.ts**

Edit `src/lib/database.ts`. En la función `mapProductFromDB`, agregar al final del objeto retornado:

```diff
   features: toArray(row.features),
   tags: toArray(row.tags),
+  createdAt: row.created_at ? String(row.created_at) : undefined,
 });
```

- [ ] **Step 3: Test de helpers**

Crear `src/lib/products.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isOnOffer, discountPercent, isNewArrival } from './products';
import type { Product } from './types';

const base = (over: Partial<Product> = {}): Product => ({
  id: 1, name: 'p', description: '', price: 1000,
  image: '', category: 'prendas', subcategory: 'remeras',
  gender: 'unisex', sizes: [], rating: 4, inStock: true,
  features: [], tags: [], ...over,
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
```

- [ ] **Step 4: Run test, verificar que falla**

Run: `npm test -- --run src/lib/products.test.ts`
Expected: FAIL — los helpers no existen aún.

- [ ] **Step 5: Implementar helpers**

Edit `src/lib/products.ts`. Agregar al final del archivo (sin tocar lo que ya estaba):

```ts
import type { Product } from './types';

export const isOnOffer = (p: Product): boolean =>
  !!(p.originalPrice && p.originalPrice > p.price);

export const discountPercent = (p: Product): number =>
  isOnOffer(p) ? Math.round((1 - p.price / p.originalPrice!) * 100) : 0;

export const isNewArrival = (p: Product): boolean => {
  if (!p.createdAt) return false;
  const days = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  return days <= 14;
};
```

> Si `import { Product }` ya existe arriba, no lo dupliques.

- [ ] **Step 6: Run tests**

Run: `npm test -- --run src/lib/products.test.ts`
Expected: 9 tests PASS.

- [ ] **Step 7: Reemplazar helpers inline en ProductCard por imports**

Edit `src/components/ui/ProductCard.tsx`:

Borrar las 3 declaraciones locales:
```ts
const isOnOffer = (p: Product) => ...;
const discountPercent = (p: Product) => ...;
const isNewArrival = (p: Product & { createdAt?: string }) => ...;
```

Y reemplazarlas con un import al inicio del archivo:
```ts
import { isOnOffer, discountPercent, isNewArrival } from '@/lib/products';
```

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: Compila.

- [ ] **Step 9: Commit**

```bash
git add src/lib/types.ts src/lib/database.ts src/lib/products.ts src/lib/products.test.ts src/components/ui/ProductCard.tsx
git commit -m "Phase 3.1: createdAt + helpers compartidos isOnOffer/discountPercent/isNewArrival"
```

---

## Task 16: Hero

**Files:**
- Create: `src/components/ui/Hero.tsx`

- [ ] **Step 1: Crear Hero**

```tsx
// src/components/ui/Hero.tsx
import Link from 'next/link';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80';

export default function Hero({
  eyebrow = 'Otoño / Invierno 2026',
  title = 'Vestite con\nintención.',
  ctaLabel = 'Ver colección',
  ctaHref = '#catalogo',
  image = DEFAULT_IMAGE,
}: {
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
}) {
  return (
    <section
      className="relative h-[60vh] sm:h-[75vh] -mt-16 flex items-end"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(74,55,41,.35), rgba(139,125,107,.35)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-[color:var(--color-shell)]">
        <p className="eyebrow !text-[color:var(--color-shell)] opacity-90">{eyebrow}</p>
        <h1 className="font-display text-4xl sm:text-6xl mt-3 max-w-2xl whitespace-pre-line">{title}</h1>
        <Link
          href={ctaHref}
          className="inline-block mt-6 text-xs uppercase tracking-[.2em] border-b border-[color:var(--color-shell)] pb-1"
        >
          {ctaLabel} →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Compila. Aún no se renderiza, viene en Task 22.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Hero.tsx
git commit -m "Phase 3.2: componente Hero"
```

---

## Task 17: ServiceBar

**Files:**
- Create: `src/components/ui/ServiceBar.tsx`

- [ ] **Step 1: Crear ServiceBar**

```tsx
// src/components/ui/ServiceBar.tsx
import { Truck, MessageCircle } from 'lucide-react';

export default function ServiceBar({ whatsappNumber }: { whatsappNumber?: string }) {
  return (
    <div className="bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-xs sm:text-sm py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-center">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" /> Envíos a todo Paraguay
        </span>
        {whatsappNumber && (
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp +{whatsappNumber}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ServiceBar.tsx
git commit -m "Phase 3.3: componente ServiceBar"
```

---

## Task 18: OffersSection

**Files:**
- Create: `src/components/ui/OffersSection.tsx`

- [ ] **Step 1: Crear OffersSection**

```tsx
// src/components/ui/OffersSection.tsx
'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import { isOnOffer, discountPercent } from '@/lib/products';
import ProductCard from './ProductCard';

export default function OffersSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const offers = products
    .filter(isOnOffer)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 8);

  if (offers.length === 0) return null;

  return (
    <section className="py-16 bg-[color:var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Solo esta semana</p>
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl sm:text-4xl">Ofertas</h2>
          <Link href="#catalogo?cat=ofertas" className="text-xs uppercase tracking-[.2em] border-b border-[color:var(--color-cocoa)] pb-0.5">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {offers.map((p) => (
            <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/OffersSection.tsx
git commit -m "Phase 3.4: OffersSection"
```

---

## Task 19: NewArrivalsSection

**Files:**
- Create: `src/components/ui/NewArrivalsSection.tsx`

- [ ] **Step 1: Crear NewArrivalsSection**

```tsx
// src/components/ui/NewArrivalsSection.tsx
'use client';

import { Product } from '@/lib/types';
import { isNewArrival } from '@/lib/products';
import ProductCard from './ProductCard';

export default function NewArrivalsSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const recent = products.filter(isNewArrival);
  const list =
    recent.length >= 4
      ? recent
      : [...products].sort((a, b) => {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0;
          const db = b.createdAt ? Date.parse(b.createdAt) : 0;
          return db - da;
        });

  const top = list.slice(0, 8);
  if (top.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Lo más reciente</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">Recién llegados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {top.map((p) => (
            <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/NewArrivalsSection.tsx
git commit -m "Phase 3.5: NewArrivalsSection con fallback"
```

---

## Task 20: CategoriesSection

**Files:**
- Create: `src/components/ui/CategoriesSection.tsx`

- [ ] **Step 1: Crear CategoriesSection**

```tsx
// src/components/ui/CategoriesSection.tsx
import Link from 'next/link';

const CATEGORY_IMAGES: Record<string, string> = {
  prendas: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80',
  calzados: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
};

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-[color:var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Explorar</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">Por categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <CategoryCard label="Prendas" href="#catalogo?cat=prendas" image={CATEGORY_IMAGES.prendas} />
          <CategoryCard label="Calzado" href="#catalogo?cat=calzados" image={CATEGORY_IMAGES.calzados} />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ label, href, image }: { label: string; href: string; image: string }) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-lg"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(74,55,41,.4), rgba(74,55,41,.2)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-[color:var(--color-shell)]">
        <h3 className="font-display text-3xl sm:text-4xl">{label}</h3>
        <span className="mt-2 text-xs uppercase tracking-[.2em] opacity-90">Ver →</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/CategoriesSection.tsx
git commit -m "Phase 3.6: CategoriesSection"
```

---

## Task 21: FilterBar + CatalogSection

**Files:**
- Create: `src/components/ui/FilterBar.tsx`
- Create: `src/components/ui/CatalogSection.tsx`

- [ ] **Step 1: Crear FilterBar**

```tsx
// src/components/ui/FilterBar.tsx
'use client';

import { Search } from 'lucide-react';
import { Category } from '@/lib/types';

export default function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  searchTerm,
  onSearchChange,
}: {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  selectedGender: string;
  onGenderChange: (g: string) => void;
  searchTerm: string;
  onSearchChange: (t: string) => void;
}) {
  const Chip = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${
        active
          ? 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]'
          : 'bg-[color:var(--color-shell)] text-[color:var(--color-cocoa)] border border-[color:var(--color-cream)]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="sticky top-16 z-30 bg-[color:var(--color-cream)] border-b border-[color:var(--color-tan)]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2">
        <Chip active={selectedCategory === 'all'} onClick={() => onCategoryChange('all')}>Todo</Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={selectedCategory === c.id}
            onClick={() => onCategoryChange(c.id)}
          >
            {c.name}
          </Chip>
        ))}
        <span className="w-px h-5 bg-[color:var(--color-tan)]/30 mx-1" />
        <Chip active={selectedGender === 'mujer'} onClick={() => onGenderChange(selectedGender === 'mujer' ? 'all' : 'mujer')}>Mujer</Chip>
        <Chip active={selectedGender === 'hombre'} onClick={() => onGenderChange(selectedGender === 'hombre' ? 'all' : 'hombre')}>Hombre</Chip>

        <div className="ml-auto flex items-center gap-2 bg-[color:var(--color-shell)] rounded-full px-3 py-1.5 border border-[color:var(--color-cream)]">
          <Search className="w-4 h-4 text-[color:var(--color-taupe)]" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar"
            className="bg-transparent text-sm outline-none w-32 sm:w-48"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear CatalogSection**

```tsx
// src/components/ui/CatalogSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { filterProducts, getCategories } from '@/lib/products';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';

export default function CatalogSection({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails: (p: Product) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const categories: Category[] = useMemo(() => getCategories(products), [products]);

  const filtered = useMemo(
    () => filterProducts(products, selectedCategory, searchTerm, selectedGender, selectedSize),
    [products, selectedCategory, searchTerm, selectedGender, selectedSize]
  );

  useEffect(() => setPage(1), [selectedCategory, selectedGender, selectedSize, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section id="catalogo" className="pb-20">
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(c) => {
          setSelectedCategory(c);
          setSelectedGender('all');
        }}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <p className="eyebrow">{filtered.length} productos</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">
          {selectedCategory === 'all'
            ? 'Todo el catálogo'
            : categories.find((c) => c.id === selectedCategory)?.name ?? 'Catálogo'}
        </h2>

        {paged.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
            <p className="mt-4 text-[color:var(--color-taupe)]">No encontramos nada con esos filtros.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedGender('all');
                setSelectedSize('all');
                setSearchTerm('');
              }}
              className="mt-4 text-sm underline text-[color:var(--color-cocoa)]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm border border-[color:var(--color-cream)] rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-[color:var(--color-taupe)] mx-4">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm border border-[color:var(--color-cream)] rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Compila.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/FilterBar.tsx src/components/ui/CatalogSection.tsx
git commit -m "Phase 3.7: FilterBar sticky + CatalogSection"
```

---

## Task 22: Recomponer page.tsx + borrar Sidebar

**Files:**
- Modify (replace): `src/app/page.tsx`
- Delete: `src/components/ui/Sidebar.tsx`

- [ ] **Step 1: Reemplazar page.tsx**

```tsx
// src/app/page.tsx
'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Hero from '@/components/ui/Hero';
import ServiceBar from '@/components/ui/ServiceBar';
import OffersSection from '@/components/ui/OffersSection';
import NewArrivalsSection from '@/components/ui/NewArrivalsSection';
import CategoriesSection from '@/components/ui/CategoriesSection';
import CatalogSection from '@/components/ui/CatalogSection';
import ProductModal from '@/components/ui/ProductModal';
import CartDrawer from '@/components/ui/CartDrawer';

export default function Home() {
  const { products, settings, isLoading } = useProducts();
  const { itemCount: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)]">
        <p className="text-[color:var(--color-taupe)]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)]">
      <Header
        storeName={settings.storeName}
        whatsappNumber={settings.whatsappNumber}
        favoritesCount={favoritesCount}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <Hero />
      <ServiceBar whatsappNumber={settings.whatsappNumber} />

      <OffersSection products={products} onViewDetails={setSelectedProduct} />
      <NewArrivalsSection products={products} onViewDetails={setSelectedProduct} />
      <CategoriesSection />
      <CatalogSection products={products} onViewDetails={setSelectedProduct} />

      <Footer storeName={settings.storeName} whatsappNumber={settings.whatsappNumber} />

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Borrar Sidebar.tsx**

```bash
git rm src/components/ui/Sidebar.tsx
```

- [ ] **Step 3: Verificar que nadie más importaba Sidebar**

Run: `grep -rn "from.*Sidebar" src/`
Expected: solo aparece en archivos que ya no usan Sidebar (admin, etc.). Si algún componente del front lo importa, borrar el import.

- [ ] **Step 4: Build + visual completo**

Run: `npm run build && npm run dev`
Recorre la home completa:
- Hero full-bleed con foto Unsplash + título serif + CTA.
- ServiceBar marrón con envíos + WhatsApp.
- Sección Ofertas con badge `−40%` en cards.
- Sección Recién llegados.
- Sección Por categoría con 2 bloques grandes.
- FilterBar sticky con chips, queda pegada bajo el header al scrollear.
- Catálogo con paginación.
- Modal funciona (click en card).
- Drawer del carrito funciona.
- Header transparent → solid al scrollear.

- [ ] **Step 5: Commit + push**

```bash
git add src/app/page.tsx
git commit -m "Phase 3.8: home recompuesta con secciones + borrar Sidebar"
git push origin main
```

(El `git rm` del Step 2 ya stageó la deleción de Sidebar.)

Verifica deploy en Vercel.

---

# Verificación final

Tras Phase 3 estar mergeada y deployada, ir uno por uno por los criterios de aceptación del spec:

- [ ] La home muestra hero, ofertas, recién llegados, categorías, filtros sticky y catálogo, en ese orden.
- [ ] Header se vuelve sólido al scrollear más allá del hero.
- [ ] FilterBar se queda pegada bajo el header en la sección catálogo.
- [ ] Click en ♡ guarda favorito y persiste tras refrescar.
- [ ] Click en quick-add suma al carrito y persiste tras refrescar.
- [ ] Drawer del carrito abre, lista items con talle/color, calcula total.
- [ ] "Pedir por WhatsApp" abre wa.me con mensaje formateado correcto.
- [ ] `/favoritos` muestra los favoritos guardados.
- [ ] Productos con `originalPrice > price` muestran badge `−XX%` y precio tachado.
- [ ] Productos `created_at` últimos 14 días muestran badge `NUEVO`.
- [ ] El sitio renderiza correctamente en mobile.
- [ ] `npm run build` pasa sin warnings.
- [ ] `npm test -- --run` pasa todos los tests.

Si algo falla, abrir un patch task arriba de la verificación.
