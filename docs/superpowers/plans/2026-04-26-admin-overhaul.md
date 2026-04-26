# Admin Overhaul — Implementation Plan

**Goal:** Reescribir el admin para que sea usable diariamente desde celular sin descuidar la vista web. Suma concepto de archivado y mejora flujos de copiar/pegar desde WhatsApp.

**Spec:** `docs/superpowers/specs/2026-04-26-admin-overhaul-design.md`

**Architecture:** 5 fases, cada una commit + push deployable. Reusa contexts existentes (Products, Auth, Toast). Agrega columna `archived` al schema. Form pasa de modal a route dedicada. Sidebar responsive drawer/fixed.

**Tech Stack:** Next.js 15.5 App Router, React 19, Tailwind v4, Supabase, Vitest.

---

## File structure

### Phase A — Foundations
- Modify: `supabase/schema.sql` (sumar `archived`)
- Create: `supabase/migrations/2026-04-26-archived.sql` (migration)
- Modify: `src/lib/types.ts` (sumar `archived`)
- Modify: `src/lib/database.ts` (mapping + filter en queries públicas)
- Modify: `src/app/admin/layout.tsx` (responsive drawer + paleta + items sidebar)

### Phase B — Product List
- Modify: `src/app/admin/products/page.tsx` (cards mobile / tabla desktop, filtros, paginación)
- Create: `src/components/admin/ProductCardAdmin.tsx`
- Create: `src/components/admin/ProductActionsMenu.tsx`
- Create: `src/lib/adminWhatsApp.ts` (helper share)

### Phase C — Product Form
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/edit/page.tsx`
- Create: `src/components/admin/ProductFormPage.tsx`
- Create: `src/components/admin/ChipInput.tsx`
- Create: `src/components/admin/ImageDropzone.tsx`
- Modify: `src/app/admin/products/page.tsx` (los handlers que abrían modal ahora navegan)

### Phase D — Images + cleanup
- Modify: `src/app/admin/images/page.tsx` (shape Supabase)
- Modify: `src/app/admin/layout.tsx` (sumar Images al sidebar)
- Delete: `src/components/admin/ProductList.tsx`
- Modify: `src/app/admin/settings/page.tsx` (quitar password decorativo)

### Phase E — Dashboard
- Modify: `src/app/admin/page.tsx` (simplificar + paleta)

---

## Phase A — Foundations

### A.1 Schema migration

**Files:** `supabase/migrations/2026-04-26-archived.sql` (new), `supabase/schema.sql` (modify)

Crear `supabase/migrations/2026-04-26-archived.sql`:
```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(archived);
```

Y agregar la columna a `supabase/schema.sql` (en la definición de `products`) para que un setup desde cero ya la tenga.

> Nota: el usuario debe correr la migration en Supabase SQL Editor antes de que se note el archivado. Documentar en el commit message.

### A.2 Types + DB mapping

**Modify:** `src/lib/types.ts`

```diff
   tags: string[];
   createdAt?: string;
+  archived?: boolean;
 }
```

**Modify:** `src/lib/database.ts`

Mapping (`mapProductFromDB`):
```diff
   createdAt: row.created_at ? String(row.created_at) : undefined,
+  archived: Boolean(row.archived ?? false),
 });
```

`productToRow`:
```diff
   tags: p.tags ?? [],
+  archived: p.archived ?? false,
 });
