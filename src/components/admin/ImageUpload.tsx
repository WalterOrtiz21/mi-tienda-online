// src/components/admin/ImageUpload.tsx

'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadImage, uploadMultipleImages } from '@/lib/imageUpload';

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  onMultipleImagesUploaded?: (urls: string[]) => void;
  multiple?: boolean;
  currentImage?: string;
  className?: string;
}

export default function ImageUpload({
  onImageUploaded,
  onMultipleImagesUploaded,
  multiple = false,
  currentImage,
  className = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
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
    setUploadProgress([`Subiendo ${file.name}...`]);

    try {
      const result = await uploadImage(file);
      
      if (result.success && result.url) {
        onImageUploaded?.(result.url);
        setUploadProgress([`✅ ${file.name} subido correctamente`]);
      } else {
        setUploadProgress([`❌ Error: ${result.error}`]);
      }
    } catch (error) {
      setUploadProgress([`❌ Error inesperado`]);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  const handleMultipleUpload = async (files: FileList) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    setUploadProgress(fileArray.map(f => `Subiendo ${f.name}...`));

    try {
      const results = await uploadMultipleImages(files);
      const successfulUrls: string[] = [];
      const newProgress: string[] = [];

      results.forEach((result, index) => {
        const fileName = fileArray[index].name;
        if (result.success && result.url) {
          successfulUrls.push(result.url);
          newProgress.push(`✅ ${fileName} subido`);
        } else {
          newProgress.push(`❌ ${fileName}: ${result.error}`);
        }
      });

      setUploadProgress(newProgress);
      
      if (successfulUrls.length > 0 && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(successfulUrls);
      }
    } catch (error) {
      setUploadProgress(['❌ Error inesperado en la subida']);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 5000);
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
            <Loader className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Subiendo imagen(s)...</p>
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

      {/* Current Image Preview */}
      {currentImage && !multiple && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <img 
            src={currentImage} 
            alt="Imagen actual"
            className="w-12 h-12 object-cover rounded"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Imagen actual</p>
            <p className="text-xs text-gray-500">Sube una nueva para reemplazar</p>
          </div>
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
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {progress}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Las imágenes se optimizan automáticamente</li>
          <li>URLs permanentes y con CDN incluido</li>
          <li>Formatos recomendados: JPG para fotos, PNG para logos</li>
        </ul>
      </div>
    </div>
  );
}