// src/components/admin/ProductForm.tsx

'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Product } from '@/lib/types';
import ImageUpload from './ImageUpload';

interface ProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({ product, onSave, onCancel, isLoading = false }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    image: product?.image || '',
    images: product?.images?.join('\n') || '', // Separar por líneas
    description: product?.description || '',
    category: product?.category || 'perfumes',
    subcategory: product?.subcategory || '',
    gender: product?.gender || 'unisex', // Nuevo campo
    rating: product?.rating || 4.0,
    inStock: product?.inStock ?? true,
    features: product?.features?.join(', ') || '',
    tags: product?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      images: formData.images 
        ? formData.images.split('\n').map(url => url.trim()).filter(url => url)
        : [],
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    onSave(productData as Omit<Product, 'id'>);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  };

  const handleMultipleImagesUploaded = (urls: string[]) => {
    const currentImages = formData.images 
      ? formData.images.split('\n').filter(img => img.trim())
      : [];
    const newImages = [...currentImages, ...urls];
    setFormData(prev => ({ ...prev, images: newImages.join('\n') }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (₲)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Original (₲) - Opcional
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Imagen Principal con Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen Principal
            </label>
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              currentImage={formData.image}
            />
            
            {/* Campo manual como backup */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                O pegar URL manualmente:
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          {/* Imágenes Adicionales con Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes Adicionales (Carrusel)
            </label>
            <ImageUpload
              onMultipleImagesUploaded={handleMultipleImagesUploaded}
              multiple={true}
            />
            
            {/* Campo manual para URLs adicionales */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                URLs adicionales (una por línea):
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com/imagen2.jpg&#10;https://ejemplo.com/imagen3.jpg"
              />
            </div>

            {/* Preview de imágenes adicionales */}
            {formData.images && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Preview del carrusel:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.split('\n').filter(url => url.trim()).map((url, index) => (
                    <img 
                      key={index}
                      src={url.trim()} 
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Categoría, Subcategoría y Género */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="perfumes">Perfumes</option>
                <option value="ropa">Ropa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoría
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: cítrico, oriental, vintage, etc."
                required
              />
            </div>
            {formData.category === 'perfumes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="unisex">Unisex</option>
                  <option value="mujer">Para Mujer</option>
                  <option value="hombre">Para Hombre</option>
                </select>
              </div>
            )}
          </div>

          {/* Rating y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="1"
                max="5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">En Stock</span>
              </label>
            </div>
          </div>

          {/* Características */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Características (separadas por comas)
            </label>
            <input
              type="text"
              name="features"
              value={formData.features}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100ml, Larga duración, Original"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (separados por comas)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="floral, clásico, elegante"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{product ? 'Actualizar' : 'Crear'} Producto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}