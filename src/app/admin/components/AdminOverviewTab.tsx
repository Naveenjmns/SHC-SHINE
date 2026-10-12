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
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRegOpen
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRegOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {isRegOpen ? "Registration Open" : "Registration Closed"}
            </span>

            <span className="text-xs text-[var(--ink-muted)] font-mono bg-[var(--surface-raised)] px-2 py-0.5 rounded-md border border-[var(--border)]">
              Edition: {activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "Active Fest"}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
            {isRegOpen
              ? "Public Registration Gateway is Live"
              : "Public Registration Gateway is Frozen"}
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-2xl leading-relaxed">
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
            <QrCode className="w-3.5 h-3.5 mr-1.5 text-[var(--accent)]" />
            Check-In Hub
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenResetModal}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Reset registrations data"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            ₹{displayRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            {stats.pendingRevenue && stats.pendingRevenue > 0
              ? `Paid (Pending: ₹${stats.pendingRevenue.toLocaleString()})`
              : "From confirmed registrations"}
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
            {stats.totalApprovedStudents ?? stats.confirmedRegistrations}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Official QR passes issued
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            {stats.totalPendingStudents ?? stats.pendingRegistrations}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Awaiting desk verification
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">
            {stats.totalRegistrations}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Confirmed: {stats.confirmedRegistrations} · Pending: {stats.pendingRegistrations}
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Competitions</span>
            <Theater className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">
            {stats.totalEvents}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            On-stage &amp; off-stage events
          </p>
        </div>
      </div>

      {/* Competitions Breakdown Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--ink)]">Competitions Breakdown</h3>
            <p className="text-xs text-[var(--ink-muted)]">
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
              <Download className="w-3.5 h-3.5 mr-1.5 text-[var(--accent)]" />
              Download All (CSVs)
            </Button>
          )}
        </div>

        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)] font-semibold text-[var(--ink-muted)] uppercase">
                <th className="py-2.5 px-3">Event Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Coordinators</th>
                <th className="py-2.5 px-3">Registrations</th>
                <th className="py-2.5 px-3 text-right">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {eventBreakdown.map((ev) => {
                const staffName = ev.staffCoordinatorName || ev.coordinatorName;
                const studentName = ev.studentCoordinatorName;

                return (
                  <tr key={ev.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[var(--ink)]">{ev.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          ev.category === "ON_STAGE"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        }`}
                      >
                        {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[var(--ink)]">
                          Staff: {staffName && staffName !== "Unassigned" ? staffName : "Unassigned"}
                        </span>
                        {studentName && (
                          <span className="text-[11px] text-[var(--ink-muted)]">
                            Student: {studentName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--ink)] tabular-nums">
                      {ev.registrationsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadEventCSV(ev.id, ev.name)}
                        disabled={downloadingEventId === ev.id}
                        className="text-xs h-7 px-2 text-[var(--accent)] hover:bg-[var(--accent)]/10"
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

