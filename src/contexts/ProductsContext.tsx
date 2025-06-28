// src/contexts/ProductsContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';

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
      const [productsResponse, settingsResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings')
      ]);

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const newProduct = await response.json();
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
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
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
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
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
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
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