"use client";

import React from "react";
import {
  Calendar,
  MapPin,
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatDateSafe } from "@/lib/dateUtils";

export interface DelegationInfo {
  id: string;
  collegeName: string;
  department: string;
  teamName: string;
  teamLeadName: string;
  teamLeadPhone: string | null;
  staffInchargeName: string | null;
  staffInchargePhone: string | null;
  paymentStatus: string;
}

export interface FestInfo {
  name: string;
  edition: string;
  tagline: string;
  institutionName: string;
  departmentName: string;
  venue: string;
  diningHallVenue?: string | null;
  floorPlanUrl?: string | null;
  startDate: string;
  endDate: string | null;
}

interface DigitalBadgeCardProps {
  badgeCode: string;
  name: string;
  email: string;
  phone: string;
  qrData: string;
  eventCheckedIn?: boolean;
  eventCheckedInAt?: string | null;
  delegation: DelegationInfo;
  fest: FestInfo;
  onOpenMap: () => void;
}

export default function DigitalBadgeCard({
  badgeCode,
  name,
  qrData,
  eventCheckedIn,
  delegation,
  fest,
  onOpenMap,
}: DigitalBadgeCardProps) {
  const isApproved =
    delegation.paymentStatus === "PAID" ||
    delegation.paymentStatus === "VERIFIED";

  const formattedDate = formatDateSafe(
    fest.startDate,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
    "en-US"
  );

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden print-badge-wrapper">
      {/* Lanyard Slot Simulation */}
      <div className="h-5 bg-[var(--surface-raised)] border-b border-[var(--border)] flex items-center justify-center">
        <div className="w-14 h-2 rounded-full bg-[var(--border)]" />
      </div>

      {/* Fest Header Banner */}
      <div className="bg-[var(--surface-raised)] border-b border-[var(--border)] p-6 relative">
        <div className="flex justify-between items-start gap-4">
          <div>
            {fest.institutionName && (
              <div className="text-[11px] font-semibold text-[var(--accent)] tracking-wider uppercase mb-0.5">
                {fest.institutionName}
              </div>
            )}
            {fest.departmentName && (
              <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-medium mb-2">
                {fest.departmentName}
              </div>
            )}

            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-baseline gap-2">
              <span>{fest.name}</span>
              <span className="text-[var(--accent)]">{fest.edition}</span>
            </h1>
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] text-[10px] font-bold uppercase tracking-wider shrink-0">
            Official Pass
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{formattedDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{fest.venue}</span>
            <button
              type="button"
              onClick={onOpenMap}
              className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--ink)] text-[10px] font-semibold border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer ml-1"
            >
              Floor Plan
            </button>
          </span>
        </div>
      </div>

      {/* Delegate QR Code and Details */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* QR Code Container */}
          <div className="shrink-0 flex flex-col items-center">
            <div
              className={`p-2.5 bg-white border-2 rounded-xl shadow-2xs relative ${
                !isApproved ? "border-amber-400" : "border-[var(--ink)]"
              }`}
            >
              {qrData ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrData}
                  alt={`QR Pass for ${badgeCode}`}
                  className={`w-36 h-36 object-contain rounded-lg ${
                    !isApproved ? "opacity-75" : ""
                  }`}
                />
              ) : (
                <div className="w-36 h-36 bg-[var(--surface-raised)] flex items-center justify-center text-xs text-[var(--ink-muted)]">
                  QR Unavailable
                </div>
              )}
              {!isApproved && (
                <div className="absolute inset-2.5 bg-amber-500/10 rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="bg-amber-900/90 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-xs">
                    AWAITING APPROVAL
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 text-center">
              <span className="font-mono text-xs font-bold text-[var(--ink)] tracking-wider">
                {badgeCode}
              </span>
            </div>
          </div>

          {/* Delegate Information */}
          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Delegate Name
              </div>
              <h2 className="text-xl font-bold text-[var(--ink)]">{name}</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[var(--border)] text-xs">
              <div className="flex items-start gap-2 justify-center sm:justify-start">
                <Building2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Institution
                  </div>
                  <div className="font-semibold text-[var(--ink)]">
                    {delegation.collegeName}
                  </div>
                </div>
              </div>

              {delegation.department && (
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <GraduationCap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      Department
                    </div>
                    <div className="font-medium text-[var(--ink)]">
                      {delegation.department}
                    </div>
                  </div>
                </div>
              )}

              {delegation.teamName && (
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <Users className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      Team Contingent
                    </div>
                    <div className="font-medium text-[var(--ink)]">
                      {delegation.teamName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Check-In Status */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              {eventCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Checked In on Campus</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--ink-muted)] border border-[var(--border)] text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Awaiting Desk Arrival</span>
                </span>
              )}

              {isApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Pass</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

