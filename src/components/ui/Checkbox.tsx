import React, { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, disabled, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex flex-col space-y-1">
        <label
          htmlFor={checkboxId}
          className={`min-h-[44px] sm:min-h-0 py-1 flex items-start gap-3 select-none cursor-pointer group ${
            disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
          }`}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              disabled={disabled}
              className={`peer sr-only`}
              {...props}
            />
            <div
              className={`w-5 h-5 rounded-[4px] border transition-all flex items-center justify-center bg-surface border-border-strong peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-checked:bg-accent peer-checked:border-accent group-hover:border-accent ${className}`}
            >
              <Check className="w-3.5 h-3.5 text-accent-ink opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>

          {(label || description) && (
            <div className="space-y-0.5">
              {label && (
                <div className="text-[15px] font-medium text-ink leading-tight">
                  {label}
                </div>
              )}
              {description && (
                <div className="text-sm text-ink-muted leading-normal">
                  {description}
                </div>
              )}
            </div>
          )}
        </label>

        {error && <p className="text-sm text-danger font-medium pl-8">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
