export type CartLine = {
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export const formatGuarani = (n: number): string =>
  `Gs. ${Math.round(n).toLocaleString('es-PY').replace(/,/g, '.')}`;

export function formatWhatsAppMessage(items: CartLine[]): string {
  const lines = items.map((it) => {
    const variants = [it.size, it.color].filter(Boolean).join(', ');
    const label = variants ? `${it.name} (${variants})` : it.name;
    return `• ${label} × ${it.quantity} — ${formatGuarani(it.price * it.quantity)}`;
  });

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return `Hola! Quiero pedir:\n\n${lines.join('\n')}\n\nTotal: ${formatGuarani(total)}`;
}

export function whatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
