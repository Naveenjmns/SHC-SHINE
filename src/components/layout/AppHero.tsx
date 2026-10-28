import React, { ReactNode } from "react";

interface AppHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons rendered beside the title on desktop, below it on mobile */
  actions?: ReactNode;
  /** Optional row rendered inside the band under the title (e.g. stats) */
  children?: ReactNode;
  className?: string;
}

/**
 * Navy inverse band that anchors dashboard pages. Decorative blobs give the
 * page energy without competing with the white content cards below it.
 */
export default function AppHero({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className = "",
}: AppHeroProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-surface-inverse text-white px-5 py-7 sm:px-8 sm:py-9 ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-10 w-56 h-56 sm:w-72 sm:h-72 rounded-[42%_58%_63%_37%/41%_44%_56%_59%] bg-blob-magenta opacity-80 blur-[2px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 right-24 sm:right-48 w-44 h-44 sm:w-56 sm:h-56 rounded-[58%_42%_37%_63%/44%_59%_41%_56%] bg-blob-cyan opacity-80 blur-[2px]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-surface-inverse/35" />

      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A6BBD1]">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[1.75rem] leading-tight sm:text-[2.5rem] font-bold text-white break-words">
            {title}
          </h1>
          {subtitle && <div className="text-base sm:text-lg text-[#C9D7E6]">{subtitle}</div>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>

      {children && <div className="relative mt-7">{children}</div>}
    </section>
  );
}

interface HeroStatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

/** Frosted stat tile for use inside AppHero */
export function HeroStat({ label, value, hint }: HeroStatProps) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm px-4 py-3.5 min-w-0">
      <div className="text-sm font-medium text-[#C9D7E6] truncate">{label}</div>
      <div className="mt-1 text-2xl sm:text-[1.75rem] font-bold text-white tabular-nums leading-tight">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-[#A6BBD1] truncate">{hint}</div>}
    </div>
  );
}

/** Light button for use on the navy hero */
export const heroButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[8px] bg-white text-ink text-[15px] font-semibold hover:bg-[#F0F3F8] transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0";
export const heroGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[8px] border border-white/30 text-white text-[15px] font-semibold hover:bg-white/10 transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0";
