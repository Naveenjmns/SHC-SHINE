"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, RefreshCcw, ArrowLeft } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("Student Dashboard Error:", error);
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#0C0A09] text-stone-100">
      <div className="max-w-md w-full text-center bg-stone-950 border border-stone-800 rounded-3xl p-8 shadow-xl space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B1A]">
          <UserCheck className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A] bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
            Delegate Portal
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
            Dashboard Sync Interrupted
          </h2>
          <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
            We could not synchronize your badge or registered events right now. Your registration status in the database is completely safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B1A] text-white hover:bg-[#E8551F] transition shadow-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Refresh Badge"}</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 transition"
          >
            <span>Dashboard Home</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-stone-800">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Main Stage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
