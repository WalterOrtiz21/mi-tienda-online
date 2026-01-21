// src/contexts/CartContext.tsx

'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Product } from '@/lib/types';

const CART_STORAGE_KEY = 'annyamodas_cart';

export interface CartItem {
    product: Product;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, size?: string, color?: string) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Cargar carrito desde localStorage al inicio
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
        }
        setIsInitialized(true);
    }, []);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error('Error saving cart to localStorage:', error);
            }
        }
    }, [items, isInitialized]);

    const addToCart = useCallback((product: Product, size?: string, color?: string) => {
        setItems(prev => {
            const existingItem = prev.find(
                item => item.product.id === product.id &&
                    item.selectedSize === size &&
                    item.selectedColor === color
            );

            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id &&
                        item.selectedSize === size &&
                        item.selectedColor === color
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
        });
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        setItems(prev => prev.filter(item => item.product.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const getTotal = useCallback(() => {
        return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    }, [items]);

    const getItemCount = useCallback(() => {
        return items.reduce((count, item) => count + item.quantity, 0);
    }, [items]);

    const value: CartContextType = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        isCartOpen,
        setIsCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
