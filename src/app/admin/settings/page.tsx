'use client';

import { useState } from 'react';
import { Save, Store, Phone, Lock } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import { useToast } from '@/contexts/ToastContext';
import StoreIconUpload from '@/components/admin/StoreIconUpload';

export default function AdminSettings() {
  const { settings, updateSettings } = useProducts();
  const { show } = useToast();
  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    storeIcon: settings.storeIcon || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleIconUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, storeIcon: url }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await updateSettings({
        ...settings,
        storeName: formData.storeName,
        whatsappNumber: formData.whatsappNumber,
        storeIcon: formData.storeIcon,
      });
      show({ message: ok ? 'Configuración guardada' : 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-[color:var(--color-cocoa)]">
          Configuración
        </h1>
        <p className="text-sm text-[color:var(--color-taupe)]">
          Datos públicos de la tienda y acceso al panel
        </p>
      </div>

      {/* Tienda */}
      <section className="bg-[color:var(--color-shell)] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[color:var(--color-taupe)]" />
          <h2 className="font-display text-lg text-[color:var(--color-cocoa)]">
            Tienda
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre de la tienda
            </label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-md text-sm outline-none focus:border-[color:var(--color-cocoa)]"
              placeholder="Annya Modas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              WhatsApp (con código de país, sin +)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2.5 bg-[color:var(--color-cream)] text-[color:var(--color-taupe)] text-sm rounded-l-md border border-r-0 border-[color:var(--color-cream)]">
                <Phone className="w-4 h-4 mr-1" />+
              </span>
              <input
                type="tel"
                inputMode="numeric"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                className="flex-1 px-3 py-2.5 bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] rounded-r-md text-sm outline-none focus:border-[color:var(--color-cocoa)]"
                placeholder="595981234567"
              />
            </div>
          </div>
        </div>

        <StoreIconUpload
          onIconUploaded={handleIconUploaded}
          currentIcon={formData.storeIcon}
        />

        <div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] px-4 py-2.5 rounded-md text-sm uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </section>

      {/* Acceso */}
      <section className="bg-[color:var(--color-cream)] border border-[color:var(--color-tan)]/40 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-[color:var(--color-taupe)]" />
          <h2 className="font-display text-lg text-[color:var(--color-cocoa)]">
            Acceso al panel
          </h2>
        </div>
        <p className="text-sm text-[color:var(--color-taupe)]">
          La contraseña del admin se configura como variable de entorno{' '}
          <code className="px-1 py-0.5 bg-[color:var(--color-shell)] rounded text-xs">
            ADMIN_PASSWORD
          </code>{' '}
          en Vercel. Para cambiarla: ir a tu proyecto en Vercel → Settings → Environment
          Variables → editar <code>ADMIN_PASSWORD</code> → redeploy.
        </p>
      </section>
    </div>
  );
}
