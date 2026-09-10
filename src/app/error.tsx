"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import {
  ArrowLeft,
  RefreshCcw,
  Copy,
  Check,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("Runtime Exception:", error);
  }, [error]);

  const copyDigest = () => {
    if (error?.digest) {
      navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 400);
  };

  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 border border-stone-800 text-stone-300 mb-6 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="tracking-wider uppercase text-[10px] sm:text-[11px]">
          HTTP 500 • System Anomaly
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold text-rose-400">
          Server Error
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-[1.08] text-white font-serif drop-shadow-[0_8px_30px_rgba(244,63,94,0.18)] mb-4 max-w-xl"
        style={{ fontFamily: "'Newsreader', 'Playfair Display', Georgia, serif" }}
      >
        Internal Server Error
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg font-light text-stone-400 max-w-md mx-auto leading-relaxed mb-6">
        An unexpected anomaly occurred while processing this request. Our technical team has been notified.
      </p>

      {/* Error Digest Badge */}
      {error?.digest && (
        <div className="inline-flex max-w-[90vw] items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono mb-6">
          <span className="text-stone-500">Incident:</span>
          <span className="font-semibold text-rose-400 truncate max-w-[140px] sm:max-w-none">
            {error.digest}
          </span>
          <button
            onClick={copyDigest}
            title="Copy Incident ID"
            className="ml-1 text-stone-400 hover:text-white transition p-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#FF6B1A] text-white hover:bg-[#E8551F] transition shadow-lg shadow-orange-500/25 disabled:opacity-50 min-h-[44px]"
        >
          <RefreshCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Retrying..." : "Try again"}</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Technical Diagnostics Collapsible */}
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300 transition mb-2"
        >
          <span>{showDetails ? "Hide technical details" : "Show technical details"}</span>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="p-4 rounded-xl text-left font-mono text-xs overflow-x-auto bg-stone-950 border border-stone-800 text-stone-300">
            <p className="font-semibold text-rose-400 mb-1 break-words">
              {error.name || "Error"}: {error.message || "Unknown error"}
            </p>
            {error.stack && (
              <pre className="text-[11px] text-stone-500 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full pt-6 mt-6 border-t border-stone-800/80 text-[11px] text-stone-500">
        Sacred Heart College • SHINE Telemetry Active
      </div>
    </ErrorPerspectiveStage>
  );
}
