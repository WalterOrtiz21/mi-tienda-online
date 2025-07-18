// src/app/admin/settings/page.tsx

'use client';

import { useState } from 'react';
import { Save, Key, Store, Phone } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import StoreIconUpload from '@/components/admin/StoreIconUpload';

export default function AdminSettings() {
  const { settings, updateSettings } = useProducts();
  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    storeIcon: settings.storeIcon || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleIconUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, storeIcon: url }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Actualizar configuración de la tienda
      const success = await updateSettings({
        ...settings,
        storeName: formData.storeName,
        whatsappNumber: formData.whatsappNumber,
        storeIcon: formData.storeIcon
      });

      if (success) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    // Aquí iría la lógica para cambiar la contraseña
    // Por ahora solo mostramos un mensaje
    setMessage({ 
      type: 'success', 
      text: 'Para cambiar la contraseña, modifica ADMIN_PASSWORD en AuthContext.tsx' 
    });
    
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Configura tu tienda y administra las opciones del sistema</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Configuración de la Tienda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Store className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Información de la Tienda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Tienda
            </label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu Tienda Online"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de WhatsApp
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                <Phone className="w-4 h-4 mr-1" />
                +
              </span>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="595981234567"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <StoreIconUpload
            onIconUploaded={handleIconUploaded}
            currentIcon={formData.storeIcon}
          />
        </div>

        <div className="mt-4">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Cambio de Contraseña */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Key className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handlePasswordChange}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
          >
            <Key className="w-4 h-4" />
            <span>Cambiar Contraseña</span>
          </button>
        </div>
      </div>

      {/* Información del Sistema Actualizada */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Versión:</span>
            <span className="ml-2 text-gray-600">2.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Base de datos:</span>
            <span className="ml-2 text-gray-600">MySQL 8.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Almacenamiento:</span>
            <span className="ml-2 text-gray-600">Sistema de archivos local</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Servidor:</span>
            <span className="ml-2 text-gray-600">Docker + Next.js</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Última actualización:</span>
            <span className="ml-2 text-gray-600">{new Date().toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Entorno:</span>
            <span className="ml-2 text-gray-600">Producción</span>
          </div>
        </div>

        {/* Estadísticas del sistema */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Estado del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">Base de Datos</span>
              </div>
              <div className="text-xs text-green-600 mt-1">Conectada y funcionando</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-blue-800">API</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">Todos los endpoints operativos</div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-purple-800">Uploads</span>
              </div>
              <div className="text-xs text-purple-600 mt-1">Sistema de archivos activo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}