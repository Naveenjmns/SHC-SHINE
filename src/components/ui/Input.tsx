import React, { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      fullWidth = true,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`space-y-1.5 ${fullWidth ? "w-full" : "inline-block"}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-ink select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-ink-subtle pointer-events-none shrink-0 flex items-center justify-center">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={`w-full h-11 rounded-[8px] bg-surface text-ink text-sm placeholder:text-ink-subtle transition-all border outline-none ${
              startIcon ? "pl-10" : "pl-3"
            } ${endIcon ? "pr-10" : "pr-3"} ${
              hasError
                ? "border-danger focus:ring-2 focus:ring-danger"
                : "border-border hover:border-border-strong focus:border-transparent focus:ring-2 focus:ring-accent"
            } ${
              disabled
                ? "opacity-50 bg-surface-sunken cursor-not-allowed pointer-events-none"
                : ""
            } ${className}`}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 text-ink-subtle shrink-0 flex items-center justify-center">
              {endIcon}
            </div>
          )}
        </div>

        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-danger font-medium">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
