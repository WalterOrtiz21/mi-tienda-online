// src/contexts/ProductsContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { getStoredProducts, saveProducts, StoreSettings, getStoreSettings, saveStoreSettings } from '@/lib/storage';

interface ProductsContextType {
  products: Product[];
  settings: StoreSettings;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: number) => void;
  updateSettings: (settings: StoreSettings) => void;
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

  // Cargar datos al inicializar
  useEffect(() => {
    const loadData = () => {
      try {
        const storedProducts = getStoredProducts();
        const storedSettings = getStoreSettings();
        
        setProducts(storedProducts);
        setSettings(storedSettings);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Guardar productos cuando cambien
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      saveProducts(products);
    }
  }, [products, isLoading]);

  // Guardar configuración cuando cambie
  useEffect(() => {
    if (!isLoading) {
      saveStoreSettings(settings);
    }
  }, [settings, isLoading]);

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { ...productData, id: newId };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: number, productData: Omit<Product, 'id'>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...productData, id } : p
    ));
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const value: ProductsContextType = {
    products,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    isLoading
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};