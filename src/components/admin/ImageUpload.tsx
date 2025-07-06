// src/components/admin/ImageUpload.tsx - Versión optimizada sin bucles

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, X, Eye, Trash2, ZoomIn } from 'lucide-react';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

interface ImageInfo {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isValid: boolean;
  error?: string;
  id: string; // 🎯 ID único para evitar re-renders
}

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  onMultipleImagesUploaded?: (urls: string[]) => void;
  multiple?: boolean;
  currentImage?: string;
  currentImages?: string[];
  className?: string;
  showDebug?: boolean;
  maxFiles?: number;
}

export default function ImageUpload({
  onImageUploaded,
  onMultipleImagesUploaded,
  multiple = false,
  currentImage,
  currentImages = [],
  className = '',
  showDebug = false,
  maxFiles = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<ImageInfo[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedUrlsRef = useRef<Set<string>>(new Set()); // 🎯 Evitar reprocesar URLs

  // 🎯 FUNCIÓN ESTABLE PARA GENERAR ID ÚNICO
  const generateImageId = useCallback((url: string): string => {
    return `img_${url.split('/').pop()?.split('.')[0] || Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 🎯 FUNCIÓN ESTABLE PARA CREAR ImageInfo
  const createImageInfo = useCallback((url: string): ImageInfo => {
    return {
      id: generateImageId(url),
      url,
      name: url.split('/').pop() || 'imagen',
      size: 0,
      mimeType: 'image/jpeg',
      isValid: true,
      error: undefined
    };
  }, [generateImageId]);

  // 🎯 CARGAR IMÁGENES INICIALES SIN BUCLES
  useEffect(() => {
    const loadCurrentImages = () => {
      const imagesToLoad: string[] = [];
      
      if (currentImage && !multiple) {
        imagesToLoad.push(currentImage);
      }
      
      if (multiple && currentImages.length > 0) {
        imagesToLoad.push(...currentImages);
      }

      // 🎯 SOLO PROCESAR URLs NUEVAS
      const newUrls = imagesToLoad.filter(url => !processedUrlsRef.current.has(url));
      
      if (newUrls.length > 0) {
        const imageInfos = newUrls.map(createImageInfo);
        
        setPreviewImages(prev => {
          // 🎯 EVITAR DUPLICADOS
          const existingIds = new Set(prev.map(img => img.id));
          const filteredNew = imageInfos.filter(img => !existingIds.has(img.id));
          
          if (multiple) {
            return [...prev, ...filteredNew];
          } else {
            return filteredNew.length > 0 ? [filteredNew[0]] : prev;
          }
        });

        // 🎯 MARCAR URLs COMO PROCESADAS
        newUrls.forEach(url => processedUrlsRef.current.add(url));
      }
    };

    loadCurrentImages();
  }, [currentImage, currentImages, multiple, createImageInfo]);

  // 🎯 FUNCIÓN OPTIMIZADA DE UPLOAD
  const uploadImageOptimized = async (file: File): Promise<UploadResult> => {
    try {
      console.log('📤 Subiendo:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Error al subir' };
      }

      console.log('✅ Upload exitoso:', result.fileName);

      return {
        success: true,
        url: result.url,
        fileName: result.fileName,
        fileSize: file.size,
        mimeType: result.mimeType
      };

    } catch (error) {
      console.error('❌ Error upload:', error);
      return { success: false, error: 'Error inesperado' };
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress([]);
    
    const fileArray = Array.from(files);
    const filesToProcess = fileArray.slice(0, maxFiles);

    try {
      setUploadProgress([`📤 Subiendo ${filesToProcess.length} archivo(s)...`]);

      const uploadResults = await Promise.all(
        filesToProcess.map(file => uploadImageOptimized(file))
      );

      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);

      // 🎯 ACTUALIZAR PREVIEW SIN DUPLICADOS
      if (successfulUploads.length > 0) {
        const newImageInfos = successfulUploads.map(result => ({
          id: generateImageId(result.url!),
          url: result.url!,
          name: result.fileName!,
          size: result.fileSize || 0,
          mimeType: result.mimeType || 'image/jpeg',
          isValid: true
        }));

        setPreviewImages(prev => {
          if (multiple) {
            const existingIds = new Set(prev.map(img => img.id));
            const filteredNew = newImageInfos.filter(img => !existingIds.has(img.id));
            return [...prev, ...filteredNew];
          } else {
            return newImageInfos.slice(0, 1);
          }
        });

        // 🎯 NOTIFICAR AL PADRE
        const urls = successfulUploads.map(result => result.url!);
        
        if (multiple && onMultipleImagesUploaded) {
          onMultipleImagesUploaded(urls);
        } else if (!multiple && onImageUploaded && urls[0]) {
          onImageUploaded(urls[0]);
        }

        // 🎯 MARCAR URLs COMO PROCESADAS
        urls.forEach(url => processedUrlsRef.current.add(url));
      }

      // Reportar resultados
      successfulUploads.forEach(result => {
        setUploadProgress(prev => [...prev, `✅ ${result.fileName} subido`]);
      });

      failedUploads.forEach(result => {
        setUploadProgress(prev => [...prev, `❌ Error: ${result.error}`]);
      });

    } catch (error) {
      setUploadProgress(['❌ Error inesperado durante el upload']);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 5000);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = previewImages[index];
    
    setPreviewImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      
      // 🎯 NOTIFICAR CAMBIO AL PADRE
      if (multiple && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(newImages.map(img => img.url));
      } else if (!multiple && onImageUploaded) {
        onImageUploaded(newImages[0]?.url || '');
      }
      
      return newImages;
    });

    // 🎯 REMOVER DE URLs PROCESADAS
    if (imageToRemove) {
      processedUrlsRef.current.delete(imageToRemove.url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Subiendo imagen(s)...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {multiple ? 'Arrastra imágenes aquí o haz click' : 'Arrastra imagen aquí o haz click'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP, GIF hasta 5MB {multiple ? `(máximo ${maxFiles})` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewImages.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="relative overflow-hidden rounded-lg border-2 border-green-200">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="w-full h-24 object-cover"
                  loading="lazy" // 🎯 LAZY LOADING
                />
                
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Ver completa"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
              </div>
              
              {/* Image info */}
              <div className="mt-2 text-xs text-gray-600">
                <div className="font-medium truncate" title={image.name}>
                  {image.name}
                </div>
                <div className="text-gray-500">{formatFileSize(image.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {uploadProgress.map((progress, index) => (
            <div 
              key={index}
              className={`text-xs p-2 rounded ${
                progress.includes('✅') 
                  ? 'bg-green-100 text-green-700'
                  : progress.includes('❌')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {progress}
            </div>
          ))}
        </div>
      )}

      {/* Modal para vista completa */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img 
              src={previewImages[selectedImageIndex].url}
              alt={previewImages[selectedImageIndex].name}
              className="max-w-full max-h-full object-contain rounded-lg"
              loading="lazy"
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded">
              <div className="text-sm font-medium">{previewImages[selectedImageIndex].name}</div>
              <div className="text-xs opacity-75">
                {formatFileSize(previewImages[selectedImageIndex].size)} • {previewImages[selectedImageIndex].mimeType}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info Simplificado */}
      {showDebug && previewImages.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            🔧 Debug Info
          </h4>
          
          <div className="space-y-2 text-xs">
            <div><strong>Total imágenes:</strong> {previewImages.length}</div>
            <div><strong>URLs procesadas:</strong> {processedUrlsRef.current.size}</div>
            <div><strong>Modo:</strong> {multiple ? 'Múltiple' : 'Individual'}</div>
            <div><strong>Max archivos:</strong> {maxFiles}</div>
            
            {previewImages.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-700">Ver URLs</summary>
                <div className="mt-1 ml-4 space-y-1">
                  {previewImages.map((img, index) => (
                    <div key={img.id} className="text-xs break-all">
                      <strong>{index + 1}:</strong> {img.url}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Sistema optimizado:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>✅ Sin bucles infinitos de requests</li>
          <li>🔧 Cache inteligente y balanceado</li>
          <li>🎯 IDs únicos para evitar re-renders</li>
          <li>⚡ Carga lazy y optimizada</li>
          <li>🛡️ Prevención de duplicados automática</li>
        </ul>
      </div>
    </div>
  );
}