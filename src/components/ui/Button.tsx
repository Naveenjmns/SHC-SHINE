import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "dark" | "secondary" | "outline" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover hover:shadow-button active:bg-accent-active border border-transparent",
  dark:
    "bg-surface-inverse text-surface hover:opacity-90 border border-transparent",
  secondary:
    "bg-surface-raised text-ink hover:bg-surface-sunken border border-transparent shadow-none",
  outline:
    "bg-surface text-ink hover:border-accent hover:text-accent border border-border shadow-none",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger-ink border border-transparent shadow-none",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent shadow-none",
  link:
    "bg-transparent text-accent hover:underline p-0 h-auto border-none shadow-none font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] sm:min-h-[36px] h-9 px-3 text-xs gap-1.5",
  md: "min-h-[44px] h-11 px-4 text-sm gap-2",
  lg: "min-h-[48px] h-12 px-6 text-lg gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isBusy = isLoading || loading;
    const isDisabled = disabled || isBusy;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold rounded-[8px] transition-colors select-none whitespace-nowrap [&_svg]:shrink-0 [&>span>svg]:!m-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${
          fullWidth ? "w-full" : ""
        } ${
          isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        } ${className}`}
        {...props}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="contents">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="contents">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
