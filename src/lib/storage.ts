// src/lib/storage.ts

import { Product } from './types';
import { products as defaultProducts } from './products';

const STORAGE_KEYS = {
  PRODUCTS: 'store_products',
  SETTINGS: 'store_settings'
};

// Productos
export const getStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') return defaultProducts;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading products from storage:', error);
  }
  
  return defaultProducts;
};

export const saveProducts = (products: Product[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving products to storage:', error);
  }
};

// Configuración de la tienda
export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  adminPassword?: string;
}

export const getStoreSettings = (): StoreSettings => {
  if (typeof window === 'undefined') {
    return {
      storeName: 'Tu Tienda Online',
      whatsappNumber: '595981234567'
    };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading settings from storage:', error);
  }
  
  return {
    storeName: 'Tu Tienda Online',
    whatsappNumber: '595981234567'
  };
};

export const saveStoreSettings = (settings: StoreSettings): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to storage:', error);
  }
};

// Resetear toda la data (útil para desarrollo)
export const resetStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
};

// Exportar/Importar data (backup)
export const exportData = () => {
  const products = getStoredProducts();
  const settings = getStoreSettings();
  
  const data = {
    products,
    settings,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `store-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<{ products: Product[], settings: StoreSettings }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.products && data.settings) {
          resolve({
            products: data.products,
            settings: data.settings
          });
        } else {
          reject(new Error('Formato de archivo inválido'));
        }
      } catch {
        reject(new Error('Error al procesar el archivo'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};