"use client";

import React from "react";
import {
  X,
  Sparkles,
  QrCode,
  Utensils,
  Award,
  ShieldCheck,
  Building2,
  ExternalLink,
  Code2,
  Layers,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui";

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fest display name from the active edition (e.g. festTitle(edition)) */
  eventName?: string | null;
  hostDepartment?: string | null;
  institutionName?: string | null;
}

export default function AboutAppModal({
  isOpen,
  onClose,
  eventName,
  hostDepartment,
  institutionName,
}: AboutAppModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b3558]/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={eventName ? `About ${eventName} Platform` : "About Fest Platform"}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface text-ink rounded-3xl p-6 shadow-modal border border-border max-h-[85vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-accent-muted flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">
                  {eventName ? `${eventName} Platform OS` : "Fest Platform OS"}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-muted text-accent-strong">
                  v2.0
                </span>
              </div>
              <p className="text-sm text-ink-muted">
                Intercollegiate Fest Management & Wayfinding System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <h4 className="eyebrow">
            Architecture Highlights
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
              <div className="font-bold text-ink flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-accent" />
                <span>Paperless Digital Passes</span>
              </div>
              <p className="text-xs text-ink-muted">
                Unique encrypted QR badges with live desk check-in and multi-device scanner support.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
              <div className="font-bold text-ink flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-accent" />
                <span>Dining Hall Distribution</span>
              </div>
              <p className="text-xs text-ink-muted">
                Sub-second audio-cued food voucher claims preventing duplicate catering redemptions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
              <div className="font-bold text-ink flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-gold" />
                <span>Stage Leaderboard Engine</span>
              </div>
              <p className="text-xs text-ink-muted">
                16:9 projector auditorium mode with remote cycling and live championship standings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
              <div className="font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Role-Based Access Control</span>
              </div>
              <p className="text-xs text-ink-muted">
                Strict NextAuth RBAC boundaries for Students, Coordinators, Catering, and Admins.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="eyebrow">
            Technical Stack
          </h4>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["Next.js 16 App Router", "React 19", "Tailwind CSS v4", "PostgreSQL", "Prisma ORM", "NextAuth v4", "A* Wayfinding"].map((tech) => (
              <span key={tech} className="px-2.5 py-0.5 rounded-full bg-surface-raised border border-border text-ink font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Institution Attribution */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-center justify-between gap-3 text-sm">
          <div>
            {hostDepartment && (
              <div className="font-bold text-ink">{hostDepartment}</div>
            )}
            {institutionName && (
              <div className="text-xs text-ink-muted">{institutionName}</div>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-sm shrink-0">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

