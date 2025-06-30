// src/lib/database.ts

import mysql from 'mysql2/promise';
import { Product } from './types';

// Configuración de la conexión con UTF-8 explícito
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'annyamodas_user',
  password: process.env.DATABASE_PASSWORD || '5eba7d39cfb',
  database: process.env.DATABASE_NAME || 'annyamodas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  typeCast: function (field: any, next: any) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
};

// Pool de conexiones
let pool: mysql.Pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Función helper para ejecutar queries
export const executeQuery = async (query: string, params: any[] = []) => {
  try {
    const pool = getPool();
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Función helper para parsear JSON de forma segura
const safeJsonParse = (jsonString: any, fallback: any[] = []): any[] => {
  if (!jsonString) return fallback;
  
  if (Array.isArray(jsonString)) return jsonString;
  
  if (typeof jsonString === 'string') {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.error('JSON parse error:', error, 'for value:', jsonString);
      return fallback;
    }
  }
  
  return fallback;
};

// Mapear datos de MySQL a nuestro tipo Product actualizado
const mapProductFromDB = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  price: parseFloat(dbProduct.price),
  originalPrice: dbProduct.original_price ? parseFloat(dbProduct.original_price) : undefined,
  image: dbProduct.image,
  images: safeJsonParse(dbProduct.images, []),
  description: dbProduct.description,
  category: dbProduct.category as 'prendas' | 'calzados',
  subcategory: dbProduct.subcategory,
  gender: dbProduct.gender as 'hombre' | 'mujer' | 'unisex',
  sizes: safeJsonParse(dbProduct.sizes, []),
  colors: safeJsonParse(dbProduct.colors, []),
  material: dbProduct.material || undefined,
  brand: dbProduct.brand || undefined,
  rating: parseFloat(dbProduct.rating),
  inStock: Boolean(dbProduct.in_stock),
  features: safeJsonParse(dbProduct.features, []),
  tags: safeJsonParse(dbProduct.tags, [])
});

