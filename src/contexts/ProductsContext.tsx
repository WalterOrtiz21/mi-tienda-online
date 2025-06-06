// src/contexts/ProductsContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { productAPI, settingsAPI } from '@/lib/supabase';

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  storeIcon?: string;
  adminPassword?: string;
}

interface ProductsContextType {
  products: Product[];
  settings: StoreSettings;
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: number, product: Omit<Product, 'id'>) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
  updateSettings: (settings: StoreSettings) => Promise<boolean>;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

interface ProductsProviderProps {
  children: ReactNode;
}

export const ProductsProvider: React.FC<ProductsProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'Tu Tienda Online',
    whatsappNumber: '595981234567'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar productos y configuración en paralelo
      const [productsData, settingsData] = await Promise.all([
        productAPI.getAll(),
        settingsAPI.get()
      ]);

      setProducts(productsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const productsData = await productAPI.getAll();
      setProducts(productsData);
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const newProduct = await productAPI.create(productData);
      if (newProduct) {
        setProducts(prev => [newProduct, ...prev]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  };

  const updateProduct = async (id: number, productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const updatedProduct = await productAPI.update(id, productData);
      if (updatedProduct) {
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  };

  const deleteProduct = async (id: number): Promise<boolean> => {
    try {
      const success = await productAPI.delete(id);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };

  const updateSettings = async (newSettings: StoreSettings): Promise<boolean> => {
    try {
      const success = await settingsAPI.update(newSettings);
      if (success) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const value: ProductsContextType = {
    products,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    refreshProducts,
    isLoading
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};