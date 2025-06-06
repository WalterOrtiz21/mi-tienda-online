// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import { Product } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mapear datos de Supabase a nuestro tipo Product
const mapProductFromDB = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  price: dbProduct.price,
  originalPrice: dbProduct.original_price || undefined,
  image: dbProduct.image,
  images: dbProduct.images && dbProduct.images.length > 0 
    ? dbProduct.images.filter((img: string) => img && img !== dbProduct.image) // Filtrar imagen principal de las adicionales
    : [], 
  description: dbProduct.description,
  category: dbProduct.category as 'perfumes' | 'ropa',
  subcategory: dbProduct.subcategory,
  rating: dbProduct.rating,
  inStock: dbProduct.in_stock,
  features: dbProduct.features || [],
  tags: dbProduct.tags || []
})

// Mapear nuestro tipo Product a formato de DB
const mapProductToDB = (product: Omit<Product, 'id'>) => ({
  name: product.name,
  price: product.price,
  original_price: product.originalPrice || null,
  image: product.image,
  images: product.images && product.images.length > 0 
    ? product.images.filter(img => img && img !== product.image) // Solo guardar imágenes adicionales (sin la principal)
    : [],
  description: product.description,
  category: product.category,
  subcategory: product.subcategory,
  rating: product.rating,
  in_stock: product.inStock,
  features: product.features,
  tags: product.tags
})

// API Functions
export const productAPI = {
  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return data.map(mapProductFromDB)
  },

  // Crear producto
  async create(product: Omit<Product, 'id'>): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .insert([mapProductToDB(product)])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    return mapProductFromDB(data)
  },

  // Actualizar producto
  async update(id: number, product: Omit<Product, 'id'>): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...mapProductToDB(product),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return null
    }

    return mapProductFromDB(data)
  },

  // Eliminar producto
  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return false
    }

    return true
  }
}

// Settings API
export const settingsAPI = {
  async get() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching settings:', error)
      return {
        storeName: 'Tu Tienda Online',
        whatsappNumber: '595981234567'
      }
    }

    return {
      storeName: data.store_name,
      whatsappNumber: data.whatsapp_number,
      storeIcon: data.store_icon || undefined
    }
  },

  async update(settings: { storeName: string; whatsappNumber: string; storeIcon?: string }) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        store_name: settings.storeName,
        whatsapp_number: settings.whatsappNumber,
        store_icon: settings.storeIcon || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (error) {
      console.error('Error updating settings:', error)
      return false
    }

    return true
  }
}