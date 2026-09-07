"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  confirmAction: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const confirmAction = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmModal({
          isOpen: true,
          options,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirmClose = (result: boolean) => {
    if (confirmModal) {
      confirmModal.resolve(result);
      setConfirmModal(null);
    }
  };

  const toastMethods = {
    success: (msg: string, title?: string) => addToast("success", msg, title),
    error: (msg: string, title?: string) => addToast("error", msg, title),
    warning: (msg: string, title?: string) => addToast("warning", msg, title),
    info: (msg: string, title?: string) => addToast("info", msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, confirmAction }}>
      {children}

      {/* Floating Toast Stack */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-3 ${
              item.type === "success"
                ? "bg-white/95 text-emerald-950 border-emerald-200 shadow-emerald-500/10"
                : item.type === "error"
                ? "bg-white/95 text-rose-950 border-rose-200 shadow-rose-500/10"
                : item.type === "warning"
                ? "bg-white/95 text-amber-950 border-amber-200 shadow-amber-500/10"
                : "bg-white/95 text-sky-950 border-sky-200 shadow-sky-500/10"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {item.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {item.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {item.type === "info" && <Info className="w-5 h-5 text-sky-600" />}
            </div>

            <div className="flex-1 text-xs leading-relaxed">
              {item.title && <div className="font-bold text-sm mb-0.5 text-[#0F172A]">{item.title}</div>}
              <div className="text-[#334155] font-medium">{item.message}</div>
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-stone-400 hover:text-stone-700 transition p-1 rounded-lg hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 transform scale-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.options.isDestructive
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {confirmModal.options.isDestructive ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-[#0F172A] leading-tight">
                  {confirmModal.options.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  {confirmModal.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#475569] hover:bg-stone-100 transition"
              >
                {confirmModal.options.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                  confirmModal.options.isDestructive
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                    : "bg-[#0F172A] hover:bg-slate-800 shadow-slate-900/20"
                }`}
              >
                {confirmModal.options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
