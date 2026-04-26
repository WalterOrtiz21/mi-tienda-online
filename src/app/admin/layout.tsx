'use client';

import { useState } from 'react';
import {
  Menu,
  X,
  Package,
  Settings,
  Image as ImageIcon,
  BarChart3,
  Home,
  LogOut,
} from 'lucide-react';
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[color:var(--color-cream)]">
        {/* Backdrop mobile */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-full w-64 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] transform transition-transform md:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="h-16 px-5 flex items-center justify-between border-b border-[color:var(--color-shell)]/10">
            <Wordmark
              size="md"
              href={null}
              className="!text-[color:var(--color-shell)]"
            />
            <button
              className="md:hidden p-2"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                !item.external &&
                (item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md mb-1 text-sm tracking-wide transition-colors ${
                    active
                      ? 'bg-[color:var(--color-shell)]/15 text-[color:var(--color-shell)]'
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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-[color:var(--color-cream)]/80 hover:bg-[color:var(--color-terra)]/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Header mobile */}
        <header className="md:hidden h-14 sticky top-0 z-20 bg-[color:var(--color-shell)] border-b border-[color:var(--color-cream)] px-4 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="p-2 -ml-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Wordmark size="sm" href={null} />
          <span className="w-10" />
        </header>

        {/* Content */}
        <main className="md:ml-64 p-4 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
