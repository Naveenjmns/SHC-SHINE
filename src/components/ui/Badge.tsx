import React, { HTMLAttributes, ReactNode } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Radio as LiveIcon,
  Lock,
  Info,
} from "lucide-react";

export type BadgeVariant =
  | "confirmed"
  | "pending"
  | "rejected"
  | "live"
  | "closed"
  | "accent"
  | "gold"
  | "neutral"
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  showDefaultIcon?: boolean;
}

const variantStyles: Record<BadgeVariant, { classes: string; defaultIcon: ReactNode }> = {
  confirmed: {
    classes: "bg-status-confirmed-bg text-status-confirmed-text border-status-confirmed-border",
    defaultIcon: <CheckCircle2 className="w-3.5 h-3.5 text-status-confirmed shrink-0" />,
  },
  pending: {
    classes: "bg-status-pending-bg text-status-pending-text border-status-pending-border",
    defaultIcon: <Clock className="w-3.5 h-3.5 text-status-pending shrink-0" />,
  },
  rejected: {
    classes: "bg-status-rejected-bg text-status-rejected-text border-status-rejected-border",
    defaultIcon: <XCircle className="w-3.5 h-3.5 text-status-rejected shrink-0" />,
  },
  live: {
    classes: "bg-status-confirmed-bg text-status-confirmed-text border-status-confirmed-border",
    defaultIcon: <LiveIcon className="w-3.5 h-3.5 text-status-confirmed shrink-0 animate-pulse" />,
  },
  closed: {
    classes: "bg-surface-sunken text-ink-subtle border-border",
    defaultIcon: <Lock className="w-3.5 h-3.5 text-ink-subtle shrink-0" />,
  },
  accent: {
    classes: "bg-accent-muted text-accent-strong border-transparent font-semibold",
    defaultIcon: null,
  },
  gold: {
    classes: "bg-gold-muted text-gold-ink border-gold/30 font-semibold",
    defaultIcon: <Award className="w-3.5 h-3.5 text-gold shrink-0" />,
  },
  neutral: {
    classes: "bg-surface-raised text-ink-muted border-transparent",
    defaultIcon: null,
  },
  info: {
    classes: "bg-info-surface text-info-ink border-info-border",
    defaultIcon: <Info className="w-3.5 h-3.5 text-info shrink-0" />,
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-6 px-2.5 text-xs gap-1",
  md: "h-8 px-3 text-[13px] gap-1.5",
};

export function Badge({
  variant = "neutral",
  size = "md",
  icon,
  showDefaultIcon = true,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const currentVariant = variantStyles[variant];
  const renderedIcon = icon !== undefined ? icon : showDefaultIcon ? currentVariant.defaultIcon : null;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border select-none whitespace-nowrap ${
        currentVariant.classes
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {renderedIcon}
      <span className="contents">{children}</span>
    </span>
  );
}

// Alias StatusPill
export const StatusPill = Badge;
