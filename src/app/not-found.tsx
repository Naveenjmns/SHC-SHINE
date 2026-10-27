import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import { ArrowLeft, Compass, Trophy, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border text-ink-muted mb-6 shadow-card">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-[11px] sm:text-xs">
          SHINE 26 • Sacred Heart College
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="eyebrow text-accent">
          Error 404
        </span>
      </div>

      {/* Big Editorial Serif Heading (Locomotive Reference Style - Pure Dark) */}
      <h1
        className="text-fluid-hero text-ink mb-4 max-w-xl"
      >
        Page Not Found
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg text-ink-muted max-w-md mx-auto leading-relaxed mb-6">
        The page or stage coordinate you are looking for could not be found.
      </p>

      {/* Primary Action Link (Matching Locomotive reference) */}
      <div className="mb-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-ink hover:text-accent transition-colors underline underline-offset-8 decoration-border-strong hover:decoration-accent"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Responsive Buttons (Stacked on mobile, row on sm+) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-8">
        <Link
          href="/events"
          className="btn-outline text-sm"
        >
          <Compass className="w-4 h-4 text-accent" />
          <span>Browse Fest Events</span>
        </Link>

        <Link
          href="/leaderboard"
          className="btn-outline text-sm"
        >
          <Trophy className="w-4 h-4 text-gold" />
          <span>Live Results</span>
        </Link>
      </div>

      {/* Quick Access Footer Strip */}
      <div className="w-full pt-6 border-t border-border flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-ink-subtle">
        <Link href="/register" className="hover:text-accent transition flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Delegate Register</span>
        </Link>
        <span>•</span>
        <Link href="/login" className="hover:text-ink transition">
          Portal Login →
        </Link>
      </div>

      {/* Interactive Hint */}
      <div className="mt-4 text-xs text-ink-subtle font-medium pointer-events-none">
        Click anywhere to guide delegates
      </div>
    </ErrorPerspectiveStage>
  );
}
