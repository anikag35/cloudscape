"use client";

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const colors = {
  success: {
    bg: "bg-[var(--color-success-dim)]",
    border: "border-[var(--color-success)]/30",
    icon: "text-[var(--color-success)]",
  },
  error: {
    bg: "bg-[var(--color-danger-dim)]",
    border: "border-[var(--color-danger)]/30",
    icon: "text-[var(--color-danger)]",
  },
  info: {
    bg: "bg-[var(--color-surface)]",
    border: "border-[var(--color-border)]",
    icon: "text-[var(--color-accent)]",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = colors[toast.type];
  const Icon = icons[toast.type];

  // Auto-dismiss after 4s
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} shadow-lg animate-slide-in max-w-sm`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${config.icon}`} />
      <p className="text-sm text-[var(--color-text)] flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="shrink-0 p-1 hover:bg-black/10 rounded transition">
        <X className="w-3 h-3 text-[var(--color-text-dim)]" />
      </button>
    </div>
  );
}
