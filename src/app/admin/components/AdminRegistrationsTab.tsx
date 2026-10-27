"use client";

import React, { useState } from "react";
import { Building2, ListFilter, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui";
import AdminCollegeDelegationCard from "./AdminCollegeDelegationCard";

export interface RegistrationRecord {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result: string | null;
  createdAt: string;
  attended?: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    college: string | null;
    regNo: string;
  };
  event: {
    id: string;
    name: string;
    category: "ON_STAGE" | "OFF_STAGE";
    fee: number;
    venue: string | null;
  };
  delegation?: {
    id: string;
    collegeName: string;
    teamName: string | null;
    teamLeadName: string;
    teamLeadPhone: string;
    staffInchargeName: string | null;
    paymentStatus: string;
    totalFee: number;
  } | null;
  delegationMember?: {
    id: string;
    badgeCode: string;
    foodTokenCode: string;
    foodPreference: "VEG" | "NON_VEG";
    eventCheckedIn: boolean;
    foodTokenClaimed: boolean;
  } | null;
}

export interface CollegeGroup {
  key: string;
  collegeName: string;
  teamName?: string;
  teamLeadName?: string;
  teamLeadPhone?: string;
  staffInchargeName?: string;
  delegationId?: string;
  paymentStatus?: string;
  totalFee: number;
  registrations: RegistrationRecord[];
  pendingCount: number;
  confirmedCount: number;
  rejectedCount: number;
  uniqueStudentsCount: number;
}

interface AdminRegistrationsTabProps {
  registrations: RegistrationRecord[];
  collegeGroups: CollegeGroup[];
  filteredRegistrations: RegistrationRecord[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  onApproveSingle: (id: string) => void;
  onRejectSingle: (id: string) => void;
  onApproveCollege: (group: CollegeGroup) => void;
  onRejectCollege: (group: CollegeGroup) => void;
  onCollectPayment: (delegationId: string, name: string, fee: number) => void;
}

export default function AdminRegistrationsTab({
  registrations,
  collegeGroups,
  filteredRegistrations,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onApproveSingle,
  onRejectSingle,
  onApproveCollege,
  onRejectCollege,
  onCollectPayment,
}: AdminRegistrationsTabProps) {
  const [regViewMode, setRegViewMode] = useState<"COLLEGE" | "FLAT">("COLLEGE");

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)]">
            Student Registrations &amp; Delegation Approvals
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Batch-approve contingents college-wise or inspect individual delegates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[var(--surface-raised)] p-0.5 rounded-lg flex items-center border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setRegViewMode("COLLEGE")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                regViewMode === "COLLEGE"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Colleges ({collegeGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRegViewMode("FLAT")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                regViewMode === "FLAT"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>All ({filteredRegistrations.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search delegate, college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-8 w-44 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] font-medium h-8 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: COLLEGE-WISE CARDS */}
      {regViewMode === "COLLEGE" && (
        <div className="space-y-3">
          {collegeGroups.length === 0 ? (
            <div className="text-center py-10 text-xs text-[var(--ink-muted)] bg-[var(--surface-raised)] rounded-lg border border-[var(--border)]">
              No college registrations match your filter criteria.
            </div>
          ) : (
            collegeGroups.map((group) => (
              <AdminCollegeDelegationCard
                key={group.key}
                group={group}
                onApproveSingle={onApproveSingle}
                onRejectSingle={onRejectSingle}
                onApproveCollege={onApproveCollege}
                onRejectCollege={onRejectCollege}
                onCollectPayment={onCollectPayment}
              />
            ))
          )}
        </div>
      )}

      {/* VIEW MODE 2: FLAT TABLE */}
      {regViewMode === "FLAT" && (
        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)] font-semibold text-[var(--ink-muted)] uppercase">
                <th className="py-2.5 px-3">Delegate</th>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[var(--ink)] block">{reg.user.name}</span>
                    <span className="text-[11px] text-[var(--ink-muted)]">{reg.user.email}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--ink)]">
                    {reg.delegation?.collegeName || reg.user.college || "Individual"}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--ink)]">{reg.event.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        reg.status === "CONFIRMED"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : reg.status === "PENDING"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {reg.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {reg.status !== "CONFIRMED" && (
                        <button
                          onClick={() => onApproveSingle(reg.id)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {reg.status !== "REJECTED" && (
                        <button
                          onClick={() => onRejectSingle(reg.id)}
                          className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