```

`productAPI.getAll`, `getByCategory`, `search`: filtrar `archived=false` por defecto. Agregar un parámetro `includeArchived` que el admin puede setear true.

```ts
async getAll(opts: { includeArchived?: boolean } = {}): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!opts.includeArchived) query = query.eq('archived', false);
  const { data, error } = await query;
  if (error) { console.error(...); return []; }
  return (data ?? []).map(mapProductFromDB);
}
```

Misma lógica en `getByCategory`. En `search`, también filtrar archived false por defecto.

### A.3 Pasar `includeArchived` desde el admin

`ProductsContext` necesita exponer la posibilidad de cargar todos. Actualmente `loadInitialData` hace `fetch('/api/products')`. La API no acepta query params. Dos opciones:

- Opción 1: API acepta `?includeArchived=true`.
- Opción 2: Admin tiene su propio fetch directo.

Voy con **Opción 1** (más limpia, una sola fuente de verdad).

**Modify:** `src/app/api/products/route.ts`

```ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const products = await productAPI.getAll({ includeArchived });
  return NextResponse.json(products);
}
```

**Modify:** `src/contexts/ProductsContext.tsx`

Sumar un método `refreshProducts({ includeArchived })`. El admin lo llama con true. Pero el contexto se hidrata inicialmente sin archivados — el admin debe pedir refresh con archivados al montar.

Mejor enfoque: dos contextos no, pero el admin puede hacer un fetch directo con includeArchived al cargar. Mantener ProductsContext igual y que el admin pida data extra cuando entra.

Implementación: dejar `loadInitialData` igual (sin archived). Agregar método público `loadAll(includeArchived: boolean)` que hace el fetch y reemplaza el state.

```ts
const loadAll = async (includeArchived = false) => {
  setIsLoading(true);
  try {
    const url = includeArchived ? '/api/products?includeArchived=true' : '/api/products';
    const res = await fetch(url);
    if (res.ok) setProducts(await res.json());
  } finally { setIsLoading(false); }
};
```

Exponer en el context. Las páginas admin llaman `loadAll(true)` en mount.

### A.4 Admin layout responsive + paleta

**Modify:** `src/app/admin/layout.tsx`

Reescribir entero (~140 líneas). Estructura:

```tsx
'use client';

