"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrCode, RefreshCcw, ArrowLeft, AlertCircle } from "lucide-react";

export default function CoordinatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("Coordinator Tool Error:", error);
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-stone-900 text-stone-100">
      <div className="max-w-md w-full text-center bg-stone-950 border border-stone-800 rounded-3xl p-8 shadow-xl space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D9A441]">
          <QrCode className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D9A441] bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Coordinator Portal
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
            Scanner / Event Tool Paused
          </h2>
          <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
            A temporary glitch paused the coordinator scanner or attendance queue. You can safely retry without losing recorded scans.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B1A] text-white hover:bg-[#E8551F] transition shadow-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Restarting..." : "Restart Tool"}</span>
          </button>

          <Link
            href="/coordinator"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 transition"
          >
            <span>Coordinator Home</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-stone-800">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Fest Landing</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
