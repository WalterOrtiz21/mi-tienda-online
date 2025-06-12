// src/components/admin/StoreIconUpload.tsx

'use client';

import { useState, useRef } from 'react';
import { Upload, X, Store, Loader } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';

interface StoreIconUploadProps {
  onIconUploaded: (url: string) => void;
  currentIcon?: string;
  className?: string;
}

export default function StoreIconUpload({
  onIconUploaded,
  currentIcon,
  className = ''
}: StoreIconUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleUpload(files[0]);
  };

  const handleUpload = async (file: File) => {
    // Validar que sea imagen cuadrada preferiblemente
    const img = new Image();
    img.onload = async () => {
      setIsUploading(true);
      setUploadMessage(`Subiendo ${file.name}...`);

      try {
        const result = await uploadImage(file);
        
        if (result.success && result.url) {
          onIconUploaded(result.url);
          setUploadMessage(`✅ Icono subido correctamente`);
        } else {
          setUploadMessage(`❌ Error: ${result.error}`);
        }
      } catch (error) {
        setUploadMessage(`❌ Error inesperado`);
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadMessage(''), 3000);
      }
    };

    img.src = URL.createObjectURL(file);
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

  const removeIcon = () => {
    onIconUploaded('');
    setUploadMessage('Icono eliminado');
    setTimeout(() => setUploadMessage(''), 2000);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Icono de la Tienda
      </label>

      {/* Current Icon Preview */}
      {currentIcon && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <img 
            src={currentIcon} 
            alt="Icono actual"
            className="w-10 h-10 object-contain border rounded"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Icono actual</p>
            <p className="text-xs text-gray-500">Sube uno nuevo para reemplazar</p>
          </div>
          <button
            onClick={removeIcon}
            className="text-red-500 hover:text-red-700 p-1"
            title="Eliminar icono"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Subiendo icono...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Store className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Arrastra tu logo aquí o haz click
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG recomendado, tamaño cuadrado, máximo 5MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`text-xs p-2 rounded ${
          uploadMessage.includes('✅') 
            ? 'bg-green-100 text-green-700'
            : uploadMessage.includes('❌')
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Recomendaciones:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Formato cuadrado (ej: 64x64px o 128x128px)</li>
          <li>PNG con fondo transparente para mejor resultado</li>
          <li>Diseño simple que se vea bien en tamaño pequeño</li>
        </ul>
      </div>
    </div>
  );
}