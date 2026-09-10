"use client";

import { useState } from "react";
import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import { RefreshCcw, Wrench, Clock, ShieldCheck } from "lucide-react";

export default function MaintenancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 border border-stone-800 text-stone-300 mb-6 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="tracking-wider uppercase text-[10px] sm:text-[11px]">
          HTTP 503 • Platform Maintenance
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold text-[#FF6B1A]">
          Maintenance Mode
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-[1.08] text-white font-serif drop-shadow-[0_8px_30px_rgba(255,107,26,0.18)] mb-4 max-w-xl"
        style={{ fontFamily: "'Newsreader', 'Playfair Display', Georgia, serif" }}
      >
        Under Maintenance
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg font-light text-stone-400 max-w-md mx-auto leading-relaxed mb-6">
        Our technical crew is tuning stage systems and live event pipelines. We will resume fest services momentarily.
      </p>

      {/* Status Pill Group */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-stone-900 border border-stone-800 text-stone-400">
          <Clock className="w-3.5 h-3.5 text-[#D9A441]" />
          <span>Estimated window: ~5 mins</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-stone-900 border border-stone-800 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Registration data secured</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#FF6B1A] text-white hover:bg-[#E8551F] transition shadow-lg shadow-orange-500/25 disabled:opacity-50 min-h-[44px]"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Checking..." : "Check Status Now"}</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition min-h-[44px]"
        >
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="w-full pt-6 mt-4 border-t border-stone-800/80 text-[11px] text-stone-500">
        Sacred Heart College • SHINE Fest Operations
      </div>
    </ErrorPerspectiveStage>
  );
}
