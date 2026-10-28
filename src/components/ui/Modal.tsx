"use client";

import React, {
  useEffect,
  useRef,
  ReactNode,
  HTMLAttributes,
  forwardRef,
} from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle native ESC key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
    // isOpen: the <dialog> only mounts while open, so the listener must attach after it appears
  }, [onClose, isOpen]);

  // Handle backdrop clicks
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-modal m-auto p-0 bg-transparent backdrop:bg-[#0b3558]/50 backdrop:backdrop-blur-xs outline-none w-full ${maxWidthStyles[maxWidth]} px-4 sm:px-0`}
    >
      <div
        className="w-full bg-surface border border-border rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        style={{ boxShadow: "var(--shadow-modal)" }}
      >
        {(title || showCloseButton) && (
          <div className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between gap-4 shrink-0 bg-surface">
            <div>
              {title && (
                <h3 className="text-xl font-bold text-ink leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[15px] text-ink-muted mt-1">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-[8px] hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </dialog>
  );
}

export const Dialog = Modal;

export function DialogFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`pt-4 border-t border-border flex items-center justify-end gap-2.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
