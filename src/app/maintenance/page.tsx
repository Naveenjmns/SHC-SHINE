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
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-surface border border-border text-ink-muted mb-6 shadow-card">
        <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
        <span className="text-xs sm:text-sm">
          HTTP 503 • Platform Maintenance
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="eyebrow text-accent">
          Maintenance Mode
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-fluid-hero text-ink mb-4 max-w-xl"
      >
        Under Maintenance
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] sm:text-base md:text-lg text-ink-muted max-w-md mx-auto leading-relaxed mb-6">
        Our technical crew is tuning stage systems and live event pipelines. We will resume fest services momentarily.
      </p>

      {/* Status Pill Group */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface border border-border text-ink-muted">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Estimated window: ~5 mins</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-success-surface border border-success-border text-success-ink">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Registration data secured</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-primary text-[15px] disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Checking..." : "Check Status Now"}</span>
        </button>

        <Link
          href="/"
          className="btn-outline text-[15px]"
        >
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="w-full pt-6 mt-4 border-t border-border text-xs text-ink-subtle">
        Sacred Heart College • SHINE Fest Operations
      </div>
    </ErrorPerspectiveStage>
  );
}
