// src/components/admin/ImageUpload.tsx - Versión mejorada con previsualización completa

'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, ExternalLink, AlertTriangle, X, Eye, Trash2, ZoomIn } from 'lucide-react';
import mime from 'mime-types';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  cacheBuster?: number;
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
}

// Función para detectar tipo MIME real del archivo
const detectMimeType = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // Primero intentar con la extensión
    const extensionMime = mime.lookup(file.name);
    
    // Luego verificar con FileReader para confirmar
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Detectar por firma de archivo (magic numbers)
      let detectedType = '';
      
      if (arr.length >= 4) {
        // JPEG
        if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
          detectedType = 'image/jpeg';
        }
        // PNG
        else if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          detectedType = 'image/png';
        }
        // GIF
        else if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46) {
          detectedType = 'image/gif';
        }
        // WebP
        else if (arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
          detectedType = 'image/webp';
        }
      }
      
      // Usar tipo detectado o fallback a extensión
      resolve(detectedType || extensionMime || file.type || 'application/octet-stream');
    };
    
    reader.readAsArrayBuffer(file.slice(0, 16)); // Solo leer primeros 16 bytes
  });
};

// Función para obtener dimensiones de imagen
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
};

// Función para validar imagen
const validateImage = async (file: File): Promise<ImageInfo> => {
  const result: ImageInfo = {
    url: '',
    name: file.name,
    size: file.size,
    mimeType: '',
    isValid: false
  };

  try {
    // Detectar tipo MIME real
    result.mimeType = await detectMimeType(file);
    
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(result.mimeType)) {
      result.error = `Tipo de archivo no soportado: ${result.mimeType}`;
      return result;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      result.error = `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)`;
      return result;
    }

    // Obtener dimensiones
    try {
      const dimensions = await getImageDimensions(file);
      result.width = dimensions.width;
      result.height = dimensions.height;
      
      // Validar dimensiones mínimas
      if (dimensions.width < 100 || dimensions.height < 100) {
        result.error = `Imagen muy pequeña: ${dimensions.width}x${dimensions.height}px (mínimo 100x100px)`;
        return result;
      }
    } catch (error) {
      result.error = 'No se pudo procesar la imagen';
      return result;
    }

    result.url = URL.createObjectURL(file);
    result.isValid = true;
    return result;

  } catch (error) {
    result.error = 'Error al validar el archivo';
    return result;
  }
};