// API Functions para productos actualizadas
export const productAPI = {
  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    try {
      const results = await executeQuery(
        'SELECT * FROM products ORDER BY created_at DESC'
      ) as any[];
      
      return results.map(mapProductFromDB);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Product | null> {
    try {
      const results = await executeQuery(
        'SELECT * FROM products WHERE id = ?',
        [id]
      ) as any[];
      
      return results.length > 0 ? mapProductFromDB(results[0]) : null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  },

  // Obtener productos por categoría
  async getByCategory(category: 'prendas' | 'calzados'): Promise<Product[]> {
    try {
      const results = await executeQuery(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
        [category]
      ) as any[];
      
      return results.map(mapProductFromDB);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  // Crear producto actualizado
  async create(product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      const result = await executeQuery(
        `INSERT INTO products 
         (name, description, price, original_price, image, images, category, subcategory, 
          gender, sizes, colors, material, brand, rating, in_stock, features, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.description,
          product.price,
          product.originalPrice || null,
          product.image,
          product.images && product.images.length > 0 ? JSON.stringify(product.images) : null,
          product.category,
          product.subcategory,
          product.gender,
          product.sizes && product.sizes.length > 0 ? JSON.stringify(product.sizes) : JSON.stringify([]),
          product.colors && product.colors.length > 0 ? JSON.stringify(product.colors) : null,
          product.material || null,
          product.brand || null,
          product.rating,
          product.inStock,
          JSON.stringify(product.features || []),
          JSON.stringify(product.tags || [])
        ]
      ) as any;

      const newProducts = await executeQuery(
        'SELECT * FROM products WHERE id = ?',
        [result.insertId]
      ) as any[];

      return newProducts.length > 0 ? mapProductFromDB(newProducts[0]) : null;
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  },

  // Actualizar producto
  async update(id: number, product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      // Verificar que el producto existe
      const existingProduct = await this.getById(id);
      if (!existingProduct) {
        console.error('Product not found for update:', id);
        return null;
      }

      await executeQuery(
        `UPDATE products SET 
         name = ?, description = ?, price = ?, original_price = ?, image = ?, images = ?, 
         category = ?, subcategory = ?, gender = ?, sizes = ?, colors = ?, material = ?, 
         brand = ?, rating = ?, in_stock = ?, features = ?, tags = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          product.name,
          product.description,
          product.price,
          product.originalPrice || null,
          product.image,
          product.images && product.images.length > 0 ? JSON.stringify(product.images) : null,
          product.category,
          product.subcategory,
          product.gender,
          product.sizes && product.sizes.length > 0 ? JSON.stringify(product.sizes) : JSON.stringify([]),
          product.colors && product.colors.length > 0 ? JSON.stringify(product.colors) : null,
          product.material || null,
          product.brand || null,
          product.rating,
          product.inStock,
          JSON.stringify(product.features || []),
          JSON.stringify(product.tags || []),
          id
        ]
      );

      // Obtener el producto actualizado
      const updatedProducts = await executeQuery(
        'SELECT * FROM products WHERE id = ?',
        [id]
      ) as any[];

      return updatedProducts.length > 0 ? mapProductFromDB(updatedProducts[0]) : null;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  },

  // Eliminar producto
  async delete(id: number): Promise<boolean> {
    try {
      const result = await executeQuery('DELETE FROM products WHERE id = ?', [id]) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  },

  // Buscar productos con filtros avanzados
  async search(filters: {
    category?: string;
    gender?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    inStock?: boolean;
  }): Promise<Product[]> {
    try {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params: any[] = [];

      if (filters.category && filters.category !== 'all') {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.gender && filters.gender !== 'all') {
        query += ' AND gender = ?';
        params.push(filters.gender);
      }

      if (filters.size && filters.size !== 'all') {
        query += ' AND JSON_CONTAINS(sizes, JSON_QUOTE(?))';
        params.push(filters.size);
      }

      if (filters.minPrice) {
        query += ' AND price >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        query += ' AND price <= ?';
        params.push(filters.maxPrice);
      }

      if (filters.searchTerm) {
        query += ' AND (name LIKE ? OR description LIKE ? OR subcategory LIKE ? OR brand LIKE ?)';
        const searchPattern = `%${filters.searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (filters.inStock !== undefined) {
        query += ' AND in_stock = ?';
        params.push(filters.inStock);
      }

      query += ' ORDER BY rating DESC, created_at DESC';

      const results = await executeQuery(query, params) as any[];
      return results.map(mapProductFromDB);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // ✅ Obtener estadísticas CON TIPOS CORREGIDOS
  async getStats() {
    try {
      // ✅ Tipado correcto para las queries
      const categoryStats = await executeQuery(`
        SELECT 
          category,
          COUNT(*) as total,
          COUNT(CASE WHEN in_stock = 1 THEN 1 END) as in_stock,
          AVG(price) as avg_price,
          AVG(rating) as avg_rating
        FROM products 
        GROUP BY category
      `) as any[];

      const totalStatsResult = await executeQuery(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN in_stock = 1 THEN 1 END) as total_in_stock,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM products
      `) as any[];

      return {
        byCategory: categoryStats,
        total: totalStatsResult[0] || {}
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { byCategory: [], total: {} };
    }
  }
};

// Settings API (sin cambios)
export const settingsAPI = {
  async get() {
    try {
      const results = await executeQuery(
        'SELECT * FROM store_settings WHERE id = 1'
      ) as any[];

      if (results.length > 0) {
        const settings = results[0];
        return {
          storeName: settings.store_name,
          whatsappNumber: settings.whatsapp_number,
          storeIcon: settings.store_icon || undefined
        };
      }

      return {
        storeName: 'Annya Modas - Prendas & Calzados',
        whatsappNumber: '595981234567'
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        storeName: 'Annya Modas - Prendas & Calzados',
        whatsappNumber: '595981234567'
      };
    }
  },

  async update(settings: { storeName: string; whatsappNumber: string; storeIcon?: string }) {
    try {
      await executeQuery(
        `UPDATE store_settings SET 
         store_name = ?, whatsapp_number = ?, store_icon = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [settings.storeName, settings.whatsappNumber, settings.storeIcon || null]
      );
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }
};

// Test de conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await executeQuery('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};