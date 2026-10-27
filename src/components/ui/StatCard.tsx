import React, { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  description,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-2xl bg-surface border border-border shadow-card space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-muted truncate">
          {label}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-[10px] bg-accent-muted flex items-center justify-center text-accent shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[2rem] leading-tight font-bold font-display text-ink tabular-nums">
          {value}
        </div>

        {(delta || description) && (
          <div className="flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  delta.isNeutral
                    ? "text-ink-muted"
                    : delta.isPositive
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {delta.isNeutral ? (
                  <Minus className="w-3.5 h-3.5" />
                ) : delta.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {delta.value}
              </span>
            )}
            {(delta?.label || description) && (
              <span className="text-ink-subtle truncate">
                {delta?.label || description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
