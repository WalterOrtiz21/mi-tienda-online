'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

export type Toast = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
};

type ToastInput = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  show: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ message, actionLabel, onAction, durationMs = 2500 }: ToastInput) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, actionLabel, onAction, durationMs }]);
    },
    []
  );

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), t.durationMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
