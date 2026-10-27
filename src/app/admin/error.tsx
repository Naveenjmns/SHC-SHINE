"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCcw, Home, LayoutDashboard, ArrowLeft, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("Admin Portal Error:", error);
  }, [error]);

  const copyDigest = async () => {
    if (error?.digest) {
      const ok = await copyToClipboard(error.digest);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-canvas text-ink">
      <div className="max-w-md w-full text-center bg-surface border border-border rounded-3xl p-8 shadow-card space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-surface border border-danger-border flex items-center justify-center text-danger">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-danger bg-danger-surface px-2.5 py-1 rounded-full border border-danger-border">
            Admin Console Exception
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
            Section Failed to Load
          </h2>
          <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
            A query or rendering error occurred in the administrative panel. Your permissions and database session remain secure.
          </p>
        </div>

        {error?.digest && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-surface-raised border border-border text-xs font-mono text-ink-muted">
            <span>Trace: {error.digest}</span>
            <button onClick={copyDigest} className="text-ink-subtle hover:text-ink">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Retry Section"}</span>
          </button>

          <Link
            href="/admin"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-surface border border-border text-ink-muted hover:bg-surface-raised transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin Overview</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-border">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-ink-muted">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
