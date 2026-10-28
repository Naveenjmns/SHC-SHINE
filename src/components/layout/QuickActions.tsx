import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface QuickAction {
  label: string;
  description?: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
}

/** Large, thumb-friendly action tiles — 2 columns on phones, 4 on desktop */
export default function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((a) => {
        const inner = (
          <>
            <span className="w-11 h-11 rounded-[12px] bg-accent-muted text-accent flex items-center justify-center shrink-0 [&_svg]:size-[22px]">
              {a.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-ink leading-snug">{a.label}</span>
              {a.description && (
                <span className="hidden sm:block text-sm text-ink-muted truncate">{a.description}</span>
              )}
            </span>
            <ChevronRight className="hidden sm:block w-5 h-5 text-ink-disabled group-hover:text-accent transition-colors shrink-0" />
          </>
        );
        const cls =
          "group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-5 min-h-[104px] sm:min-h-0 rounded-2xl bg-surface border border-border shadow-card hover:border-accent/40 hover:shadow-elevated transition-[box-shadow,border-color] text-left cursor-pointer";
        return a.href ? (
          <Link key={a.label} href={a.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={a.label} type="button" onClick={a.onClick} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
