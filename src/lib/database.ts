// src/lib/database.ts
// API de productos y settings sobre Supabase (Postgres).
// Mantiene la misma interfaz pública que la versión MySQL anterior.

import { Product } from './types';
import { supabase, getSupabaseAdmin } from './supabaseClient';

// ============================================================
// Helpers de mapeo: fila DB (snake_case) → Product (camelCase)
// ============================================================
const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const mapProductFromDB = (row: Record<string, unknown>): Product => ({
  id: Number(row.id),
  name: String(row.name),
  description: String(row.description ?? ''),
  price: Number(row.price),
  originalPrice:
    row.original_price !== null && row.original_price !== undefined
      ? Number(row.original_price)
      : undefined,
  image: String(row.image),
  images: toArray(row.images),
  category: row.category as 'prendas' | 'calzados',
  subcategory: String(row.subcategory),
  gender: row.gender as 'hombre' | 'mujer' | 'unisex',
  sizes: toArray(row.sizes),
  colors: toArray(row.colors),
  material: row.material ? String(row.material) : undefined,
  brand: row.brand ? String(row.brand) : undefined,
  rating: Number(row.rating ?? 0),
  inStock: Boolean(row.in_stock),
  features: toArray(row.features),
  tags: toArray(row.tags),
  createdAt: row.created_at ? String(row.created_at) : undefined,
  archived: Boolean(row.archived ?? false),
});

const productToRow = (p: Omit<Product, 'id'>) => ({
  name: p.name,
  description: p.description,
  price: p.price,
  original_price: p.originalPrice ?? null,
  image: p.image,
  images: p.images && p.images.length > 0 ? p.images : null,
  category: p.category,
  subcategory: p.subcategory,
  gender: p.gender,
  sizes: p.sizes ?? [],
  colors: p.colors && p.colors.length > 0 ? p.colors : null,
  material: p.material ?? null,
  brand: p.brand ?? null,
  rating: p.rating,
  in_stock: p.inStock,
  features: p.features ?? [],
  tags: p.tags ?? [],
  archived: p.archived ?? false,
});

// ============================================================
// productAPI
// ============================================================
export const productAPI = {
  async getAll(opts: { includeArchived?: boolean } = {}): Promise<Product[]> {
    // Filtro de archivados se aplica en JS para tolerar entornos donde
    // todavía no se corrió la migration que agrega la columna.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    const all = (data ?? []).map(mapProductFromDB);
    return opts.includeArchived ? all : all.filter((p) => !p.archived);
  },

  async getById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
    return data ? mapProductFromDB(data) : null;
  },

  async getByCategory(
    category: 'prendas' | 'calzados',
    opts: { includeArchived?: boolean } = {}
  ): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    const all = (data ?? []).map(mapProductFromDB);
    return opts.includeArchived ? all : all.filter((p) => !p.archived);
  },

  async create(product: Omit<Product, 'id'>): Promise<Product | null> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('products')
      .insert(productToRow(product))
      .select('*')
      .single();
    if (error) {
      console.error('Error creating product:', error);
      return null;
    }
    return data ? mapProductFromDB(data) : null;
  },

  async update(id: number, product: Omit<Product, 'id'>): Promise<Product | null> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('products')
      .update(productToRow(product))
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    return data ? mapProductFromDB(data) : null;
  },

  async delete(id: number): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    return true;
  },

  async search(filters: {
    category?: string;
    gender?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    inStock?: boolean;
    includeArchived?: boolean;
  }): Promise<Product[]> {
    let query = supabase.from('products').select('*');

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.gender && filters.gender !== 'all') {
      query = query.eq('gender', filters.gender);
    }
    if (filters.size && filters.size !== 'all') {
      // sizes es JSONB array → contains [size]
      query = query.contains('sizes', JSON.stringify([filters.size]));
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(
        `name.ilike.${term},description.ilike.${term},subcategory.ilike.${term},brand.ilike.${term}`
      );
    }
    if (filters.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }

    query = query
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    const all = (data ?? []).map(mapProductFromDB);
    return filters.includeArchived ? all : all.filter((p) => !p.archived);
  },

  async getStats() {
    // Postgres no permite GROUP BY directo desde el client REST;
    // hacemos los cálculos en JS sobre el dataset (es chico).
    const { data, error } = await supabase
      .from('products')
      .select('category, in_stock, price, rating');
    if (error) {
      console.error('Error getting stats:', error);
      return { byCategory: [], total: {} };
    }

    const rows = (data ?? []) as Array<{
      category: string;
      in_stock: boolean;
      price: number;
      rating: number;
    }>;

    const byCategoryMap = new Map<
      string,
      { total: number; in_stock: number; sumPrice: number; sumRating: number }
    >();
    for (const r of rows) {
      const acc =
        byCategoryMap.get(r.category) ??
        { total: 0, in_stock: 0, sumPrice: 0, sumRating: 0 };
      acc.total += 1;
      acc.in_stock += r.in_stock ? 1 : 0;
      acc.sumPrice += Number(r.price);
      acc.sumRating += Number(r.rating);
      byCategoryMap.set(r.category, acc);
    }
    const byCategory = Array.from(byCategoryMap.entries()).map(([category, v]) => ({
      category,
      total: v.total,
      in_stock: v.in_stock,
      avg_price: v.total ? v.sumPrice / v.total : 0,
      avg_rating: v.total ? v.sumRating / v.total : 0,
    }));

    const total = rows.length
      ? {
          total_products: rows.length,
          total_in_stock: rows.filter((r) => r.in_stock).length,
          avg_price: rows.reduce((s, r) => s + Number(r.price), 0) / rows.length,
          min_price: Math.min(...rows.map((r) => Number(r.price))),
          max_price: Math.max(...rows.map((r) => Number(r.price))),
        }
      : {};

    return { byCategory, total };
  },
};

// ============================================================
// settingsAPI
// ============================================================
export const settingsAPI = {
  async get() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Error fetching settings:', error);
      return {
        storeName: 'Annya Modas - Prendas & Calzados',
        whatsappNumber: '595981234567',
      };
    }
    return {
      storeName: data.store_name as string,
      whatsappNumber: data.whatsapp_number as string,
      storeIcon: (data.store_icon as string | null) ?? undefined,
    };
  },

  async update(settings: {
    storeName: string;
    whatsappNumber: string;
    storeIcon?: string;
  }) {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('store_settings')
      .update({
        store_name: settings.storeName,
        whatsapp_number: settings.whatsappNumber,
        store_icon: settings.storeIcon ?? null,
      })
      .eq('id', 1);
    if (error) {
      console.error('Error updating settings:', error);
      return false;
    }
    return true;
  },
};

// Test de conexión (solo se ejecuta cuando se llama explícitamente, no en import).
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('store_settings').select('id').limit(1);
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
