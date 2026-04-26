import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage, formatGuarani } from './whatsappMessage';

describe('formatGuarani', () => {
  it('formatea con separador de miles', () => {
    expect(formatGuarani(7200)).toBe('Gs. 7.200');
    expect(formatGuarani(1000000)).toBe('Gs. 1.000.000');
  });
});

describe('formatWhatsAppMessage', () => {
  it('arma mensaje con un item', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Vestido Floral', price: 7200, quantity: 1, size: 'M', color: 'Azul' },
    ]);
    expect(msg).toContain('Hola');
    expect(msg).toContain('Vestido Floral (M, Azul) × 1');
    expect(msg).toContain('Gs. 7.200');
    expect(msg).toContain('Total: Gs. 7.200');
  });

  it('arma mensaje con múltiples items y suma total', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Vestido', price: 7200, quantity: 1 },
      { name: 'Botas', price: 18000, quantity: 2 },
    ]);
    expect(msg).toContain('Vestido × 1');
    expect(msg).toContain('Botas × 2');
    expect(msg).toContain('Total: Gs. 43.200');
  });

  it('omite size/color si no están', () => {
    const msg = formatWhatsAppMessage([
      { name: 'Producto', price: 1000, quantity: 1 },
    ]);
    expect(msg).toContain('Producto × 1');
    expect(msg).not.toContain('()');
  });
});
