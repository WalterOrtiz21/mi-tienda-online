'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  ArchiveRestore,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { shareProductWhatsAppUrl } from '@/lib/adminWhatsApp';

type Props = {
  product: Product;
  storeName?: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

export default function ProductActionsMenu({
  product,
  storeName,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: Props) {
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
        aria-label="Acciones del producto"
        className="p-2 hover:bg-[color:var(--color-cream)] rounded transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md shadow-lg z-20 py-1">
          <Item
            icon={Edit2}
            label="Editar"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          />
          <Item
            icon={Copy}
            label="Duplicar"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          />
          <Item
            icon={product.archived ? ArchiveRestore : Archive}
            label={product.archived ? 'Desarchivar' : 'Archivar'}
            onClick={() => {
              setOpen(false);
              onToggleArchive();
            }}
          />
          <a
            href={shareProductWhatsAppUrl(product, storeName)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[color:var(--color-cream)]"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </a>
          <div className="border-t border-[color:var(--color-cream)] my-1" />
          <Item
            icon={Trash2}
            label="Eliminar"
            danger
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          />
        </div>
      )}
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
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
