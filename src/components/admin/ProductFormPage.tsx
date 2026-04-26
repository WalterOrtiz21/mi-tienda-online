'use client';

import { useState } from 'react';
import { Save, ArrowLeft, ChevronDown } from 'lucide-react';
import type { Product } from '@/lib/types';
import { CATEGORIES, CLOTHING_SIZES, SHOE_SIZES } from '@/lib/types';
import ChipInput from './ChipInput';
import ImageDropzone from './ImageDropzone';
import { formatGuarani } from '@/lib/whatsappMessage';

type Mode = 'new' | 'edit';

type Props = {
  mode: Mode;
  product?: Product;
  onSave: (data: Omit<Product, 'id'>) => Promise<void> | void;
  onCancel: () => void;
};

export default function ProductFormPage({ mode, product, onSave, onCancel }: Props) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState<number>(product?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number>(
    product?.originalPrice ?? 0
  );
  const [inStock, setInStock] = useState<boolean>(product?.inStock ?? true);
  const [archived, setArchived] = useState<boolean>(product?.archived ?? false);
  const [category, setCategory] = useState<'prendas' | 'calzados'>(
    product?.category ?? 'prendas'
  );
  const [subcategory, setSubcategory] = useState<string>(
    product?.subcategory ?? CATEGORIES.prendas.subcategories[0]
  );
  const [gender, setGender] = useState<'mujer' | 'hombre' | 'unisex'>(
    product?.gender ?? 'unisex'
  );
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [material, setMaterial] = useState(product?.material ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [rating, setRating] = useState<number>(product?.rating ?? 4);
  const [features, setFeatures] = useState<string[]>(product?.features ?? []);
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [image, setImage] = useState<string>(product?.image ?? '');
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subcategorySuggestions =
    category === 'prendas'
      ? [...CATEGORIES.prendas.subcategories]
      : [...CATEGORIES.calzados.subcategories];

  const sizeSuggestions = category === 'prendas' ? CLOTHING_SIZES : SHOE_SIZES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('El nombre es requerido');
    if (price <= 0) return setError('El precio debe ser mayor a 0');
    if (!image) return setError('La imagen principal es requerida');
    if (!subcategory) return setError('La subcategoría es requerida');

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price,
        originalPrice: originalPrice > 0 ? originalPrice : undefined,
        image,
        images,
        category,
        subcategory,
        gender,
        sizes,
        colors,
        material: material.trim() || undefined,
        brand: brand.trim() || undefined,
        rating,
        inStock,
        features,
        tags,
        archived,
      });
    } catch {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded hover:bg-[color:var(--color-cream)]"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl md:text-2xl text-[color:var(--color-cocoa)] truncate">
            {mode === 'new' ? 'Nuevo producto' : name || 'Editar producto'}
          </h1>
          {mode === 'edit' && (
            <p className="text-xs text-[color:var(--color-taupe)]">
              ID: {product?.id} · {formatGuarani(price)}
            </p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="hidden md:inline-flex items-center gap-2 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] px-4 py-2 rounded-md text-sm uppercase tracking-wider disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="bg-[color:var(--color-terra)]/10 border border-[color:var(--color-terra)]/30 text-[color:var(--color-terra)] rounded-md px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Sección 1: Información básica */}
        <Section title="Información básica" defaultOpen>
          <Field label="Nombre *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="form-input"
              placeholder="Pegá acá lo que tenés en WhatsApp"
            />
          </Field>
        </Section>

        {/* Sección 2: Precios y stock */}
        <Section title="Precio y disponibilidad" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (Gs.) *">
              <input
                type="number"
                inputMode="numeric"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                min={0}
                required
                className="form-input"
              />
            </Field>
            <Field label="Precio anterior (Gs.)">
              <input
                type="number"
                inputMode="numeric"
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
                min={0}
                className="form-input"
              />
            </Field>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            <Toggle
              label="En stock"
              hint="Si está apagado, muestra 'Agotado' en la tienda"
              checked={inStock}
              onChange={setInStock}
            />
            <Toggle
              label="Archivado"
              hint="Si está activo, no aparece en la tienda pública"
              checked={archived}
              onChange={setArchived}
            />
          </div>
        </Section>

        {/* Sección 3: Categoría */}
        <Section title="Categoría" defaultOpen>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Categoría *">
              <select
                value={category}
                onChange={(e) => {
                  const next = e.target.value as 'prendas' | 'calzados';
                  setCategory(next);
                  setSubcategory(CATEGORIES[next].subcategories[0]);
                  setSizes([]);
                }}
                className="form-input"
              >
                <option value="prendas">Prendas</option>
                <option value="calzados">Calzados</option>
              </select>
            </Field>
            <Field label="Subcategoría *">
              <input
                list="subcat-suggestions"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="form-input"
                required
              />
              <datalist id="subcat-suggestions">
                {subcategorySuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Para *">
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as 'mujer' | 'hombre' | 'unisex')
                }
                className="form-input"
              >
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
                <option value="unisex">Unisex</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Sección 4: Variantes */}
        <Section title="Talles y colores">
          <ChipInput
            label="Talles"
            value={sizes}
            onChange={setSizes}
            suggestions={[...sizeSuggestions]}
            placeholder="Tipear y Enter"
            hint="Sugerencias según categoría. También podés escribir el tuyo."
          />
          <ChipInput
            label="Colores"
            value={colors}
            onChange={setColors}
            placeholder="Negro, Blanco, ..."
          />
        </Section>

        {/* Sección 5: Imágenes */}
        <Section title="Imágenes" defaultOpen>
          <ImageDropzone
            label="Imagen principal *"
            value={image ? [image] : []}
            onChange={(arr) => setImage(arr[0] ?? '')}
            multiple={false}
            hint="Esta es la que se ve en la tarjeta del catálogo"
          />
          <ImageDropzone
            label="Imágenes adicionales"
            value={images}
            onChange={setImages}
            multiple
            hint="Aparecen en el detalle del producto. Podés subir varias a la vez."
          />
        </Section>

        {/* Sección 6: Detalles opcionales */}
        <Section title="Detalles opcionales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Material">
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Marca">
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
          <Field label={`Rating: ${rating.toFixed(1)}`}>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <ChipInput
            label="Características"
            value={features}
            onChange={setFeatures}
            placeholder="Ej: Algodón premium, Lavable…"
          />
          <ChipInput
            label="Tags de búsqueda"
            value={tags}
            onChange={setTags}
            placeholder="Ej: invierno, formal, cómodo…"
          />
        </Section>
      </form>

      {/* Bottom action bar (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[color:var(--color-shell)] border-t border-[color:var(--color-cream)] p-3 flex gap-2 z-30">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-[color:var(--color-cream)] rounded-md text-sm uppercase tracking-wider"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-3 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] rounded-md text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: var(--color-shell);
          border: 1px solid var(--color-cream);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: var(--color-cocoa);
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: var(--color-cocoa);
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="bg-[color:var(--color-shell)] rounded-lg shadow-sm group"
    >
      <summary className="px-4 py-3 cursor-pointer flex items-center justify-between font-medium text-[color:var(--color-cocoa)] list-none">
        {title}
        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 space-y-3 border-t border-[color:var(--color-cream)] pt-4">
        {children}
      </div>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[color:var(--color-cocoa)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex-1 flex items-center justify-between gap-3 px-3 py-2.5 bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md cursor-pointer">
      <div>
        <p className="text-sm font-medium text-[color:var(--color-cocoa)]">{label}</p>
        {hint && (
          <p className="text-xs text-[color:var(--color-taupe)] mt-0.5">{hint}</p>
        )}
      </div>
      <span className="relative inline-block w-10 h-6 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[color:var(--color-cream)] peer-checked:bg-[color:var(--color-cocoa)] transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[color:var(--color-shell)] shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
