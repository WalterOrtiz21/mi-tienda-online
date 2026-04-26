# Rediseño del front público — "Boutique cálido"

**Fecha:** 2026-04-26
**Estado:** Aprobado en brainstorming, pendiente de plan de implementación
**Alcance:** Front público (home, modal, header, footer, favoritos). Admin queda intacto.

## Objetivo

Salto visual y de UX en el front público de Annya Modas. Resolver 6 problemas detectados en auditoría:

1. Hero genérico que no vende.
2. Faltan secciones temáticas (ofertas, recién llegados, por categoría).
3. Header y filtros no son sticky — se pierden al scrollear.
4. Descuentos invisibles (el dato existe en `original_price` pero no se destaca).
5. Sin identidad de marca (tipografía Arial default, paleta ad-hoc).
6. `ProductCard` plana, sin hover effect ni badges.

Además, sumar **carrito + favoritos persistentes** (hoy el flujo es directo a WhatsApp con 1 producto, los favoritos se pierden al refrescar).

## Decisiones de diseño

| Eje | Decisión |
|---|---|
| Dirección visual | **Boutique cálido** (tonos tierra/crema, serif elegante, sensación artesanal) |
| Identidad | **Libertad total** — wordmark tipográfico "annya" desde cero, sin ícono complejo |
| Fotografía | **Unsplash placeholders**, código preparado para swap a fotos reales después |
| Flujo de compra | **Carrito + favoritos persistentes en localStorage**, checkout final por WhatsApp |
| Layout | **Editorial scroll narrado** — hero grande, secciones temáticas en sucesión, filtros sticky |

### Sistema visual

**Paleta (CSS custom properties):**

| Token | Hex | Uso |
|---|---|---|
| `--color-shell` | `#faf8f5` | Background principal |
| `--color-cream` | `#f4ebe1` | Background secciones, hover suave |
| `--color-tan` | `#c9a87c` | Acentos cálidos, gradients |
| `--color-taupe` | `#8b7d6b` | Texto secundario, bordes |
| `--color-cocoa` | `#4a3729` | Texto primario, CTAs, badges |
| `--color-terra` | `#a8453a` | Acento puntual: badges urgentes, sale highlights |

**Tipografía:**
- **Display / titulares / wordmark:** Playfair Display (Google Fonts), pesos 400-600.
- **Body / nav / precios / badges:** Inter (Google Fonts), pesos 400-700.
- Cargadas vía `next/font/google` en `layout.tsx` para no bloquear render.

**Tokens adicionales:**
- Radii: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 16px`.
- Sombras: una sola sombra suave `--shadow-card: 0 8px 24px rgba(74,55,41,.08)`.

## Estructura de la home

Orden vertical de secciones:

1. **Header sticky** — wordmark, nav (Mujer · Hombre · Calzado · Ofertas), search/♡/🛒 con badges. Transparente sobre el hero, sólido al scrollear.
2. **Hero full-bleed** — foto lifestyle (~75vh desktop, 60vh mobile). Eyebrow Inter uppercase + título serif + CTA underline.
3. **ServiceBar** — tira marrón (cocoa) con envíos + WhatsApp.
4. **Ofertas de la semana** — productos con `originalPrice > price`, ordenados por % descuento desc, top 8.
5. **Recién llegados** — productos con `created_at` de los últimos 14 días, top 8. Fallback a últimos 8 si no hay suficientes.
6. **Por categoría** — 2 bloques grandes (Prendas / Calzado), con foto lifestyle hardcoded (URL Unsplash en una constante en el componente, fácil swap a foto real después).
7. **FilterBar sticky + Catálogo completo** — chips horizontales (Todo, Mujer, Hombre, Talle ▾, Precio ▾, Buscar) que se quedan pegados al scrollear. Reemplaza la `Sidebar.tsx` actual.
8. **Footer** — wordmark + tagline + links + WhatsApp.

## Componentes

### Nuevos

| Componente | Responsabilidad |
|---|---|
| `Wordmark.tsx` | Logo "annya" reusable (tamaños prop). |
| `Hero.tsx` | Sección hero de la home. Recibe foto de fondo + textos por props. Defaults con placeholder Unsplash + copy provisorio ("Otoño / Invierno 2026" + "Vestite con intención"). |
| `ServiceBar.tsx` | Tira de servicios (envíos/WhatsApp). |
| `OffersSection.tsx` | Sección de ofertas. Filtra productos del context, renderiza grilla. |
| `NewArrivalsSection.tsx` | Sección de recién llegados. |
| `CategoriesSection.tsx` | 2 cards grandes por categoría. |
| `FilterBar.tsx` | Top-bar sticky con chips de filtro. |
| `CatalogSection.tsx` | Heading + grilla del catálogo + paginación. Toma filtros del estado del padre. |
| `CartDrawer.tsx` | Drawer slide-in derecha con items, total, botón "Pedir por WhatsApp". |

### Modificados

| Componente | Cambios |
|---|---|
| `Header.tsx` | Reescribir: sticky, transparente→sólido, wordmark, badges ♡/🛒 conectados a contexts, abre `CartDrawer`. |
| `Footer.tsx` | Restyle a la nueva paleta. |
| `ProductCard.tsx` | Reescribir: badges `−XX%` y `NUEVO`, hover muestra `images[0]` si existe, botón quick-add que llama `cart.addItem`, corazón llama `favorites.toggle`. |
| `ProductModal.tsx` | Restyle a la nueva paleta. Botón "Agregar al carrito" + opción directa "Pedir ahora por WhatsApp". |
| `app/page.tsx` | Reescribir como composición de secciones. ~80 líneas (vs 306 actuales). |
| `app/layout.tsx` | Cargar fonts, envolver con `CartProvider` y `FavoritesProvider`. |
| `app/globals.css` | Reemplazar entero con design tokens. Quitar `!important`. |

### Eliminados

| Componente | Motivo |
|---|---|
| `Sidebar.tsx` | Reemplazado por `FilterBar.tsx` (chips top-bar). |

### Nuevas páginas

| Ruta | Archivo | Descripción |
|---|---|---|
| `/favoritos` | `app/favoritos/page.tsx` | Lista de productos favoritos. Mismo layout de grilla que el catálogo. Empty state si está vacío. |

## Estado y datos

### `CartContext`

```ts
type CartItem = {
  productId: number;
  quantity: number;
  size?: string;
  color?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, opts?: { size?: string; color?: string; quantity?: number }) => void;
  removeItem: (productId: number, opts?: { size?: string; color?: string }) => void;
  updateQuantity: (productId: number, qty: number, opts?: { size?: string; color?: string }) => void;
  clear: () => void;
  itemCount: number;
  total: number;
};
```

- Persiste en `localStorage` clave `annya:cart`.
- Hidratación safe-SSR: estado inicial vacío, hidrata en `useEffect` cliente.
- Items distintos en talle/color son items separados (mismo productId puede aparecer 2 veces si elegiste talles distintos).

### `FavoritesContext`

```ts
type FavoritesContextValue = {
  favoriteIds: number[];
  toggle: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  count: number;
};
```

- Persiste en `localStorage` clave `annya:favorites`.
- Misma estrategia SSR.

### Helpers de filtrado (en `lib/products.ts`)

```ts
isOnOffer(p: Product): boolean        // p.originalPrice && p.originalPrice > p.price
discountPercent(p: Product): number   // round((1 - p.price/p.originalPrice) * 100)
isNewArrival(p: Product): boolean     // createdAt within last 14 days
```

> Nota: el tipo `Product` actual no expone `created_at`. Hay que sumarlo al tipo y al mapeo en `database.ts:mapProductFromDB`. La columna ya existe en Postgres.

## Flujo del carrito → WhatsApp

Botón "Pedir por WhatsApp" en `CartDrawer` arma:

```
Hola! Quiero pedir:

