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
  // Configuraciones adicionales para UTF-8
  typeCast: function (field: any, next: any) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
};

// Pool de conexiones para mejor rendimiento
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
  
  // Si ya es un array, devolverlo
  if (Array.isArray(jsonString)) return jsonString;
  
  // Si es string, intentar parsearlo
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

// Mapear datos de MySQL a nuestro tipo Product
const mapProductFromDB = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  price: parseFloat(dbProduct.price),
  originalPrice: dbProduct.original_price ? parseFloat(dbProduct.original_price) : undefined,
  image: dbProduct.image,
  images: safeJsonParse(dbProduct.images, []),
  description: dbProduct.description,
  category: dbProduct.category as 'perfumes' | 'ropa',
  subcategory: dbProduct.subcategory,
  gender: dbProduct.gender as 'hombre' | 'mujer' | 'unisex' || undefined,
  rating: parseFloat(dbProduct.rating),
  inStock: Boolean(dbProduct.in_stock),
  features: safeJsonParse(dbProduct.features, []),
  tags: safeJsonParse(dbProduct.tags, [])
});

// API Functions para productos
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

  // Crear producto
  async create(product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      const result = await executeQuery(
        `INSERT INTO products 
         (name, description, price, original_price, image, images, category, subcategory, gender, rating, in_stock, features, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.description,
          product.price,
          product.originalPrice || null,
          product.image,
          product.images && product.images.length > 0 ? JSON.stringify(product.images) : null,
          product.category,
          product.subcategory,
          product.gender || null,
          product.rating,
          product.inStock,
          JSON.stringify(product.features || []),
          JSON.stringify(product.tags || [])
        ]
      ) as any;

      // Obtener el producto creado
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
      await executeQuery(
        `UPDATE products SET 
         name = ?, description = ?, price = ?, original_price = ?, image = ?, images = ?, 
         category = ?, subcategory = ?, gender = ?, rating = ?, in_stock = ?, features = ?, tags = ?,
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
          product.gender || null,
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
      await executeQuery('DELETE FROM products WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
};

// Settings API
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
        storeName: 'Tu Tienda Online',
        whatsappNumber: '595981234567'
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        storeName: 'Tu Tienda Online',
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