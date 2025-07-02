// src/app/admin/images/page.tsx - Gestor completo de imágenes

'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Download, Eye, Copy, RefreshCw, Search, Filter, Grid, List, X } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  created: string;
  modified: string;
  url: string;
  error?: string;
}

interface UploadStats {
  message: string;
  uploadDir: string;
  maxFileSize: string;
  allowedTypes: string[];
  filesCount: number;
  recentFiles: UploadedFile[];
  timestamp: string;
  supportedSignatures: string[];
  systemInfo: {
    nodeVersion: string;
    platform: string;
    contentDir: string;
  };
}

export default function ImageManagerPage() {
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Cargar imágenes al montar
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/upload');
      
      if (response.ok) {
        const data: UploadStats = await response.json();
        setUploadStats(data);
        setImages(data.recentFiles.filter(file => !file.error));
      } else {
        showMessage('error', 'Error al cargar las imágenes');
      }
    } catch (error) {
      showMessage('error', 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleNewImagesUploaded = (urls: string[]) => {
    showMessage('success', `${urls.length} imagen(es) subida(s) correctamente`);
    loadImages(); // Recargar lista
  };

  const deleteImage = async (filename: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${filename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'Imagen eliminada correctamente');
        setImages(prev => prev.filter(img => img.name !== filename));
        setSelectedImages(prev => prev.filter(name => name !== filename));
      } else {
        showMessage('error', 'Error al eliminar la imagen');
      }
    } catch (error) {
      showMessage('error', 'Error al eliminar la imagen');
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showMessage('success', 'URL copiada al portapapeles');
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleImageSelection = (filename: string) => {
    setSelectedImages(prev => 
      prev.includes(filename)
        ? prev.filter(name => name !== filename)
        : [...prev, filename]
    );
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedImages.length} imagen(es)?`)) {
      return;
    }

    const deletePromises = selectedImages.map(filename => 
      fetch(`/api/upload?filename=${filename}`, { method: 'DELETE' })
    );

    try {
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.ok).length;
      
      showMessage('success', `${successful} imagen(es) eliminada(s) correctamente`);
      setSelectedImages([]);
      loadImages();
    } catch (error) {
      showMessage('error', 'Error al eliminar las imágenes seleccionadas');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar imágenes
  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || image.mimeType.includes(filterType);
    return matchesSearch && matchesType;
  });

  const uniqueMimeTypes = Array.from(new Set(images.map(img => img.mimeType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Imágenes</h1>
          <p className="text-gray-600">
            Administra todas las imágenes subidas al sistema
          </p>
        </div>
        <button
          onClick={loadImages}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Upload className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Subir Nuevas Imágenes</h2>
        </div>
        
        <ImageUpload
          onMultipleImagesUploaded={handleNewImagesUploaded}
          multiple={true}
          maxFiles={10}
          showDebug={true}
        />
      </div>

      {/* Stats Cards */}
      {uploadStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{uploadStats.filesCount}</div>
            <div className="text-sm text-gray-600">Total Imágenes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{uploadStats.maxFileSize}</div>
            <div className="text-sm text-gray-600">Tamaño Máximo</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{uploadStats.allowedTypes.length}</div>
            <div className="text-sm text-gray-600">Tipos Soportados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{selectedImages.length}</div>
            <div className="text-sm text-gray-600">Seleccionadas</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar imágenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                {uniqueMimeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode and Actions */}
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'} rounded-l-lg`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'} rounded-r-lg`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedImages.length > 0 && (
              <button
                onClick={deleteSelectedImages}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar ({selectedImages.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Images Grid/List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando imágenes...</p>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay imágenes</p>
            {searchTerm || filterType !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar filtros
              </button>
            ) : (
              <p className="text-gray-400 mt-2">Sube tu primera imagen usando el formulario superior</p>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6' 
              : 'divide-y divide-gray-200'
          }>
            {filteredImages.map((image) => (
              <div
                key={image.name}
                className={
                  viewMode === 'grid'
                    ? `relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImages.includes(image.name) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`
                    : 'flex items-center justify-between p-4 hover:bg-gray-50'
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div 
                      className="aspect-square bg-gray-100"
                      onClick={() => toggleImageSelection(image.name)}
                    >
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.name)}
                        onChange={() => toggleImageSelection(image.name)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyImageUrl(image.url);
                          }}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Copiar URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(image.name);
                          }}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                      <div className="text-xs truncate" title={image.name}>
                        {image.name}
                      </div>
                      <div className="text-xs opacity-75">
                        {formatFileSize(image.size)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.name)}
                        onChange={() => toggleImageSelection(image.name)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{image.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(image.size)} • {image.mimeType} • {formatDate(image.created)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedImage(image)}
                        className="p-2 text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyImageUrl(image.url)}
                        className="p-2 text-green-600 hover:text-green-800"
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadImage(image.url, image.name)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteImage(image.name)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Detalles de la Imagen</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                  <img 
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="w-full h-auto max-h-96 object-contain border rounded"
                  />
                </div>
                
                {/* Image Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <div className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {selectedImage.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL</label>
                    <div className="mt-1 flex">
                      <input
                        type="text"
                        value={selectedImage.url}
                        readOnly
                        className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded-l px-3 py-2 font-mono"
                      />
                      <button
                        onClick={() => copyImageUrl(selectedImage.url)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-r hover:bg-blue-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tamaño</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatFileSize(selectedImage.size)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo MIME</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedImage.mimeType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Creado</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedImage.created)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Modificado</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedImage.modified)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={() => downloadImage(selectedImage.url, selectedImage.name)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteImage(selectedImage.name);
                        setSelectedImage(null);
                      }}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      {uploadStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Directorio de uploads:</span>
              <div className="text-gray-600 font-mono text-xs mt-1">{uploadStats.uploadDir}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Node.js:</span>
              <div className="text-gray-600">{uploadStats.systemInfo.nodeVersion}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Plataforma:</span>
              <div className="text-gray-600">{uploadStats.systemInfo.platform}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipos soportados:</span>
              <div className="text-gray-600">{uploadStats.allowedTypes.join(', ')}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Firmas detectadas:</span>
              <div className="text-gray-600">{uploadStats.supportedSignatures.join(', ')}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última actualización:</span>
              <div className="text-gray-600">{formatDate(uploadStats.timestamp)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}