"use client";

import React from "react";
import Link from "next/link";
import AppHero, { HeroStat, heroButtonClass, heroGhostButtonClass } from "@/components/layout/AppHero";
import {
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

  const editionLabel = activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "Active fest";
  const approved = stats.totalApprovedStudents ?? stats.confirmedRegistrations;
  const pending = stats.totalPendingStudents ?? stats.pendingRegistrations;

  return (
    <div className="space-y-6">
      <AppHero
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isRegOpen ? "bg-[#34D399] animate-pulse" : "bg-[#F87171]"}`}
            />
            {isRegOpen ? "Registration open" : "Registration closed"} · {editionLabel}
          </span>
        }
        title={isRegOpen ? "Registrations are live" : "Registrations are paused"}
        subtitle={
          isRegOpen
            ? "Delegations can register and receive passes right now."
            : "New sign-ups are frozen. Passes and check-ins keep working."
        }
        actions={
          <>
            <button type="button" onClick={onOpenCheckIn} className={heroButtonClass}>
              <QrCode />
              Check-in hub
            </button>
            <button
              type="button"
              onClick={onToggleRegistration}
              disabled={saving}
              className={`${heroGhostButtonClass} disabled:opacity-60`}
            >
              {isRegOpen ? <Lock /> : <Unlock />}
              {isRegOpen ? "Close registration" : "Reopen registration"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <HeroStat
            label="Revenue"
            value={`₹${displayRevenue.toLocaleString()}`}
            hint={
              stats.pendingRevenue && stats.pendingRevenue > 0
                ? `₹${stats.pendingRevenue.toLocaleString()} pending`
                : "Confirmed payments"
            }
          />
          <HeroStat label="Approved" value={approved} hint="QR passes issued" />
          <HeroStat label="Pending" value={pending} hint="Awaiting verification" />
          <HeroStat
            label="Registrations"
            value={stats.totalRegistrations}
            hint={`${stats.confirmedRegistrations} confirmed`}
          />
          <div className="col-span-2 lg:col-span-1">
            <HeroStat label="Competitions" value={stats.totalEvents} hint="On-stage & off-stage" />
          </div>
        </div>
      </AppHero>

      {/* Competitions breakdown */}
      <section className="bg-surface border border-border rounded-2xl shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Competitions</h2>
            <p className="text-[15px] text-ink-muted">Registrations per event and participant rosters</p>
          </div>
          {eventBreakdown.length > 0 && (
            <Button
              variant="outline"
              onClick={onDownloadAllEventCSVs}
              disabled={downloadingEventId === "ALL"}
              leftIcon={<Download />}
              className="w-full sm:w-auto"
            >
              Download all rosters
            </Button>
          )}
        </div>

        {/* Phones: one card per event */}
        <ul className="md:hidden divide-y divide-border border-t border-border">
          {eventBreakdown.map((ev) => {
            const staffName = ev.staffCoordinatorName || ev.coordinatorName;
            return (
              <li key={ev.id} className="p-5 flex items-start gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-ink">{ev.name}</span>
                    <Badge size="sm" variant={ev.category === "ON_STAGE" ? "accent" : "neutral"}>
                      {ev.category === "ON_STAGE" ? "On-stage" : "Off-stage"}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {staffName && staffName !== "Unassigned" ? staffName : "No coordinator assigned"}
                  </p>
                  <p className="text-sm font-semibold text-ink tabular-nums">
                    {ev.registrationsCount} registered
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDownloadEventCSV(ev.id, ev.name)}
                  disabled={downloadingEventId === ev.id}
                  aria-label={`Download ${ev.name} roster`}
                  className="w-11 h-11 shrink-0 rounded-[10px] border border-border text-accent flex items-center justify-center hover:bg-accent-muted disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Tablet and up: table */}
        <div className="hidden md:block overflow-x-auto border-t border-border">
          <table className="w-full text-left text-[15px] border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-border text-sm font-semibold text-ink-muted">
                <th className="py-3 px-6">Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Coordinators</th>
                <th className="py-3 px-4 text-right">Registered</th>
                <th className="py-3 px-6 text-right">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {eventBreakdown.map((ev) => {
                const staffName = ev.staffCoordinatorName || ev.coordinatorName;
                const studentName = ev.studentCoordinatorName;
                return (
                  <tr key={ev.id} className="hover:bg-canvas transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-ink">{ev.name}</td>
                    <td className="py-3.5 px-4">
                      <Badge size="sm" variant={ev.category === "ON_STAGE" ? "accent" : "neutral"}>
                        {ev.category === "ON_STAGE" ? "On-stage" : "Off-stage"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-ink">
                        {staffName && staffName !== "Unassigned" ? staffName : "Unassigned"}
                      </div>
                      {studentName && <div className="text-sm text-ink-muted">Student: {studentName}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-ink tabular-nums">
                      {ev.registrationsCount}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadEventCSV(ev.id, ev.name)}
                        disabled={downloadingEventId === ev.id}
                        leftIcon={<Download />}
                        className="text-accent hover:bg-accent-muted"
                      >
                        CSV
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick links + danger zone */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <Link
          href="/register"
          target="_blank"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border shadow-card hover:border-accent/40 transition-colors"
        >
          <span className="w-11 h-11 rounded-[12px] bg-accent-muted text-accent flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-ink group-hover:text-accent">
              Preview the public registration page
            </span>
            <span className="block text-sm text-ink-muted">Opens /register in a new tab</span>
          </span>
        </Link>
        <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-danger-border">
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">Danger zone</p>
            <p className="text-sm text-ink-muted">Wipe registration data</p>
          </div>
          <Button
            variant="outline"
            onClick={onOpenResetModal}
            leftIcon={<RotateCcw />}
            className="!text-danger !border-danger-border hover:!bg-danger-surface shrink-0"
          >
            Reset data
          </Button>
        </div>
      </div>
    </div>
  );
}
