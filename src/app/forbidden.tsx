import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import { ArrowLeft, Lock, LogIn } from "lucide-react";

export default function Forbidden() {
  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 border border-stone-800 text-stone-300 mb-6 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="tracking-wider uppercase text-[10px] sm:text-[11px]">
          HTTP 403 • Restricted Zone
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold text-[#D9A441]">
          Access Denied
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-[1.08] text-white font-serif drop-shadow-[0_8px_30px_rgba(217,164,65,0.18)] mb-4 max-w-xl"
        style={{ fontFamily: "'Newsreader', 'Playfair Display', Georgia, serif" }}
      >
        Access Restricted
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg font-light text-stone-400 max-w-md mx-auto leading-relaxed mb-6">
        This sector is reserved for verified coordinators, judges, or administrators. Your account lacks the required credentials.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#FF6B1A] text-white hover:bg-[#E8551F] transition shadow-lg shadow-orange-500/25 min-h-[44px]"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign in with another role</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="w-full pt-6 mt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
        <Link href="/dashboard" className="hover:text-[#FF6B1A] transition">
          Student Portal
        </Link>
        <span>•</span>
        <Link href="/coordinator" className="hover:text-[#FF6B1A] transition">
          Coordinator Portal
        </Link>
        <span>•</span>
        <Link href="/admin" className="hover:text-[#FF6B1A] transition">
          Admin Console
        </Link>
      </div>
    </ErrorPerspectiveStage>
  );
}
