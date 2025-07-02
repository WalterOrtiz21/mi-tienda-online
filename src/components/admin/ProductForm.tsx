// src/components/admin/ProductForm.tsx - Actualizado con sistema de imágenes mejorado

'use client';

import { useState } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
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
    images: product?.images || [], // Ya como array
    description: product?.description || '',
    category: product?.category || 'prendas',
    subcategory: product?.subcategory || '',
    gender: product?.gender || 'unisex',
    sizes: product?.sizes?.join(', ') || '', // Talles separados por comas
    colors: product?.colors?.join(', ') || '', // Colores separados por comas
    material: product?.material || '',
    brand: product?.brand || '',
    rating: product?.rating || 4.0,
    inStock: product?.inStock ?? true,
    features: product?.features?.join(', ') || '',
    tags: product?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      images: formData.images, // Ya es array
      sizes: formData.sizes 
        ? formData.sizes.split(',').map(s => s.trim()).filter(s => s)
        : [],
      colors: formData.colors 
        ? formData.colors.split(',').map(c => c.trim()).filter(c => c)
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

  const handleMainImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  };

  const handleAdditionalImagesUploaded = (urls: string[]) => {
    setFormData(prev => ({ ...prev, images: urls }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
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

            {/* Categoría y Subcategoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="prendas">👕 Prendas</option>
                <option value="calzados">👟 Calzados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoría *
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={formData.category === 'prendas' ? 'ej: remeras, jeans, vestidos' : 'ej: zapatillas, botas, sandalias'}
                required
              />
            </div>

            {/* Género y Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="unisex">👥 Unisex</option>
                <option value="mujer">👩 Para Mujer</option>
                <option value="hombre">👨 Para Hombre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: Nike, Zara, H&M"
              />
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (₲) *
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

          {/* Talles y Colores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talles Disponibles *
              </label>
              <input
                type="text"
                name="sizes"
                value={formData.sizes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={formData.category === 'prendas' ? 'ej: S, M, L, XL' : 'ej: 38, 39, 40, 41, 42'}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Separar con comas. Para {formData.category === 'prendas' ? 'prendas: XS, S, M, L, XL' : 'calzados: 35, 36, 37, 38, etc.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colores Disponibles
              </label>
              <input
                type="text"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: Negro, Blanco, Azul, Rojo"
              />
              <p className="text-xs text-gray-500 mt-1">Separar con comas</p>
            </div>
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
            </label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={formData.category === 'prendas' ? 'ej: 100% Algodón, Poliéster, Denim' : 'ej: Cuero genuino, Sintético, Lona'}
            />
          </div>

          {/* SECCIÓN DE IMÁGENES MEJORADA */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Gestión de Imágenes
            </h3>

            {/* Imagen Principal */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Imagen Principal * 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Esta será la imagen que se muestre en el catálogo)
                </span>
              </h4>
              <ImageUpload
                onImageUploaded={handleMainImageUploaded}
                currentImage={formData.image}
                multiple={false}
                showDebug={true}
              />
              
              {!formData.image && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Se requiere una imagen principal para el producto
                  </p>
                </div>
              )}
            </div>

            {/* Imágenes Adicionales */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Galería de Imágenes
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Imágenes adicionales para el carrusel del producto)
                </span>
              </h4>
              <ImageUpload
                onMultipleImagesUploaded={handleAdditionalImagesUploaded}
                currentImages={formData.images}
                multiple={true}
                maxFiles={8}
                showDebug={true}
              />
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Sube múltiples ángulos del producto para que los clientes puedan verlo mejor.
                  Se recomienda incluir: vista frontal, posterior, detalles, y el producto en uso.
                </p>
              </div>
            </div>

            {/* Resumen de imágenes */}
            {(formData.image || formData.images.length > 0) && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Resumen de imágenes:</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📸 Imagen principal: {formData.image ? '✅ Configurada' : '❌ Faltante'}</div>
                  <div>🖼️ Imágenes adicionales: {formData.images.length} imagen(es)</div>
                  <div>📊 Total: {(formData.image ? 1 : 0) + formData.images.length} imagen(es)</div>
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe el producto, sus características principales y beneficios..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Una buena descripción ayuda a los clientes a entender mejor el producto
            </p>
          </div>

          {/* Rating y Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Producto en Stock</span>
              </label>
            </div>
          </div>

          {/* Características y Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="ej: Cómodo, Resistente, Lavable"
              />
              <p className="text-xs text-gray-500 mt-1">
                Características destacadas que aparecerán como etiquetas
              </p>
            </div>

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
                placeholder="ej: casual, elegante, deportivo"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tags para mejorar la búsqueda y categorización
              </p>
            </div>
          </div>

          {/* Validation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Validación del formulario:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className={formData.name ? 'text-green-600' : 'text-red-600'}>
                {formData.name ? '✅' : '❌'} Nombre del producto
              </div>
              <div className={formData.description ? 'text-green-600' : 'text-red-600'}>
                {formData.description ? '✅' : '❌'} Descripción
              </div>
              <div className={formData.price > 0 ? 'text-green-600' : 'text-red-600'}>
                {formData.price > 0 ? '✅' : '❌'} Precio válido
              </div>
              <div className={formData.image ? 'text-green-600' : 'text-red-600'}>
                {formData.image ? '✅' : '❌'} Imagen principal
              </div>
              <div className={formData.sizes ? 'text-green-600' : 'text-red-600'}>
                {formData.sizes ? '✅' : '❌'} Talles disponibles
              </div>
              <div className={formData.subcategory ? 'text-green-600' : 'text-red-600'}>
                {formData.subcategory ? '✅' : '❌'} Subcategoría
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.description || !formData.image || formData.price <= 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
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