import { useState } from 'react';
import { Menu, X, Package, Settings, Image as ImageIcon, BarChart3, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Wordmark from '@/components/ui/Wordmark';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Productos', href: '/admin/products', icon: Package },
  { name: 'Imágenes', href: '/admin/images', icon: ImageIcon },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
  { name: 'Ver tienda', href: '/', icon: Home, external: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[color:var(--color-cream)]">
        {/* Backdrop mobile */}
        {open && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-full w-64 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] transform transition-transform md:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="h-16 px-5 flex items-center justify-between border-b border-[color:var(--color-shell)]/10">
            <Wordmark size="md" href={null} className="!text-[color:var(--color-shell)]" />
            <button className="md:hidden p-2" onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = !item.external && (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md mb-1 text-sm tracking-wide ${
                    active
                      ? 'bg-[color:var(--color-shell)]/10 text-[color:var(--color-shell)]'
                      : 'text-[color:var(--color-cream)]/80 hover:bg-[color:var(--color-shell)]/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-3 left-3 right-3">
            <button
              onClick={() => { if (confirm('¿Cerrar sesión?')) logout(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-[color:var(--color-cream)]/80 hover:bg-[color:var(--color-terra)]/30"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Header mobile */}
        <header className="md:hidden h-14 sticky top-0 z-20 bg-[color:var(--color-shell)] border-b border-[color:var(--color-cream)] px-4 flex items-center justify-between">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="p-2 -ml-2">
            <Menu className="w-6 h-6" />
          </button>
          <Wordmark size="sm" />
          <span className="w-10" />
        </header>

        {/* Content */}
        <main className="md:ml-64 p-4 md:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

### A.5 Build + commit Phase A

```bash
npm run build
git add -A
git commit -m "Phase A: admin layout responsive + schema archived"
git push origin main
```

---

## Phase B — Product List mobile-first

### B.1 Helper share por WhatsApp

**Create:** `src/lib/adminWhatsApp.ts`

```ts
import type { Product } from './types';
import { formatGuarani, whatsappUrl } from './whatsappMessage';

export function shareProductMessage(product: Product, storeName?: string): string {
  const lines = [
    `*${product.name}*`,
    formatGuarani(product.price),
    product.originalPrice && product.originalPrice > product.price
      ? `Antes: ${formatGuarani(product.originalPrice)}`
      : null,
    product.description ? `\n${product.description}` : null,
    product.image ? `\n${product.image}` : null,
    storeName ? `\n— ${storeName}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export function shareProductWhatsApp(product: Product, storeName?: string): string {
  const msg = shareProductMessage(product, storeName);
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
```

### B.2 ProductActionsMenu

**Create:** `src/components/admin/ProductActionsMenu.tsx`

Componente dropdown/sheet con opciones: Editar, Duplicar, Archivar/Desarchivar, Compartir WhatsApp, Eliminar.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Edit2, Copy, Archive, ArchiveRestore, MessageCircle, Trash2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { shareProductWhatsApp } from '@/lib/adminWhatsApp';

type Props = {
  product: Product;
  storeName?: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

export default function ProductActionsMenu({ product, storeName, onEdit, onDuplicate, onToggleArchive, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Acciones"
        className="p-2 hover:bg-[color:var(--color-cream)] rounded"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md shadow-lg z-20">
          <Item icon={Edit2} label="Editar" onClick={() => { setOpen(false); onEdit(); }} />
          <Item icon={Copy} label="Duplicar" onClick={() => { setOpen(false); onDuplicate(); }} />
          <Item
            icon={product.archived ? ArchiveRestore : Archive}
            label={product.archived ? 'Desarchivar' : 'Archivar'}
            onClick={() => { setOpen(false); onToggleArchive(); }}
          />
          <a
            href={shareProductWhatsApp(product, storeName)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[color:var(--color-cream)]"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </a>
          <div className="border-t border-[color:var(--color-cream)] my-1" />
          <Item icon={Trash2} label="Eliminar" danger onClick={() => { setOpen(false); onDelete(); }} />
        </div>
      )}
    </div>
  );
}

function Item({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[color:var(--color-cream)] ${
        danger ? 'text-[color:var(--color-terra)]' : ''
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
```

### B.3 ProductCardAdmin

**Create:** `src/components/admin/ProductCardAdmin.tsx`

Card para mobile (también usable en desktop como grid alternativa). Foto, nombre, precio, switch stock, badges, menú de acciones.

```tsx
'use client';

import { Product } from '@/lib/types';
import { formatGuarani } from '@/lib/whatsappMessage';
import ProductActionsMenu from './ProductActionsMenu';

type Props = {
  product: Product;
  storeName?: string;
  onToggleStock: (next: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

export default function ProductCardAdmin({ product, storeName, onToggleStock, onEdit, onDuplicate, onToggleArchive, onDelete }: Props) {
  const onOffer = product.originalPrice && product.originalPrice > product.price;
  return (
    <div className={`bg-[color:var(--color-shell)] rounded-lg shadow-sm p-3 flex gap-3 ${product.archived ? 'opacity-60' : ''}`}>
      <button onClick={onEdit} className="flex-shrink-0">
        <img src={product.image} alt="" className="w-20 h-24 object-cover rounded" />
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={onEdit} className="text-left w-full">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <p className="text-xs text-[color:var(--color-taupe)] capitalize">
            {product.category} · {product.subcategory}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-medium">{formatGuarani(product.price)}</span>
            {onOffer && (
              <span className="text-xs line-through text-[color:var(--color-taupe)]">
                {formatGuarani(product.originalPrice!)}
              </span>
            )}
          </div>
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {product.archived && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-taupe)] text-[color:var(--color-shell)] tracking-wider uppercase">Archivado</span>
          )}
          {!product.archived && !product.inStock && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-terra)] text-[color:var(--color-shell)] tracking-wider uppercase">Agotado</span>
          )}
          {onOffer && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] tracking-wider uppercase">Oferta</span>
          )}
          <label className="ml-auto inline-flex items-center gap-2 text-xs cursor-pointer select-none">
            <span>Stock</span>
            <span className="relative inline-block w-9 h-5">
              <input
                type="checkbox"
                checked={product.inStock}
                onChange={(e) => onToggleStock(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-[color:var(--color-cream)] peer-checked:bg-[color:var(--color-cocoa)] transition" />
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[color:var(--color-shell)] shadow transition peer-checked:translate-x-4" />
            </span>
          </label>
        </div>
      </div>
      <div className="flex-shrink-0 self-start">
        <ProductActionsMenu
          product={product}
          storeName={storeName}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
```

### B.4 Reescribir `/admin/products/page.tsx`

**Modify:** `src/app/admin/products/page.tsx`

Lógica:
- Llamar `loadAll(true)` al montar (incluir archivados).
- State: `query`, `categoryFilter`, `genderFilter`, `statusFilter` (`all|active|out|archived`), `sort`, `page`.
- Filtrado client-side con esa lógica.
- Mobile (`md:hidden`): cards. Desktop (`hidden md:block`): tabla.
- Acciones: editar (router.push a `/admin/products/[id]/edit`), duplicar (POST nuevo con datos copiados, sin id), archivar (PUT con archived flip), eliminar (DELETE).
- "Nuevo producto" → router.push a `/admin/products/new`.

Código completo en el plan de Fase C porque comparte componente.

### B.5 Build + commit Phase B

```bash
npm run build && npm test -- --run
git add -A
git commit -m "Phase B: lista de productos mobile-first con acciones"
git push origin main
```

---

## Phase C — Product Form como ruta dedicada

### C.1 ChipInput

**Create:** `src/components/admin/ChipInput.tsx`

```tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
};

export default function ChipInput({ label, value, onChange, placeholder, suggestions }: Props) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange([...value, v]);
    setDraft('');
  };

  const remove = (chip: string) => onChange(value.filter((c) => c !== chip));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const visibleSuggestions = suggestions
    ? suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-[color:var(--color-cream)] bg-[color:var(--color-shell)] rounded-md min-h-[42px]">
        {value.map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1 bg-[color:var(--color-cream)] text-[color:var(--color-cocoa)] text-sm px-2 py-1 rounded">
            {chip}
            <button type="button" onClick={() => remove(chip)} aria-label={`Quitar ${chip}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={placeholder ?? 'Tipear y presionar Enter'}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
      {visibleSuggestions.length > 0 && draft.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {visibleSuggestions.map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="text-xs px-2 py-1 rounded-full bg-[color:var(--color-cream)] hover:bg-[color:var(--color-tan)]/30">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### C.2 ImageDropzone

**Create:** `src/components/admin/ImageDropzone.tsx`

Drop zone que sube cada archivo a `/api/upload` y va llenando un array de URLs.

```tsx
'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

type Props = {
  label: string;
  value: string[];          // URLs
  onChange: (next: string[]) => void;
  multiple?: boolean;
  hint?: string;
};

export default function ImageDropzone({ label, value, onChange, multiple = false, hint }: Props) {
  const { show } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          urls.push(data.url);
        } else {
          show({ message: data.error || 'Error subiendo imagen' });
        }
      } catch {
        show({ message: 'Error de red al subir imagen' });
      }
    }
    if (urls.length > 0) {
      onChange(multiple ? [...value, ...urls] : [urls[0]]);
      show({ message: `${urls.length} imagen${urls.length > 1 ? 'es' : ''} subida${urls.length > 1 ? 's' : ''}` });
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
          drag ? 'border-[color:var(--color-cocoa)] bg-[color:var(--color-cream)]' : 'border-[color:var(--color-cream)] bg-[color:var(--color-shell)]'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 mx-auto text-[color:var(--color-taupe)]" />
        <p className="mt-2 text-sm">
          {uploading ? 'Subiendo…' : `Tocá o arrastrá ${multiple ? 'imágenes' : 'una imagen'} acá`}
        </p>
        {hint && <p className="text-xs text-[color:var(--color-taupe)] mt-1">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative aspect-square rounded overflow-hidden bg-[color:var(--color-cream)]">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 p-1 bg-[color:var(--color-shell)]/90 rounded-full"
                aria-label="Quitar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### C.3 ProductFormPage

**Create:** `src/components/admin/ProductFormPage.tsx`

Componente compartido por `/admin/products/new` y `/admin/products/[id]/edit`. Recibe `product?` y `mode: 'new' | 'edit'`. Renderiza form en secciones colapsables; sticky bottom con Guardar/Cancelar.

(Código completo en el archivo. Estructura: secciones `<details>` con `<summary>` para colapsar; en mobile abren todas por default; en desktop abren las primeras 3.)

### C.4 Routes new/[id]/edit

**Create:** `src/app/admin/products/new/page.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import ProductFormPage from '@/components/admin/ProductFormPage';
import type { Product } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const { show } = useToast();

  return (
    <ProductFormPage
      mode="new"
      onSave={async (data: Omit<Product, 'id'>) => {
        const ok = await addProduct(data);
        if (ok) {
          show({ message: 'Producto creado' });
          router.push('/admin/products');
        } else {
          show({ message: 'Error al crear producto' });
        }
      }}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
```

**Create:** `src/app/admin/products/[id]/edit/page.tsx`

```tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import ProductFormPage from '@/components/admin/ProductFormPage';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { products, updateProduct } = useProducts();
  const { show } = useToast();

  const product = products.find((p) => p.id === id);
  if (!product) {
    return <p className="text-[color:var(--color-taupe)]">Producto no encontrado.</p>;
  }

  return (
    <ProductFormPage
      mode="edit"
      product={product}
      onSave={async (data: Omit<Product, 'id'>) => {
        const ok = await updateProduct(id, data);
        if (ok) {
          show({ message: 'Cambios guardados' });
          router.push('/admin/products');
        } else {
          show({ message: 'Error al guardar' });
        }
      }}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
```

### C.5 Modify products list page

Reemplazar handlers de modal por router.push. Modal viejo eliminado. ProductForm.tsx queda sin uso (borrar al final).

### C.6 Borrar ProductForm.tsx viejo

```bash
git rm src/components/admin/ProductForm.tsx
```

### C.7 Build + commit Phase C

```bash
npm run build
git add -A
git commit -m "Phase C: form de producto como ruta dedicada con secciones, ChipInput, ImageDropzone"
git push origin main
```

---

## Phase D — Images + cleanup

### D.1 Fix /admin/images shape

**Modify:** `src/app/admin/images/page.tsx`

El endpoint actual `/api/upload` GET devuelve:
```json
{
  "message": "Upload endpoint is working",
  "bucket": "products",
  "maxFileSize": "5MB",
  "allowedTypes": ["image/jpeg", ...],
  "filesCount": N,
  "recentFiles": [{ "name", "size", "created", "url" }]
}
```

Adaptar `UploadStats` interface a ese shape; quitar referencias a `uploadDir`, `systemInfo`, `supportedSignatures`.

```ts
interface UploadStats {
  message: string;
  bucket: string;
  maxFileSize: string;
  allowedTypes: string[];
  filesCount: number;
  recentFiles: Array<{ name: string; size?: number; created?: string; url: string }>;
}
```

Mostrar `bucket` en lugar de `uploadDir`. Eliminar UI que mostraba systemInfo.

Aplicar paleta boutique a la página.

### D.2 Borrar ProductList.tsx vacío

```bash
git rm src/components/admin/ProductList.tsx
```

### D.3 Settings: quitar password decorativo

**Modify:** `src/app/admin/settings/page.tsx`

Eliminar el bloque "Cambiar contraseña" entero. Reemplazar con nota:

```tsx
<div className="bg-[color:var(--color-cream)] border border-[color:var(--color-tan)]/40 rounded-md p-4 text-sm text-[color:var(--color-cocoa)]">
  <p className="font-medium mb-1">Acceso al panel</p>
  <p className="text-[color:var(--color-taupe)]">
    El password se configura en variables de entorno de Vercel (<code>ADMIN_PASSWORD</code>).
    Cambialo desde el dashboard de Vercel y redeployá.
  </p>
</div>
```

Aplicar paleta al resto.

### D.4 Build + commit Phase D

```bash
npm run build
git add -A
git commit -m "Phase D: /admin/images fix Supabase + cleanup"
git push origin main
```

---

## Phase E — Dashboard polish

**Modify:** `src/app/admin/page.tsx`

Reescribir más simple:
- 3 KPIs: total, en stock, archivados
- Atajos: Nuevo producto, Imágenes, Configuración
- Lista "Sin stock" (top 5 productos con `inStock=false` y `archived=false`)

Aplicar paleta boutique. Eliminar las distribuciones por género (poco accionable).

```bash
npm run build
git add -A
git commit -m "Phase E: dashboard simplificado"
git push origin main
```

---

## Verificación final

- [ ] Build verde
- [ ] Tests verdes (23+)
- [ ] Sidebar funciona en mobile (drawer) y desktop (fijo)
- [ ] Productos: lista carga, filtros, sort, paginación
- [ ] Toggle stock inline funciona
- [ ] Archivar funciona (producto desaparece del público)
- [ ] Compartir WhatsApp abre wa.me con mensaje
- [ ] Form como página separada (no modal)
- [ ] ChipInput funciona
- [ ] ImageDropzone sube múltiples archivos
- [ ] /admin/images aparece en sidebar y carga datos del bucket
- [ ] Settings sin UI de password decorativo
- [ ] Dashboard con paleta nueva

## Migration script para correr en Supabase

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(archived);
```

Documentar en commit final que esto debe correrse antes de que el flag de archivar funcione.
