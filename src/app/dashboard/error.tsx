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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-canvas text-ink">
      <div className="max-w-md w-full text-center bg-surface border border-border rounded-3xl p-8 shadow-card space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-muted flex items-center justify-center text-accent">
          <UserCheck className="w-7 h-7" />
        </div>

        <div>
          <span className="pill-badge">
            Delegate Portal
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
            Dashboard Sync Interrupted
          </h2>
          <p className="mt-1.5 text-[15px] text-ink-muted leading-relaxed">
            We could not synchronize your badge or registered events right now. Your registration status in the database is completely safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-[15px] font-semibold bg-accent text-accent-ink hover:bg-accent-hover transition disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Refresh Badge"}</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-[15px] font-semibold bg-surface border border-border text-ink hover:border-accent hover:text-accent transition"
          >
            <span>Dashboard Home</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-border">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Main Stage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
