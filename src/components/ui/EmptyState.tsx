import React, { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    leftIcon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 rounded-2xl border border-dashed border-border-strong bg-surface text-center flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-accent-muted flex items-center justify-center text-accent shrink-0">
        {icon || <Inbox className="w-6 h-6" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {description && (
          <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {action && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={action.leftIcon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
