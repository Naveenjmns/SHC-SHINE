import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import { ArrowLeft, Compass, Trophy, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 border border-stone-800 text-stone-300 mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#FF6B1A] animate-pulse" />
        <span className="tracking-wider uppercase text-[10px] sm:text-[11px]">
          SHINE 26 • Sacred Heart College
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold text-[#FF6B1A]">
          Error 404
        </span>
      </div>

      {/* Big Editorial Serif Heading (Locomotive Reference Style - Pure Dark) */}
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-[1.08] text-white font-serif drop-shadow-[0_8px_30px_rgba(255,107,26,0.18)] mb-4 max-w-xl"
        style={{ fontFamily: "'Newsreader', 'Playfair Display', Georgia, serif" }}
      >
        Page Not Found
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg font-light text-stone-400 max-w-md mx-auto leading-relaxed mb-6">
        The page or stage coordinate you are looking for could not be found.
      </p>

      {/* Primary Action Link (Matching Locomotive reference) */}
      <div className="mb-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm sm:text-base font-medium tracking-tight text-white hover:text-[#FF6B1A] transition-all underline underline-offset-8 decoration-stone-600 hover:decoration-[#FF6B1A]"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Responsive Buttons (Stacked on mobile, row on sm+) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-8">
        <Link
          href="/events"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition min-h-[44px]"
        >
          <Compass className="w-4 h-4 text-[#D9A441]" />
          <span>Browse Fest Events</span>
        </Link>

        <Link
          href="/leaderboard"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition min-h-[44px]"
        >
          <Trophy className="w-4 h-4 text-[#D9A441]" />
          <span>Live Results</span>
        </Link>
      </div>

      {/* Quick Access Footer Strip */}
      <div className="w-full pt-6 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-500">
        <Link href="/register" className="hover:text-[#FF6B1A] transition flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B1A]" />
          <span>Delegate Register</span>
        </Link>
        <span>•</span>
        <Link href="/login" className="hover:text-stone-300 transition">
          Portal Login →
        </Link>
      </div>

      {/* Interactive Hint */}
      <div className="mt-4 text-[10px] text-stone-600 uppercase tracking-widest font-medium pointer-events-none">
        Click anywhere to guide delegates
      </div>
    </ErrorPerspectiveStage>
  );
}
