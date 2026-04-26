'use client';

import { Check, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] rounded-lg shadow-lg pl-4 pr-2 py-2 flex items-center gap-3 min-w-[260px] max-w-sm animate-toast-in"
          role="status"
        >
          <Check className="w-4 h-4 flex-shrink-0 text-[color:var(--color-tan)]" />
          <span className="text-sm flex-1">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction!();
                dismiss(t.id);
              }}
              className="text-xs uppercase tracking-wider border-b border-[color:var(--color-tan)] text-[color:var(--color-tan)] pb-0.5"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar"
            className="p-1 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
