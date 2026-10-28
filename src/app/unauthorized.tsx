import Link from "next/link";
import ErrorPerspectiveStage from "@/components/ErrorPerspectiveStage";
import { ArrowLeft, KeyRound, LogIn } from "lucide-react";

export default function Unauthorized() {
  return (
    <ErrorPerspectiveStage>
      {/* Fest Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-surface border border-border text-ink-muted mb-6 shadow-card">
        <span className="w-2.5 h-2.5 rounded-full bg-info animate-pulse" />
        <span className="text-xs sm:text-sm">
          HTTP 401 • Authentication Required
        </span>
      </div>

      {/* Eyebrow */}
      <div className="mb-2">
        <span className="eyebrow text-info-ink">
          Auth Required
        </span>
      </div>

      {/* Big Editorial Serif Heading */}
      <h1
        className="text-fluid-hero text-ink mb-4 max-w-xl"
      >
        Session Expired
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] sm:text-base md:text-lg text-ink-muted max-w-md mx-auto leading-relaxed mb-6">
        Your active login session has expired or authentication token is missing. Please sign in to resume.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto mb-6">
        <Link
          href="/login"
          className="btn-primary text-[15px]"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to SHINE</span>
        </Link>

        <Link
          href="/"
          className="btn-outline text-[15px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to homepage</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="w-full pt-6 mt-4 border-t border-border text-xs text-ink-subtle">
        SHINE 26 Identity Verification • Sacred Heart College
      </div>
    </ErrorPerspectiveStage>
  );
}
