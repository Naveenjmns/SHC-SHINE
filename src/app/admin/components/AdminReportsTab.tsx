"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Download,
  RefreshCw,
  Building2,
  Users,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui";

interface AdminReportsTabProps {
  reportsData: any;
  loadingReports: boolean;
  onRefreshReports: () => Promise<void>;
}

export default function AdminReportsTab({
  reportsData,
  loadingReports,
  onRefreshReports,
}: AdminReportsTabProps) {
  const summary = reportsData?.summary;

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMasterRoster = () => {
    if (!reportsData?.masterStudentRoster) return;
    const headers = [
      "S.No",
      "Student Name",
      "Email",
      "Phone",
      "College",
      "Department",
      "Team Lead",
      "Badge Code",
      "Attendance",
      "Events",
    ];
    const rows = reportsData.masterStudentRoster.map((s: any, idx: number) => [
      idx + 1,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${s.college.replace(/"/g, '""')}"`,
      `"${(s.department || "").replace(/"/g, '""')}"`,
      s.isTeamLead ? "YES" : "NO",
      `"${s.badgeCode || "-"}"`,
      s.attended ? "PRESENT" : "ABSENT",
      `"${s.events.map((e: any) => e.eventName).join("; ")}"`,
    ]);
    downloadCsv(
      `${summary?.festName || "SHINE"}_Master_Roster.csv`,
      headers,
      rows
    );
  };

  const handleDownloadCollegesSummary = () => {
    if (!reportsData?.collegesSummary) return;
    const headers = [
      "S.No",
      "College Name",
      "Team Lead",
      "Phone",
      "Total Participants",
      "Attended Count",
      "Payment Status",
      "Total Fee",
    ];
    const rows = reportsData.collegesSummary.map((c: any, idx: number) => [
      idx + 1,
      `"${c.collegeName.replace(/"/g, '""')}"`,
      `"${(c.teamLeadName || "").replace(/"/g, '""')}"`,
      `"${c.teamLeadPhone || ""}"`,
      c.totalStudents,
      c.attendedStudents,
      c.paymentStatus,
      c.totalAmount,
    ]);
    downloadCsv(
      `${summary?.festName || "SHINE"}_Colleges_Summary.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Institutional Governance &amp; Reports
            </span>
            <span className="text-xs text-[var(--accent)] font-medium">
              Academic &amp; IQAC Records
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
            {summary?.festName || "SHINE"} {summary?.festEdition || "2026"} — Official Report Hub
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            {summary?.institutionName || "College Campus"} · {summary?.hostDepartment || "Department"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshReports}
            loading={loadingReports}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Data
          </Button>

          <Link href="/admin/reports" target="_blank">
            <Button variant="primary" size="sm" className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Printable PDF Report ↗
            </Button>
          </Link>
        </div>
      </div>

      {loadingReports && !reportsData ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-xs text-[var(--ink-muted)]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--accent)] mb-2" />
          <span>Generating dataset reports...</span>
        </div>
      ) : reportsData ? (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Colleges
              </span>
              <div className="text-2xl font-bold text-[var(--ink)] tabular-nums mt-1">
                {summary.totalCollegesCount}
              </div>
              <span className="text-[11px] text-[var(--ink-muted)]">Institutions Represented</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Delegates
              </span>
              <div className="text-2xl font-bold text-[var(--ink)] tabular-nums mt-1">
                {summary.totalUniqueStudentsCount}
              </div>
              <span className="text-[11px] text-[var(--ink-muted)]">Registered Students</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Gate Check-In
              </span>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                {summary.attendedStudentsCount}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {summary.attendancePercentage}% Check-in Rate
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Events
              </span>
              <div className="text-2xl font-bold text-[var(--ink)] tabular-nums mt-1">
                {summary.totalEvents}
              </div>
              <span className="text-[11px] text-[var(--ink-muted)]">
                {summary.onStageEventsCount} On-Stage · {summary.offStageEventsCount} Off-Stage
              </span>
            </div>
          </div>

          {/* Dataset CSV Downloads */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] pb-2 border-b border-[var(--border)] flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent)]" />
              <span>Official Dataset CSV Downloads</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    Master Participant Roster
                  </span>
                  <span className="text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink-muted)]">
                    {reportsData.masterStudentRoster?.length || 0} delegates
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Complete directory with colleges, departments, contacts, and check-in statuses.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMasterRoster}
                  className="w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Master Roster CSV
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    College Delegations Summary
                  </span>
                  <span className="text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink-muted)]">
                    {reportsData.collegesSummary?.length || 0} colleges
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Contingent summary with institution leads, fee status, and attendance rates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCollegesSummary}
                  className="w-full text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Colleges Summary CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

