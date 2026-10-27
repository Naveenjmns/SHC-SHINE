"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  UserCheck,
  Clock,
  Theater,
  Lock,
  Unlock,
  Eye,
  QrCode,
  RotateCcw,
  Download,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

export interface StatsData {
  totalUsers: number;
  totalStudents: number;
  totalCoordinators: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  confirmedRegistrations: number;
  rejectedRegistrations: number;
  totalEvents: number;
  totalRevenue: number;
  pendingRevenue?: number;
  totalApprovedStudents?: number;
  totalPendingStudents?: number;
}

export interface EventBreakdown {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  venue: string | null;
  coordinatorName: string;
  staffCoordinatorName?: string | null;
  studentCoordinatorName?: string | null;
  registrationsCount: number;
}

interface AdminOverviewTabProps {
  stats: StatsData;
  eventBreakdown: EventBreakdown[];
  activeEdition: any;
  saving: boolean;
  onToggleRegistration: () => void;
  onOpenCheckIn: () => void;
  onOpenResetModal: () => void;
  onDownloadEventCSV: (eventId: string, eventName: string) => void;
  onDownloadAllEventCSVs: () => void;
  downloadingEventId: string | null;
}

export default function AdminOverviewTab({
  stats,
  eventBreakdown,
  activeEdition,
  saving,
  onToggleRegistration,
  onOpenCheckIn,
  onOpenResetModal,
  onDownloadEventCSV,
  onDownloadAllEventCSVs,
  downloadingEventId,
}: AdminOverviewTabProps) {
  const isRegOpen = activeEdition?.isRegistrationOpen ?? true;
  const displayRevenue = stats.totalRevenue ?? 0;

  return (
    <div className="space-y-6">
      {/* Registration Gateway Controller Banner */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRegOpen
                  ? "bg-success-surface text-success-ink border border-success-border"
                  : "bg-danger-surface text-danger-ink border border-danger-border"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRegOpen ? "bg-success animate-pulse" : "bg-danger"
                }`}
              />
              {isRegOpen ? "Registration Open" : "Registration Closed"}
            </span>

            <span className="text-xs text-ink-muted font-mono bg-surface-raised px-2 py-0.5 rounded-full border border-border">
              Edition: {activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "Active Fest"}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-ink">
            {isRegOpen
              ? "Public Registration Gateway is Live"
              : "Public Registration Gateway is Frozen"}
          </h2>
          <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
            {isRegOpen
              ? "External student contingents, team leads, and participants can register and obtain passes at /register."
              : "Registration is temporarily closed. Existing passes, verification, and badge check-ins remain operational."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant={isRegOpen ? "danger" : "primary"}
            size="sm"
            onClick={onToggleRegistration}
            loading={saving}
          >
            {isRegOpen ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Close Registrations
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Re-Open Registrations
              </>
            )}
          </Button>

          <Link href="/register" target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View /register
            </Button>
          </Link>

          <Button variant="secondary" size="sm" onClick={onOpenCheckIn}>
            <QrCode className="w-3.5 h-3.5 mr-1.5 text-accent" />
            Check-In Hub
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenResetModal}
            className="text-danger hover:bg-danger-surface"
            title="Reset registrations data"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            <Trophy className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-success-ink tabular-nums">
            ₹{displayRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            {stats.pendingRevenue && stats.pendingRevenue > 0
              ? `Paid (Pending: ₹${stats.pendingRevenue.toLocaleString()})`
              : "From confirmed registrations"}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <UserCheck className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-accent tabular-nums">
            {stats.totalApprovedStudents ?? stats.confirmedRegistrations}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            Official QR passes issued
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-warning-ink tabular-nums">
            {stats.totalPendingStudents ?? stats.pendingRegistrations}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            Awaiting desk verification
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-ink tabular-nums">
            {stats.totalRegistrations}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            Confirmed: {stats.confirmedRegistrations} · Pending: {stats.pendingRegistrations}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-ink-muted mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Competitions</span>
            <Theater className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-ink tabular-nums">
            {stats.totalEvents}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            On-stage &amp; off-stage events
          </p>
        </div>
      </div>

      {/* Competitions Breakdown Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Competitions Breakdown</h3>
            <p className="text-xs text-ink-muted">
              Monitor event registrations and download participant rosters
            </p>
          </div>
          {eventBreakdown.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadAllEventCSVs}
              disabled={downloadingEventId === "ALL"}
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-accent" />
              Download All (CSVs)
            </Button>
          )}
        </div>

        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-raised border-b border-border font-semibold text-ink-muted uppercase">
                <th className="py-2.5 px-3">Event Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Coordinators</th>
                <th className="py-2.5 px-3">Registrations</th>
                <th className="py-2.5 px-3 text-right">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {eventBreakdown.map((ev) => {
                const staffName = ev.staffCoordinatorName || ev.coordinatorName;
                const studentName = ev.studentCoordinatorName;

                return (
                  <tr key={ev.id} className="hover:bg-surface-raised transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink">{ev.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          ev.category === "ON_STAGE"
                            ? "bg-accent-muted text-accent-strong border border-accent/30"
                            : "bg-surface-raised text-ink-muted border border-border"
                        }`}
                      >
                        {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-ink">
                          Staff: {staffName && staffName !== "Unassigned" ? staffName : "Unassigned"}
                        </span>
                        {studentName && (
                          <span className="text-[11px] text-ink-muted">
                            Student: {studentName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink tabular-nums">
                      {ev.registrationsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadEventCSV(ev.id, ev.name)}
                        disabled={downloadingEventId === ev.id}
                        className="text-xs h-7 px-2 text-accent hover:bg-accent/10"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        CSV
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

