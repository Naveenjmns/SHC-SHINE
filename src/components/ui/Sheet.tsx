"use client";

import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  position?: "right" | "left" | "bottom";
  showCloseButton?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = "right",
  showCloseButton = true,
}: SheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    right: "right-0 top-0 bottom-0 w-full max-w-md border-l animate-in slide-in-from-right duration-200",
    left: "left-0 top-0 bottom-0 w-full max-w-md border-r animate-in slide-in-from-left duration-200",
    bottom: "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[12px] border-t animate-in slide-in-from-bottom duration-200",
  };

  return (
    <div className="fixed inset-0 z-drawer flex">
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div
        className={`fixed bg-surface border-border-strong flex flex-col z-10 ${positionClasses[position]}`}
        style={{ boxShadow: "var(--shadow-modal)" }}
      >
        {(title || showCloseButton) && (
          <div className="p-5 pb-3 border-b border-border flex items-start justify-between gap-4 shrink-0 bg-surface">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-ink leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-ink-muted mt-1">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-[8px] hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export const Drawer = Sheet;
