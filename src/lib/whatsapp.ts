// src/lib/whatsapp.ts

import { Product } from './types';
import { formatPrice, calculateDiscount } from './products';

const whatsappNumber = "595981234567"; // Reemplaza con tu número

export const sendWhatsAppMessage = (product: Product): void => {
  const category = product.category === 'perfumes' ? 'perfume' : 'prenda';
  
  const message = `Hola! Me interesa este ${category}:

*${product.name}*
Precio: ${formatPrice(product.price)}
${product.originalPrice && product.originalPrice > product.price 
  ? `Precio original: ${formatPrice(product.originalPrice)} (${calculateDiscount(product.price, product.originalPrice)}% OFF)` 
  : ''}

¿Está disponible? ¿Podrías darme más información sobre tallas/entrega?`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

export const updateWhatsappNumber = (newNumber: string): void => {
  // Esta función será útil para el admin
  console.log('Updating WhatsApp number to:', newNumber);
  // En el futuro aquí actualizaremos la configuración
};