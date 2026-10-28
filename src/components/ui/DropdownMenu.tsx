"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ReactNode,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from "react";

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className = "",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-popover mt-1.5 min-w-[200px] p-1.5 rounded-xl bg-surface border border-border animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
  icon?: ReactNode;
}

export function DropdownItem({
  variant = "default",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: DropdownItemProps) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      type="button"
      className={`w-full min-h-[44px] sm:min-h-[36px] px-3 py-2 rounded-[6px] text-sm font-medium flex items-center gap-2.5 transition-colors text-left cursor-pointer outline-none ${
        variant === "destructive"
          ? "text-danger hover:bg-danger-surface focus:bg-danger-surface"
          : "text-ink hover:bg-surface-raised focus:bg-surface-raised"
      } ${
        disabled
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : ""
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="h-px bg-border my-1" role="separator" />;
}

export function DropdownLabel({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-3 py-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