• {producto} ({size}, {color}) × {qty} — Gs. {price * qty}
• ...

Total: Gs. {total}
```

Y abre `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`. El número viene de `settings.whatsappNumber` (ya existe en el `ProductsContext`).

## Comportamiento de scroll

- **Header**: `position: sticky; top: 0`. Background `transparent` cuando `scrollY < heroHeight`, `var(--color-shell)` con borde inferior cuando `scrollY >= heroHeight`. Implementado con `useEffect` + `scroll` listener (rAF-throttled).
- **FilterBar**: `position: sticky; top: <headerHeight>` cuando entra en viewport. Se queda pegada bajo el header durante la sección de catálogo.
- **CartDrawer**: cuando abre, `body { overflow: hidden }`. Backdrop con click-outside cierra.

## Casos borde y errores

- **Sin productos en oferta**: `OffersSection` se oculta entera (no renderiza).
- **Sin productos nuevos** (catálogo viejo, ningún `created_at` reciente): `NewArrivalsSection` muestra los últimos 8 creados como fallback.
- **localStorage no disponible** (modo privado, etc.): los contexts funcionan en memoria, no rompen.
- **Producto del carrito eliminado del catálogo**: el `CartDrawer` lo filtra silenciosamente al renderizar.
- **Imágenes que no cargan**: `next/image` con `unoptimized: true` (config actual). Añadir `onError` que muestra fallback gris con nombre del producto.

## No-objetivos (explícitos)

- No se cambia el flow de auth admin (`AuthContext` con password hardcodeado sigue igual).
- No se toca el schema de Supabase ni los endpoints de API.
- No se agregan páginas de detalle de producto (`/producto/[id]`); el detalle sigue siendo el modal.
- No se implementa búsqueda full-text del lado servidor; sigue siendo client-side sobre `products`.
- No se traducen textos a otros idiomas; sigue español.
- No se hace SEO avanzado (metadata por producto, sitemap dinámico) — fuera de alcance de este spec.

## Fases de implementación

### Fase 1 — Fundaciones visuales

Archivos: `globals.css`, `layout.tsx`, `Wordmark.tsx` (nuevo), `Header.tsx`, `Footer.tsx`.
Resultado: paleta + fonts + header sticky aplicados. Contenido sin cambios estructurales todavía. Deployable.

### Fase 2 — Estado funcional + ProductCard

Archivos: `CartContext.tsx` (nuevo), `FavoritesContext.tsx` (nuevo), `CartDrawer.tsx` (nuevo), `app/favoritos/page.tsx` (nuevo), `Header.tsx` (cablear badges + drawer trigger), `ProductCard.tsx` (reescribir), `ProductModal.tsx` (restyle + botón cart).
Resultado: cart y favoritos funcionan. Cards con badges nuevas. Deployable.

### Fase 3 — Secciones de la home

Archivos: `Hero.tsx`, `ServiceBar.tsx`, `OffersSection.tsx`, `NewArrivalsSection.tsx`, `CategoriesSection.tsx`, `FilterBar.tsx`, `CatalogSection.tsx` (todos nuevos). Helpers en `lib/products.ts`. Reescribir `app/page.tsx`. Borrar `Sidebar.tsx`. Sumar `created_at` al tipo `Product` y al mapeo de DB.
Resultado: home rediseñada completa. Deployable.

## Criterios de aceptación

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
- [ ] El sitio renderiza correctamente en mobile (chips, drawer, secciones).
- [ ] Build de Next pasa sin warnings.

## Referencias visuales

- Aritzia, Madewell, Sézane (estructura editorial scroll narrado).
- Anthropologie (paleta cálida, tipografía serif).
