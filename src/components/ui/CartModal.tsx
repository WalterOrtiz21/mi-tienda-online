// src/components/ui/CartModal.tsx

'use client';

import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/contexts/ProductsContext';
import { formatPrice } from '@/lib/products';

export default function CartModal() {
    const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
    const { settings } = useProducts();

    if (!isCartOpen) return null;

    const generateWhatsAppMessage = () => {
        if (items.length === 0) return '';

        let message = `🛒 *Nuevo Pedido - ${settings.storeName}*\n\n`;
        message += `📦 *Productos:*\n`;

        items.forEach((item, index) => {
            message += `\n${index + 1}. *${item.product.name}*\n`;
            message += `   💰 Precio: ${formatPrice(item.product.price)}\n`;
            message += `   📊 Cantidad: ${item.quantity}\n`;
            if (item.selectedSize) message += `   📏 Talle: ${item.selectedSize}\n`;
            if (item.selectedColor) message += `   🎨 Color: ${item.selectedColor}\n`;
            message += `   💵 Subtotal: ${formatPrice(item.product.price * item.quantity)}\n`;
        });

        message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *TOTAL: ${formatPrice(getTotal())}*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📝 Por favor, confirmen disponibilidad y forma de pago. ¡Gracias!`;

        return encodeURIComponent(message);
    };

    const handleSendToWhatsApp = () => {
        const message = generateWhatsAppMessage();
        const whatsappNumber = settings.whatsappNumber.replace(/\D/g, '');
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Panel lateral */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold">Mi Carrito</h2>
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {items.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">Tu carrito está vacío</p>
                            <p className="text-sm mt-2">¡Agrega productos para comenzar!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <img
                                        src={item.product.image}
                                        alt={item.product.name}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                                        <p className="text-blue-600 font-semibold text-sm">
                                            {formatPrice(item.product.price)}
                                        </p>
                                        {item.selectedSize && (
                                            <p className="text-xs text-gray-500">Talle: {item.selectedSize}</p>
                                        )}
                                        {item.selectedColor && (
                                            <p className="text-xs text-gray-500">Color: {item.selectedColor}</p>
                                        )}

                                        {/* Controles de cantidad */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con total y botón */}
                {items.length > 0 && (
                    <div className="border-t p-4 space-y-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatPrice(getTotal())}</span>
                        </div>

                        <button
                            onClick={handleSendToWhatsApp}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>Enviar Pedido por WhatsApp</span>
                        </button>

                        <button
                            onClick={clearCart}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                        >
                            Vaciar Carrito
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
