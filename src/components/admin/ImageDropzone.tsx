'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  hint?: string;
};

export default function ImageDropzone({
  label,
  value,
  onChange,
  multiple = false,
  hint,
}: Props) {
  const { show } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          urls.push(data.url);
        } else {
          show({ message: data.error || 'Error subiendo imagen' });
        }
      } catch {
        show({ message: 'Error de red al subir imagen' });
      }
    }
    if (urls.length > 0) {
      onChange(multiple ? [...value, ...urls] : [urls[0]]);
      show({
        message: `${urls.length} imagen${urls.length > 1 ? 'es' : ''} subida${
          urls.length > 1 ? 's' : ''
        }`,
        durationMs: 1500,
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[color:var(--color-cocoa)]">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
          drag
            ? 'border-[color:var(--color-cocoa)] bg-[color:var(--color-cream)]'
            : 'border-[color:var(--color-cream)] bg-[color:var(--color-shell)] hover:bg-[color:var(--color-cream)]/40'
        }`}
        role="button"
        tabIndex={0}
      >
        <Upload className="w-6 h-6 mx-auto text-[color:var(--color-taupe)]" />
        <p className="mt-2 text-sm text-[color:var(--color-cocoa)]">
          {uploading
            ? 'Subiendo…'
            : `Tocá o arrastrá ${multiple ? 'imágenes' : 'una imagen'} acá`}
        </p>
        {hint && (
          <p className="text-xs text-[color:var(--color-taupe)] mt-1">{hint}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="relative aspect-square rounded overflow-hidden bg-[color:var(--color-cream)]"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 p-1 bg-[color:var(--color-shell)]/90 rounded-full hover:bg-[color:var(--color-shell)]"
                aria-label="Quitar imagen"
              >
                <X className="w-3 h-3 text-[color:var(--color-cocoa)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