// Función mejorada de upload con información detallada
const uploadImageWithDetails = async (file: File): Promise<UploadResult> => {
  try {
    console.log('📤 Iniciando upload:', file.name);
    
    // Validar antes de subir
    const validation = await validateImage(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const result = await response.json();
    
    console.log('📊 Upload result:', result);

    if (!response.ok) {
      return { success: false, error: result.error || 'Error al subir la imagen' };
    }

    return {
      success: true,
      url: result.url,
      fileName: result.fileName,
      fileSize: file.size,
      mimeType: validation.mimeType,
      cacheBuster: result.cacheBuster
    };

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
};

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

  // Cargar imágenes actuales al montar
  useEffect(() => {
    const loadCurrentImages = async () => {
      const imagesToLoad = [];
      
      if (currentImage && !multiple) {
        imagesToLoad.push(currentImage);
      }
      
      if (multiple && currentImages.length > 0) {
        imagesToLoad.push(...currentImages);
      }

      if (imagesToLoad.length > 0) {
        const imageInfos = await Promise.all(
          imagesToLoad.map(async (url) => {
            try {
              const response = await fetch(url, { method: 'HEAD' });
              const contentType = response.headers.get('content-type') || 'image/jpeg';
              const contentLength = response.headers.get('content-length');
              
              return {
                url,
                name: url.split('/').pop() || 'imagen',
                size: contentLength ? parseInt(contentLength) : 0,
                mimeType: contentType,
                isValid: response.ok,
                error: response.ok ? undefined : 'No se pudo cargar la imagen'
              };
            } catch (error) {
              return {
                url,
                name: url.split('/').pop() || 'imagen',
                size: 0,
                mimeType: 'image/jpeg',
                isValid: false,
                error: 'Error al verificar la imagen'
              };
            }
          })
        );
        
        setPreviewImages(imageInfos);
      }
    };

    loadCurrentImages();
  }, [currentImage, currentImages, multiple]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress([]);
    
    const fileArray = Array.from(files);
    
    // Limitar número de archivos
    const filesToProcess = fileArray.slice(0, maxFiles);
    if (fileArray.length > maxFiles) {
      setUploadProgress([`⚠️ Solo se procesarán ${maxFiles} archivos de ${fileArray.length} seleccionados`]);
    }

    try {
      // Validar archivos primero
      const validations = await Promise.all(
        filesToProcess.map(file => validateImage(file))
      );

      const validFiles = filesToProcess.filter((file, index) => validations[index].isValid);
      const invalidFiles = filesToProcess.filter((file, index) => !validations[index].isValid);

      // Mostrar errores de archivos inválidos
      invalidFiles.forEach((file, index) => {
        const validation = validations[filesToProcess.indexOf(file)];
        setUploadProgress(prev => [...prev, `❌ ${file.name}: ${validation.error}`]);
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Actualizar preview con archivos válidos
      const validPreviews = validations.filter(v => v.isValid);
      setPreviewImages(prev => multiple ? [...prev, ...validPreviews] : validPreviews);

      // Subir archivos válidos
      setUploadProgress(prev => [...prev, `📤 Subiendo ${validFiles.length} archivo(s)...`]);

      const uploadResults = await Promise.all(
        validFiles.map(file => uploadImageWithDetails(file))
      );

      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);

      // Reportar resultados
      successfulUploads.forEach(result => {
        setUploadProgress(prev => [...prev, `✅ ${result.fileName} subido correctamente`]);
      });

      failedUploads.forEach(result => {
        setUploadProgress(prev => [...prev, `❌ Error: ${result.error}`]);
      });

      // Notificar al componente padre
      if (successfulUploads.length > 0) {
        const urls = successfulUploads.map(result => result.url!);
        
        if (multiple && onMultipleImagesUploaded) {
          onMultipleImagesUploaded(urls);
        } else if (!multiple && onImageUploaded && urls[0]) {
          onImageUploaded(urls[0]);
        }
      }

    } catch (error) {
      setUploadProgress(['❌ Error inesperado durante el upload']);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 8000);
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      
      if (multiple && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(newImages.map(img => img.url));
      } else if (!multiple && onImageUploaded) {
        onImageUploaded(newImages[0]?.url || '');
      }
      
      return newImages;
    });
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

  const handleClick = () => {
    fileInputRef.current?.click();
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
        onClick={handleClick}
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
            <p className="text-sm text-gray-600">Procesando y subiendo imagen(s)...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {multiple ? 'Arrastra imágenes aquí o haz click' : 'Arrastra imagen aquí o haz click'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP, GIF hasta 5MB {multiple ? `(máximo ${maxFiles} archivos)` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className={`relative overflow-hidden rounded-lg border-2 ${
                image.isValid ? 'border-green-200' : 'border-red-200'
              }`}>
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="w-full h-24 object-cover"
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
                      title="Ver imagen completa"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status indicator */}
                <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
                  image.isValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              
              {/* Image info */}
              <div className="mt-2 text-xs text-gray-600">
                <div className="font-medium truncate" title={image.name}>
                  {image.name}
                </div>
                <div className="flex justify-between">
                  <span>{formatFileSize(image.size)}</span>
                  {image.width && image.height && (
                    <span>{image.width}×{image.height}</span>
                  )}
                </div>
                <div className="text-gray-500">{image.mimeType}</div>
                {image.error && (
                  <div className="text-red-500 mt-1">{image.error}</div>
                )}
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
                  : progress.includes('⚠️')
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {progress}
            </div>
          ))}
        </div>
      )}

      {/* Debug Information */}
      {showDebug && previewImages.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Información de Debug
          </h4>
          
          <div className="space-y-2">
            {previewImages.map((image, index) => (
              <details key={index} className="text-xs">
                <summary className="cursor-pointer text-gray-700">
                  Imagen {index + 1}: {image.name}
                </summary>
                <div className="mt-1 ml-4 text-gray-600 space-y-1">
                  <div><strong>MIME Type:</strong> {image.mimeType}</div>
                  <div><strong>Tamaño:</strong> {formatFileSize(image.size)}</div>
                  {image.width && image.height && (
                    <div><strong>Dimensiones:</strong> {image.width}×{image.height}px</div>
                  )}
                  <div><strong>Válida:</strong> {image.isValid ? '✅ Sí' : '❌ No'}</div>
                  {image.error && (
                    <div><strong>Error:</strong> {image.error}</div>
                  )}
                  <div><strong>URL:</strong> <code className="text-xs break-all">{image.url}</code></div>
                </div>
              </details>
            ))}
          </div>
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
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded">
              <div className="text-sm font-medium">{previewImages[selectedImageIndex].name}</div>
              <div className="text-xs opacity-75">
                {formatFileSize(previewImages[selectedImageIndex].size)} • {previewImages[selectedImageIndex].mimeType}
                {previewImages[selectedImageIndex].width && previewImages[selectedImageIndex].height && (
                  <> • {previewImages[selectedImageIndex].width}×{previewImages[selectedImageIndex].height}px</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Sistema de imágenes mejorado:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>✅ Detección de tipo MIME real usando firmas de archivo</li>
          <li>🔍 Validación de dimensiones y tamaño automática</li>
          <li>👁️ Previsualización completa con información detallada</li>
          <li>🗑️ Gestión individual de imágenes con eliminación fácil</li>
          <li>📊 Debug opcional para troubleshooting</li>
        </ul>
      </div>
    </div>
  );
}