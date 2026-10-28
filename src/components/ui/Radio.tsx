import React, { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, disabled, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <label
        htmlFor={radioId}
        className={`min-h-[44px] sm:min-h-0 py-1 flex items-start gap-3 select-none cursor-pointer group ${
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        }`}
      >
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-surface border-border-strong peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-checked:border-accent group-hover:border-accent ${className}`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-accent scale-0 peer-checked:scale-100 transition-transform" />
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
    );
  }
);

Radio.displayName = "Radio";
