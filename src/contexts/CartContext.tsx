// src/contexts/CartContext.tsx

'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Product } from '@/lib/types';

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
