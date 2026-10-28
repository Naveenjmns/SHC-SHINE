import React, { forwardRef, TextareaHTMLAttributes, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      disabled,
      rows = 4,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`space-y-1.5 ${fullWidth ? "w-full" : "inline-block"}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-ink select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          className={`w-full p-3 rounded-[8px] bg-surface text-ink text-base placeholder:text-ink-subtle transition-all border outline-none resize-y ${
            hasError
              ? "border-danger focus:ring-4 focus:ring-danger/15"
              : "border-border hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15"
          } ${
            disabled
              ? "opacity-50 bg-surface-sunken cursor-not-allowed pointer-events-none"
              : ""
          } ${className}`}
          {...props}
        />

        {hasError && (
          <p id={`${textareaId}-error`} className="text-sm text-danger font-medium">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${textareaId}-helper`} className="text-sm text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
