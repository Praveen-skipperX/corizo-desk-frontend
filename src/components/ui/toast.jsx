import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  loading: Loader2,
};

/**
 * Enterprise-style toast host — bottom center, auto-dismiss, stacked.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++toastId;
    const duration = toast.duration ?? (toast.variant === 'loading' ? 0 : 3200);
    const entry = {
      id,
      title: toast.title || '',
      description: toast.description || '',
      variant: toast.variant || 'info',
    };
    setToasts((prev) => [...prev.slice(-3), entry]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (title, description, opts) => push({ title, description, variant: 'success', ...opts }),
    error: (title, description, opts) => push({ title, description, variant: 'error', duration: 4500, ...opts }),
    info: (title, description, opts) => push({ title, description, variant: 'info', ...opts }),
    loading: (title, description) => push({ title, description, variant: 'loading', duration: 0 }),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] || Info;
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-md animate-in items-start gap-3 rounded-xl border px-4 py-3 shadow-elevated',
                'bg-secondary text-secondary-foreground',
                toast.variant === 'success' && 'border-emerald-500/30 bg-secondary',
                toast.variant === 'error' && 'border-destructive/40 bg-secondary',
                toast.variant === 'info' && 'border-primary/25 bg-secondary',
                toast.variant === 'loading' && 'border-primary/30 bg-secondary'
              )}
              style={{
                animation: 'toast-slide-up 0.28s ease-out',
              }}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  toast.variant === 'success' && 'text-emerald-400',
                  toast.variant === 'error' && 'text-red-400',
                  toast.variant === 'info' && 'text-primary',
                  toast.variant === 'loading' && 'animate-spin text-primary'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-white">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">{toast.description}</p>
                ) : null}
              </div>
              {toast.variant !== 'loading' && (
                <button
                  type="button"
                  className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
