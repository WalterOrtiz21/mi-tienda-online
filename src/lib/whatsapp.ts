// src/lib/whatsapp.ts

import { Product } from './types';
import { formatPrice, calculateDiscount } from './products';

// ✅ FUNCIÓN PRINCIPAL CON NÚMERO DINÁMICO
export const sendWhatsAppMessage = (
  product: Product, 
  selectedOptions?: { size?: string; color?: string },
  whatsappNumber?: string // ✅ Parámetro opcional para el número
): void => {
  // ✅ Usar el número pasado como parámetro o fallback
  const phoneNumber = whatsappNumber || '595982887455';
  
  const categoryName = product.category === 'prendas' ? 'prenda' : 'calzado';
  
  // Construir mensaje personalizado para prendas/calzados
  let message = `¡Hola! Me interesa este ${categoryName}:

*${product.name}*
`;

  // Agregar información de marca si existe
  if (product.brand) {
    message += `Marca: ${product.brand}\n`;
  }

  // Precio y descuento
  message += `Precio: ${formatPrice(product.price)}`;
  
  if (product.originalPrice && product.originalPrice > product.price) {
    const discount = calculateDiscount(product.price, product.originalPrice);
    message += `\nPrecio original: ${formatPrice(product.originalPrice)} (${discount}% OFF)`;
  }

  // Información seleccionada por el usuario
  if (selectedOptions?.size) {
    message += `\nTalle deseado: ${selectedOptions.size}`;
  }
  
  if (selectedOptions?.color) {
    message += `\nColor deseado: ${selectedOptions.color}`;
  }

  // Información adicional del producto
  if (product.material) {
    message += `\nMaterial: ${product.material}`;
  }

  // Agregar preguntas específicas según la categoría
  if (product.category === 'prendas') {
    message += `\n\n¿Está disponible en el talle y color que necesito? ¿Podrías darme más información sobre:
- Talles disponibles
- Guía de talles
- Tiempo de entrega
- Forma de pago`;
  } else if (product.category === 'calzados') {
    message += `\n\n¿Está disponible en mi talle? ¿Podrías darme más información sobre:
- Talles disponibles
- Guía de talles
- Tiempo de entrega
- Forma de pago`;
  }

  message += `\n\n¡Gracias!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

// ✅ Función para consultar disponibilidad general CON NÚMERO DINÁMICO
export const sendAvailabilityQuery = (
  storeName: string = "Annya Modas",
  whatsappNumber?: string
): void => {
  const phoneNumber = whatsappNumber || '595981234567';
  
  const message = `¡Hola ${storeName}! 

Me gustaría conocer más sobre sus productos:
- ¿Qué nuevas prendas y calzados tienen disponibles?
- ¿Hacen envíos? ¿Cuál es el costo?
- ¿Cuáles son las formas de pago?
- ¿Tienen catálogo completo?

¡Gracias!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

// ✅ Función para consultar por múltiples productos CON NÚMERO DINÁMICO
export const sendMultipleProductsQuery = (
  products: Product[],
  whatsappNumber?: string
): void => {
  const phoneNumber = whatsappNumber || '595981234567';
  
  let message = `¡Hola! Me interesan varios productos:

`;

  products.forEach((product, index) => {
    message += `${index + 1}. *${product.name}* - ${formatPrice(product.price)}`;
    if (product.originalPrice && product.originalPrice > product.price) {
      message += ` (${calculateDiscount(product.price, product.originalPrice)}% OFF)`;
    }
    message += `\n`;
  });

  message += `\n¿Podrían darme información sobre disponibilidad y descuentos por compra múltiple?

¡Gracias!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

// ✅ Función para consultar por categoria específica CON NÚMERO DINÁMICO
export const sendCategoryQuery = (
  category: 'prendas' | 'calzados', 
  gender?: string,
  whatsappNumber?: string
): void => {
  const phoneNumber = whatsappNumber || '595981234567';
  const categoryName = category === 'prendas' ? 'prendas' : 'calzados';
  const genderText = gender && gender !== 'all' 
    ? ` para ${gender === 'mujer' ? 'mujer' : gender === 'hombre' ? 'hombre' : 'unisex'}`
    : '';

  const message = `¡Hola! Estoy buscando ${categoryName}${genderText}.

¿Podrían enviarme información sobre:
- Productos disponibles
- Talles y colores
- Precios y ofertas
- Tiempo de entrega

¡Gracias!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

// ✅ FUNCIONES LEGACY (mantener compatibilidad)
let storedWhatsappNumber = '595981234567';

export const updateWhatsappNumber = (newNumber: string): void => {
  storedWhatsappNumber = newNumber;
};

export const getWhatsappNumber = (): string => {
  return storedWhatsappNumber;
};