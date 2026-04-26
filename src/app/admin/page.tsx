'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Package, Image as ImageIcon, Settings, Plus, AlertTriangle, Archive } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import { formatGuarani } from '@/lib/whatsappMessage';

export default function AdminDashboard() {
  const { products, settings, loadAll, isLoading } = useProducts();

  useEffect(() => {
    loadAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = products.filter((p) => !p.archived).length;
  const inStock = products.filter((p) => !p.archived && p.inStock).length;
  const outOfStock = products.filter((p) => !p.archived && !p.inStock);
  const archived = products.filter((p) => p.archived).length;

  if (isLoading && products.length === 0) {
    return <p className="text-[color:var(--color-taupe)]">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-[color:var(--color-cocoa)]">
          Hola
        </h1>
        <p className="text-sm text-[color:var(--color-taupe)]">
          {settings.storeName} · WhatsApp +{settings.whatsappNumber}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Activos" value={total} tone="cocoa" icon={Package} />
        <Kpi label="En stock" value={inStock} tone="cream" icon={Package} />
        <Kpi label="Archivados" value={archived} tone="taupe" icon={Archive} />
      </div>

      {/* Atajos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Shortcut href="/admin/products/new" icon={Plus} label="Nuevo producto" highlight />
        <Shortcut href="/admin/images" icon={ImageIcon} label="Imágenes" />
        <Shortcut href="/admin/settings" icon={Settings} label="Configuración" />
      </div>

      {/* Sin stock */}
      <section className="bg-[color:var(--color-shell)] rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[color:var(--color-cream)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[color:var(--color-terra)]" />
          <h2 className="font-display text-lg">Sin stock</h2>
          {outOfStock.length > 0 && (
            <span className="ml-auto text-xs text-[color:var(--color-taupe)]">
              {outOfStock.length} producto{outOfStock.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {outOfStock.length === 0 ? (
          <p className="px-5 py-8 text-center text-[color:var(--color-taupe)] text-sm">
            Todos los productos activos están en stock.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--color-cream)]">
            {outOfStock.slice(0, 8).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[color:var(--color-cream)]/40"
                >
                  <img
                    src={p.image}
                    alt=""
                    className="w-10 h-12 object-cover rounded bg-[color:var(--color-cream)]"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[color:var(--color-taupe)] capitalize">
                      {p.category} · {p.subcategory}
                    </p>
                  </div>
                  <span className="text-sm text-[color:var(--color-taupe)]">
                    {formatGuarani(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: 'cocoa' | 'cream' | 'taupe';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles: Record<string, string> = {
    cocoa: 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]',
    cream: 'bg-[color:var(--color-shell)] text-[color:var(--color-cocoa)] border border-[color:var(--color-cream)]',
    taupe: 'bg-[color:var(--color-taupe)] text-[color:var(--color-shell)]',
  };
  return (
    <div className={`rounded-lg p-4 ${styles[tone]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-90">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

function Shortcut({
  href,
  label,
  icon: Icon,
  highlight,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  const cls = highlight
    ? 'bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]'
    : 'bg-[color:var(--color-shell)] text-[color:var(--color-cocoa)] border border-[color:var(--color-cream)]';
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm uppercase tracking-wider hover:opacity-90 ${cls}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
