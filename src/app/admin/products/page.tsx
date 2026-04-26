'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, RefreshCw, Filter } from 'lucide-react';
import { Product } from '@/lib/types';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatGuarani } from '@/lib/whatsappMessage';
import ProductCardAdmin from '@/components/admin/ProductCardAdmin';
import ProductActionsMenu from '@/components/admin/ProductActionsMenu';

type StatusFilter = 'all' | 'active' | 'out' | 'archived' | 'offers';
type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';
const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const router = useRouter();
  const { products, settings, addProduct, updateProduct, deleteProduct, loadAll, isLoading } =
    useProducts();
  const { show } = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [working, setWorking] = useState(false);

  // Cargar todos (incluyendo archivados) al montar
  useEffect(() => {
    loadAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand?.toLowerCase().includes(q) ?? false) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }

    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    switch (status) {
      case 'active':
        list = list.filter((p) => !p.archived && p.inStock);
        break;
      case 'out':
        list = list.filter((p) => !p.archived && !p.inStock);
        break;
      case 'archived':
        list = list.filter((p) => p.archived);
        break;
      case 'offers':
        list = list.filter(
          (p) => !p.archived && p.originalPrice && p.originalPrice > p.price
        );
        break;
      case 'all':
      default:
        list = list.filter((p) => !p.archived);
        break;
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        list.sort((a, b) => {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0;
          const db = b.createdAt ? Date.parse(b.createdAt) : 0;
          return db - da;
        });
        break;
    }

    return list;
  }, [products, query, status, category, sort]);

  useEffect(() => setPage(1), [query, status, category, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- handlers ----
  const handleEdit = (p: Product) => router.push(`/admin/products/${p.id}/edit`);

  const handleDuplicate = async (p: Product) => {
    setWorking(true);
    const dup: Omit<Product, 'id'> = {
      ...p,
      name: `${p.name} (copia)`,
      archived: false,
    };
    delete (dup as Partial<Product>).createdAt;
    const ok = await addProduct(dup);
    show({ message: ok ? 'Producto duplicado' : 'Error al duplicar' });
    setWorking(false);
  };

  const handleToggleArchive = async (p: Product) => {
    setWorking(true);
    const ok = await updateProduct(p.id, { ...p, archived: !p.archived });
    show({
      message: ok ? (p.archived ? 'Desarchivado' : 'Archivado') : 'Error al actualizar',
    });
    setWorking(false);
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setWorking(true);
    const ok = await deleteProduct(p.id);
    show({ message: ok ? 'Producto eliminado' : 'Error al eliminar' });
    setWorking(false);
  };

  const handleToggleStock = async (p: Product, next: boolean) => {
    setWorking(true);
    const ok = await updateProduct(p.id, { ...p, inStock: next });
    show({
      message: ok ? (next ? 'Marcado en stock' : 'Marcado agotado') : 'Error al actualizar',
      durationMs: 1200,
    });
    setWorking(false);
  };

  const counts = useMemo(() => {
    const all = products.filter((p) => !p.archived).length;
    const out = products.filter((p) => !p.archived && !p.inStock).length;
    const archived = products.filter((p) => p.archived).length;
    return { all, out, archived };
  }, [products]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[color:var(--color-cocoa)]">
            Productos
          </h1>
          <p className="text-sm text-[color:var(--color-taupe)]">
            {counts.all} activos · {counts.out} agotados · {counts.archived} archivados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAll(true)}
            disabled={isLoading || working}
            className="p-2 rounded-md bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] disabled:opacity-50"
            aria-label="Actualizar"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] px-3 md:px-4 py-2 rounded-md text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Filters bar (sticky) */}
      <div className="sticky top-14 md:top-0 z-10 bg-[color:var(--color-cream)] py-2 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-[color:var(--color-tan)]/30">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex items-center gap-2 bg-[color:var(--color-shell)] rounded-md px-3 py-2 border border-[color:var(--color-cream)] flex-1">
            <Search className="w-4 h-4 text-[color:var(--color-taupe)] flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, marca, subcategoría…"
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 md:m-0 md:p-0">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="text-sm bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md px-3 py-2"
            >
              <option value="all">Todos activos</option>
              <option value="active">En stock</option>
              <option value="out">Agotados</option>
              <option value="offers">En oferta</option>
              <option value="archived">Archivados</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md px-3 py-2"
            >
              <option value="all">Todas categorías</option>
              <option value="prendas">Prendas</option>
              <option value="calzados">Calzados</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md px-3 py-2"
            >
              <option value="recent">Más recientes</option>
              <option value="price-desc">Precio mayor</option>
              <option value="price-asc">Precio menor</option>
              <option value="name">Alfabético</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && products.length === 0 ? (
        <div className="text-center py-16 text-[color:var(--color-taupe)]">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
          <p className="mt-3 text-[color:var(--color-taupe)]">
            {query || status !== 'all' || category !== 'all'
              ? 'No hay productos con esos filtros.'
              : 'Aún no tenés productos. Creá el primero.'}
          </p>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="mt-4 inline-flex items-center gap-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] px-4 py-2 rounded-md text-sm uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Nuevo producto
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-2">
            {paged.map((p) => (
              <ProductCardAdmin
                key={p.id}
                product={p}
                storeName={settings.storeName}
                onToggleStock={(next) => handleToggleStock(p, next)}
                onEdit={() => handleEdit(p)}
                onDuplicate={() => handleDuplicate(p)}
                onToggleArchive={() => handleToggleArchive(p)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>

          {/* Desktop: tabla compacta */}
          <div className="hidden md:block bg-[color:var(--color-shell)] rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-[color:var(--color-cream)]">
              <thead className="bg-[color:var(--color-cream)]">
                <tr>
                  <Th>Producto</Th>
                  <Th>Categoría</Th>
                  <Th>Precio</Th>
                  <Th>Estado</Th>
                  <Th>Stock</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-cream)]">
                {paged.map((p) => {
                  const onOffer = !!(p.originalPrice && p.originalPrice > p.price);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[color:var(--color-cream)]/40 ${
                        p.archived ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(p)}
                          className="flex items-center gap-3 text-left"
                        >
                          <img
                            src={p.image}
                            alt=""
                            className="w-12 h-14 object-cover rounded bg-[color:var(--color-cream)]"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-[color:var(--color-taupe)]">
                              {p.brand ?? '—'} · {p.gender}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {p.category}
                        <div className="text-xs text-[color:var(--color-taupe)]">
                          {p.subcategory}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatGuarani(p.price)}
                        {onOffer && (
                          <div className="text-xs text-[color:var(--color-taupe)] line-through">
                            {formatGuarani(p.originalPrice!)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.archived && (
                            <Badge tone="taupe">Archivado</Badge>
                          )}
                          {!p.archived && !p.inStock && (
                            <Badge tone="terra">Agotado</Badge>
                          )}
                          {onOffer && <Badge tone="cocoa">Oferta</Badge>}
                          {!p.archived && p.inStock && !onOffer && (
                            <Badge tone="cream">Activo</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                          <span className="relative inline-block w-9 h-5">
                            <input
                              type="checkbox"
                              checked={p.inStock}
                              onChange={(e) => handleToggleStock(p, e.target.checked)}
                              className="peer sr-only"
                            />
                            <span className="absolute inset-0 rounded-full bg-[color:var(--color-cream)] peer-checked:bg-[color:var(--color-cocoa)] transition-colors" />
                            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[color:var(--color-shell)] shadow transition-transform peer-checked:translate-x-4" />
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ProductActionsMenu
                          product={p}
                          storeName={settings.storeName}
                          onEdit={() => handleEdit(p)}
                          onDuplicate={() => handleDuplicate(p)}
                          onToggleArchive={() => handleToggleArchive(p)}
                          onDelete={() => handleDelete(p)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm rounded border border-[color:var(--color-cream)] bg-[color:var(--color-shell)] disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-[color:var(--color-taupe)] mx-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm rounded border border-[color:var(--color-cream)] bg-[color:var(--color-shell)] disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-4 py-2 text-${align} text-[10px] font-semibold text-[color:var(--color-taupe)] uppercase tracking-wider`}
    >
      {children}
    </th>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'taupe' | 'terra' | 'cocoa' | 'cream';
}) {
  const map: Record<string, string> = {
    taupe: 'bg-[color:var(--color-taupe)] text-[color:var(--color-shell)]',
    terra: 'bg-[color:var(--color-terra)] text-[color:var(--color-shell)]',
    cocoa: 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]',
    cream:
      'bg-[color:var(--color-cream)] text-[color:var(--color-cocoa)] border border-[color:var(--color-tan)]/30',
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${map[tone]}`}
    >
      {children}
    </span>
  );
}
