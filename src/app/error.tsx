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
import { copyToClipboard } from "@/lib/clipboard";

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
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border text-ink-muted mb-6 shadow-card">
        <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
        <span className="text-[11px] sm:text-xs">
          HTTP 500 • System Anomaly
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="eyebrow text-danger">
          Server Error
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-fluid-hero text-ink mb-4 max-w-xl"
      >
        Internal Server Error
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg text-ink-muted max-w-md mx-auto leading-relaxed mb-6">
        An unexpected anomaly occurred while processing this request. Our technical team has been notified.
      </p>

      {/* Error Digest Badge */}
      {error?.digest && (
        <div className="inline-flex max-w-[90vw] items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-surface border border-border shadow-card text-xs font-mono mb-6">
          <span className="text-ink-subtle">Incident:</span>
          <span className="font-semibold text-danger-ink truncate max-w-[140px] sm:max-w-none">
            {error.digest}
          </span>
          <button
            onClick={copyDigest}
            title="Copy Incident ID"
            className="ml-1 text-ink-subtle hover:text-ink transition p-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="btn-primary text-sm disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Retrying..." : "Try again"}</span>
        </button>

        <Link
          href="/"
          className="btn-outline text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Technical Diagnostics Collapsible */}
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-xs text-ink-subtle hover:text-ink transition mb-2"
        >
          <span>{showDetails ? "Hide technical details" : "Show technical details"}</span>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="p-4 rounded-2xl text-left font-mono text-xs overflow-x-auto bg-surface border border-border shadow-card text-ink-muted">
            <p className="font-semibold text-danger-ink mb-1 break-words">
              {error.name || "Error"}: {error.message || "Unknown error"}
            </p>
            {error.stack && (
              <pre className="text-[11px] text-ink-subtle whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full pt-6 mt-6 border-t border-border text-[11px] text-ink-subtle">
        Sacred Heart College • SHINE Telemetry Active
      </div>
    </ErrorPerspectiveStage>
  );
}
