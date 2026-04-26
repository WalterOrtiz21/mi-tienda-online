'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Copy, Search, ImageIcon } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import ImageDropzone from '@/components/admin/ImageDropzone';

interface BucketFile {
  name: string;
  size?: number;
  created?: string;
  url: string;
}

interface BucketResponse {
  message: string;
  bucket: string;
  maxFileSize: string;
  allowedTypes: string[];
  filesCount: number;
  recentFiles: BucketFile[];
}

export default function ImagesPage() {
  const { show } = useToast();
  const [files, setFiles] = useState<BucketFile[]>([]);
  const [bucket, setBucket] = useState<string>('products');
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/upload');
      if (!res.ok) {
        show({ message: 'Error al cargar imágenes' });
        return;
      }
      const data: BucketResponse = await res.json();
      setBucket(data.bucket);
      setFiles(data.recentFiles ?? []);
    } catch {
      show({ message: 'Error de red al cargar imágenes' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (filename: string) => {
    if (!confirm(`¿Eliminar "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.name !== filename));
        show({ message: 'Imagen eliminada' });
      } else {
        show({ message: 'Error al eliminar' });
      }
    } catch {
      show({ message: 'Error de red al eliminar' });
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    show({ message: 'URL copiada', durationMs: 1200 });
  };

  const filtered = files.filter((f) =>
    query.trim() ? f.name.toLowerCase().includes(query.toLowerCase()) : true
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[color:var(--color-cocoa)]">
            Imágenes
          </h1>
          <p className="text-sm text-[color:var(--color-taupe)]">
            Bucket <code>{bucket}</code> · {files.length} archivo{files.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadFiles}
          disabled={isLoading}
          aria-label="Actualizar"
          className="p-2 rounded-md bg-[color:var(--color-shell)] border border-[color:var(--color-cream)] disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Upload zone */}
      <div className="bg-[color:var(--color-shell)] rounded-lg p-4">
        <ImageDropzone
          label="Subir imágenes"
          value={pendingUploads}
          onChange={(urls) => {
            setPendingUploads(urls);
            // Refrescar el listado para que aparezcan en el grid
            loadFiles();
          }}
          multiple
          hint="Las imágenes quedan disponibles en el bucket para reusar en productos."
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[color:var(--color-shell)] rounded-md px-3 py-2 border border-[color:var(--color-cream)]">
        <Search className="w-4 h-4 text-[color:var(--color-taupe)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          className="bg-transparent outline-none text-sm flex-1"
        />
      </div>

      {/* Grid */}
      {isLoading && files.length === 0 ? (
        <p className="text-[color:var(--color-taupe)] text-center py-8">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-[color:var(--color-tan)]" />
          <p className="mt-3 text-[color:var(--color-taupe)]">
            {query ? 'No hay imágenes con ese nombre.' : 'Aún no hay imágenes en el bucket.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((f) => (
            <div
              key={f.name}
              className="bg-[color:var(--color-shell)] rounded-lg overflow-hidden shadow-sm group"
            >
              <div className="aspect-square bg-[color:var(--color-cream)] relative">
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(f.url)}
                    aria-label="Copiar URL"
                    className="p-2 bg-[color:var(--color-shell)] rounded-full"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(f.name)}
                    aria-label="Eliminar"
                    className="p-2 bg-[color:var(--color-terra)] text-[color:var(--color-shell)] rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs truncate text-[color:var(--color-cocoa)]">{f.name}</p>
                <p className="text-[10px] text-[color:var(--color-taupe)]">
                  {formatSize(f.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
