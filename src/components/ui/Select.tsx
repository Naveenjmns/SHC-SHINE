import React, { forwardRef, SelectHTMLAttributes, useId } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      fullWidth = true,
      disabled,
      children,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`space-y-1.5 ${fullWidth ? "w-full" : "inline-block"}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-ink select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            className={`w-full h-12 pl-3 pr-10 rounded-[8px] bg-surface text-ink text-base appearance-none transition-all border outline-none cursor-pointer ${
              hasError
                ? "border-danger focus:ring-4 focus:ring-danger/15"
                : "border-border hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15"
            } ${
              disabled
                ? "opacity-50 bg-surface-sunken cursor-not-allowed pointer-events-none"
                : ""
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-surface text-ink"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3 pointer-events-none text-ink-subtle flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {hasError && (
          <p id={`${selectId}-error`} className="text-sm text-danger font-medium">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${selectId}-helper`} className="text-sm text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
