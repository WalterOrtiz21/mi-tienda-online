// src/components/admin/ImageUpload.tsx - Con debug de URLs y detección de problemas

'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  cacheBuster?: number;
  debugInfo?: {
    detectedProtocol: string;
    detectedHost: string;
    fullUrl: string;
    environment: string;
    headers: Record<string, string | null>;
  };
}

// Función mejorada de upload con debug detallado
const uploadImageWithDebug = async (file: File): Promise<UploadResult> => {
  try {
    console.log('📤 Iniciando upload:', file.name);
    
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
      cacheBuster: result.cacheBuster,
      debugInfo: result.debugInfo
    };

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
};

// Función para verificar si una imagen es accesible
const testImageAccess = async (imageUrl: string): Promise<{ accessible: boolean; status?: number; error?: string }> => {
  try {
    console.log('🔍 Testing image access:', imageUrl);
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    console.log(`📊 Image test result: ${response.status} ${response.statusText}`);
    
    return {
      accessible: response.ok,
      status: response.status
    };
  } catch (error) {
    console.error('❌ Image access test failed:', error);
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  onMultipleImagesUploaded?: (urls: string[]) => void;
  multiple?: boolean;
  currentImage?: string;
  className?: string;
  showDebug?: boolean; // Nueva prop para mostrar info de debug
}

export default function ImageUpload({
  onImageUploaded,
  onMultipleImagesUploaded,
  multiple = false,
  currentImage,
  className = '',
  showDebug = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [lastUploadDebug, setLastUploadDebug] = useState<UploadResult['debugInfo'] | null>(null);
  const [lastImageTest, setLastImageTest] = useState<{ url: string; accessible: boolean; status?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (multiple) {
      handleMultipleUpload(files);
    } else {
      handleSingleUpload(files[0]);
    }
  };

  const handleSingleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress([`📤 Subiendo ${file.name}...`]);
    setLastUploadDebug(null);
    setLastImageTest(null);

    try {
      const result = await uploadImageWithDebug(file);
      
      if (result.success && result.url) {
        setUploadProgress([`🔄 Imagen subida, verificando acceso...`]);
        
        // Guardar debug info
        if (result.debugInfo) {
          setLastUploadDebug(result.debugInfo);
        }
        
        // Verificar acceso a la imagen
        const accessTest = await testImageAccess(result.url);
        setLastImageTest({
          url: result.url,
          accessible: accessTest.accessible,
          status: accessTest.status
        });
        
        if (accessTest.accessible) {
          onImageUploaded?.(result.url);
          setUploadProgress([`✅ ${file.name} subido y accesible`]);
        } else {
          setUploadProgress([
            `⚠️ ${file.name} subido pero no accesible`,
            `Status: ${accessTest.status || 'Unknown'}`,
            `URL: ${result.url}`
          ]);
        }
        
      } else {
        setUploadProgress([`❌ Error: ${result.error}`]);
      }
    } catch (error) {
      setUploadProgress([`❌ Error inesperado: ${error}`]);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 10000); // Mantener más tiempo para debug
    }
  };

  const handleMultipleUpload = async (files: FileList) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    setUploadProgress(fileArray.map(f => `📤 Subiendo ${f.name}...`));

    try {
      const uploadPromises = fileArray.map(file => uploadImageWithDebug(file));
      const results = await Promise.all(uploadPromises);
      
      const successfulUrls: string[] = [];
      const newProgress: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const fileName = fileArray[i].name;
        
        if (result.success && result.url) {
          const accessTest = await testImageAccess(result.url);
          
          if (accessTest.accessible) {
            successfulUrls.push(result.url);
            newProgress.push(`✅ ${fileName} subido y accesible`);
          } else {
            newProgress.push(`⚠️ ${fileName} subido pero no accesible (${accessTest.status})`);
          }
        } else {
          newProgress.push(`❌ ${fileName}: ${result.error}`);
        }
      }

      setUploadProgress(newProgress);
      
      if (successfulUrls.length > 0 && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(successfulUrls);
      }
    } catch (error) {
      setUploadProgress(['❌ Error inesperado en la subida múltiple']);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 10000);
    }
  };

  // Test manual de imagen actual
  const testCurrentImage = async () => {
    if (!currentImage) return;
    
    setUploadProgress(['🔍 Verificando imagen actual...']);
    const test = await testImageAccess(currentImage);
    setLastImageTest({
      url: currentImage,
      accessible: test.accessible,
      status: test.status
    });
    
    setUploadProgress([
      test.accessible 
        ? '✅ Imagen actual accesible' 
        : `❌ Imagen actual no accesible (${test.status})`
    ]);
    
    setTimeout(() => setUploadProgress([]), 5000);
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
            <p className="text-sm text-gray-600">Subiendo y verificando imagen(s)...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {multiple ? 'Arrastra imágenes aquí o haz click' : 'Arrastra imagen aquí o haz click'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP hasta 5MB {multiple ? '(múltiples archivos)' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Current Image Preview con test */}
      {currentImage && !multiple && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <img 
            src={currentImage} 
            alt="Imagen actual"
            className="w-12 h-12 object-cover rounded"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Imagen actual</p>
            <p className="text-xs text-gray-500 break-all">{currentImage}</p>
          </div>
          <button
            onClick={testCurrentImage}
            className="p-2 text-blue-500 hover:text-blue-700"
            title="Verificar acceso"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-1">
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
      {showDebug && (lastUploadDebug || lastImageTest) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Información de Debug
          </h4>
          
          {lastUploadDebug && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Detección de URL:</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div>🌐 Protocolo: <code>{lastUploadDebug.detectedProtocol}</code></div>
                <div>🏠 Host: <code>{lastUploadDebug.detectedHost}</code></div>
                <div>🔗 URL Base: <code>{lastUploadDebug.fullUrl}</code></div>
                <div>⚙️ Entorno: <code>{lastUploadDebug.environment}</code></div>
              </div>
              
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">Headers detectados</summary>
                <div className="mt-1 text-xs text-gray-600 space-y-1">
                  {Object.entries(lastUploadDebug.headers).map(([key, value]) => (
                    <div key={key}>
                      <code>{key}</code>: <code>{value || 'null'}</code>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          
          {lastImageTest && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-1">Test de Acceso:</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div className={`flex items-center ${lastImageTest.accessible ? 'text-green-600' : 'text-red-600'}`}>
                  {lastImageTest.accessible ? '✅' : '❌'} 
                  Estado: {lastImageTest.accessible ? 'Accesible' : 'No accesible'}
                  {lastImageTest.status && ` (${lastImageTest.status})`}
                </div>
                <div className="break-all">🔗 URL: <code>{lastImageTest.url}</code></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Sistema con debug mejorado:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>✅ Detección automática de protocolo HTTPS/HTTP</li>
          <li>🔍 Verificación de acceso a imágenes subidas</li>
          <li>🛠️ Debug detallado para troubleshooting</li>
          <li>⚡ URLs optimizadas para cada entorno</li>
        </ul>
      </div>
    </div>
  );
}