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
    <div className="bg-surface border border-border rounded-3xl shadow-elevated overflow-hidden print-badge-wrapper">
      {/* Lanyard Slot Simulation */}
      <div className="h-5 bg-surface-raised border-b border-border flex items-center justify-center">
        <div className="w-14 h-2 rounded-full bg-border" />
      </div>

      {/* Fest Header Banner */}
      <div className="bg-surface-raised border-b border-border p-6 relative">
        <div className="flex justify-between items-start gap-4">
          <div>
            {fest.institutionName && (
              <div className="eyebrow text-accent mb-0.5">
                {fest.institutionName}
              </div>
            )}
            {fest.departmentName && (
              <div className="text-sm text-ink-muted font-medium mb-2">
                {fest.departmentName}
              </div>
            )}

            <h1 className="text-2xl font-bold tracking-tight text-ink flex items-baseline gap-2">
              <span>{fest.name}</span>
              <span className="text-accent">{fest.edition}</span>
            </h1>
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface border border-border text-ink text-sm font-semibold shrink-0">
            Official Pass
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>{formattedDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>{fest.venue}</span>
            <button
              type="button"
              onClick={onOpenMap}
              className="px-2 py-0.5 rounded-[8px] bg-surface text-ink text-xs font-semibold border border-border hover:border-accent transition-colors cursor-pointer ml-1"
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
              className={`p-2.5 bg-white border-2 rounded-2xl relative ${
                !isApproved ? "border-warning" : "border-ink"
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
                <div className="w-36 h-36 bg-surface-raised flex items-center justify-center text-sm text-ink-muted">
                  QR Unavailable
                </div>
              )}
              {!isApproved && (
                <div className="absolute inset-2.5 bg-warning/10 rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="bg-warning-ink text-white font-bold text-xs px-2 py-0.5 rounded-full">
                    AWAITING APPROVAL
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 text-center">
              <span className="font-mono text-[15px] font-bold text-ink tracking-wider tabular-nums">
                {badgeCode}
              </span>
            </div>
          </div>

          {/* Delegate Information */}
          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            <div>
              <div className="text-sm font-medium text-ink-muted">
                Delegate Name
              </div>
              <h2 className="text-2xl font-bold text-ink">{name}</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border text-sm">
              <div className="flex items-start gap-2 justify-center sm:justify-start">
                <Building2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-ink-muted">
                    Institution
                  </div>
                  <div className="font-semibold text-ink">
                    {delegation.collegeName}
                  </div>
                </div>
              </div>

              {delegation.department && (
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <GraduationCap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-ink-muted">
                      Department
                    </div>
                    <div className="font-medium text-ink">
                      {delegation.department}
                    </div>
                  </div>
                </div>
              )}

              {delegation.teamName && (
                <div className="flex items-start gap-2 justify-center sm:justify-start">
                  <Users className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-ink-muted">
                      Team Contingent
                    </div>
                    <div className="font-medium text-ink">
                      {delegation.teamName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Check-In Status */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              {eventCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-surface text-success-ink border border-success-border text-sm font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Checked In on Campus</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised text-ink-muted border border-border text-sm font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Awaiting Desk Arrival</span>
                </span>
              )}

              {isApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-surface text-success-ink text-xs font-bold border border-success-border">
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

