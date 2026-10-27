"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
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

  // Stable identity: consumers list `toast` in hook deps, so a fresh object
  // per render would re-run their effects every time a toast appears.
  const toastMethods = useMemo(
    () => ({
      success: (msg: string, title?: string) => addToast("success", msg, title),
      error: (msg: string, title?: string) => addToast("error", msg, title),
      warning: (msg: string, title?: string) => addToast("warning", msg, title),
      info: (msg: string, title?: string) => addToast("info", msg, title),
    }),
    [addToast]
  );

  const contextValue = useMemo(
    () => ({ toast: toastMethods, confirmAction }),
    [toastMethods, confirmAction]
  );

  const toastIcon = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
    info: <Info className="w-4 h-4 text-info shrink-0" />,
  };

  const toastBorder = {
    success: "border-success-border bg-surface",
    error: "border-danger-border bg-surface",
    warning: "border-warning-border bg-surface",
    info: "border-info-border bg-surface",
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Floating Toast Stack */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-toast flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${
              toastBorder[item.type]
            } animate-in slide-in-from-top-3 duration-200`}
            style={{ boxShadow: "var(--shadow-popover)" }}
          >
            <div className="shrink-0 mt-0.5">{toastIcon[item.type]}</div>

            <div className="flex-1 text-xs leading-relaxed">
              {item.title && (
                <div className="font-semibold text-sm mb-0.5 text-ink">
                  {item.title}
                </div>
              )}
              <div className="text-ink-muted">{item.message}</div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(item.id)}
              aria-label="Dismiss toast"
              className="shrink-0 text-ink-subtle hover:text-ink transition-colors p-1 rounded-[6px] hover:bg-surface-raised cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-[#0b3558]/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-surface rounded-3xl p-6 border border-border animate-in zoom-in-95 duration-150 space-y-4"
            role="dialog"
            aria-modal="true"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 border ${
                  confirmModal.options.isDestructive
                    ? "bg-danger-surface text-danger border-danger-border"
                    : "bg-warning-surface text-warning border-warning-border"
                }`}
              >
                {confirmModal.options.isDestructive ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-ink leading-tight">
                  {confirmModal.options.title}
                </h3>
                <div className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">
                  {confirmModal.options.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="h-10 px-4 rounded-[8px] text-xs font-semibold text-ink bg-surface-raised hover:bg-surface-sunken border border-border transition-colors cursor-pointer"
              >
                {confirmModal.options.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`h-10 px-4 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                  confirmModal.options.isDestructive
                    ? "bg-danger hover:bg-danger/90 text-white"
                    : "bg-accent hover:bg-accent-hover text-accent-ink"
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
