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
  const Chip = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
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
        <Chip
          active={selectedCategory === 'all'}
          onClick={() => onCategoryChange('all')}
        >
          Todo
        </Chip>
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
        <Chip
          active={selectedGender === 'mujer'}
          onClick={() => onGenderChange(selectedGender === 'mujer' ? 'all' : 'mujer')}
        >
          Mujer
        </Chip>
        <Chip
          active={selectedGender === 'hombre'}
          onClick={() => onGenderChange(selectedGender === 'hombre' ? 'all' : 'hombre')}
        >
          Hombre
        </Chip>

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
