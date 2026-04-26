import type { Product } from './types';
import { formatGuarani } from './whatsappMessage';

export function shareProductMessage(product: Product, storeName?: string): string {
  const lines: (string | null)[] = [
    `*${product.name}*`,
    formatGuarani(product.price),
    product.originalPrice && product.originalPrice > product.price
      ? `Antes: ${formatGuarani(product.originalPrice)}`
      : null,
    product.description ? `\n${product.description}` : null,
    product.image ? `\n${product.image}` : null,
    storeName ? `\n— ${storeName}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export function shareProductWhatsAppUrl(
  product: Product,
  storeName?: string
): string {
  const msg = shareProductMessage(product, storeName);
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
