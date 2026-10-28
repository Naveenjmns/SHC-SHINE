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
    collegeName: string;
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
    totalAmount: number;
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
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-ink">
            Student Registrations &amp; Delegation Approvals
          </h3>
          <p className="text-sm text-ink-muted">
            Batch-approve contingents college-wise or inspect individual delegates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-surface-raised p-0.5 rounded-2xl flex items-center border border-border">
            <button
              type="button"
              onClick={() => setRegViewMode("COLLEGE")}
              className={`px-2.5 py-1 text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                regViewMode === "COLLEGE"
                  ? "bg-surface text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>Colleges ({collegeGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRegViewMode("FLAT")}
              className={`px-2.5 py-1 text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                regViewMode === "FLAT"
                  ? "bg-surface text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-accent" />
              <span>All ({filteredRegistrations.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search delegate, college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm h-8 w-44 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-sm border border-border rounded-[8px] bg-surface text-ink font-medium h-8 outline-none"
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
            <div className="text-center py-10 text-sm text-ink-muted bg-surface-raised rounded-2xl border border-border">
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
        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-raised border-b border-border font-semibold text-ink-muted uppercase">
                <th className="py-2.5 px-3">Delegate</th>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-surface-raised transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-ink block">{reg.user.name}</span>
                    <span className="text-xs text-ink-muted">{reg.user.email}</span>
                  </td>
                  <td className="py-2.5 px-3 text-ink">
                    {reg.delegation?.collegeName || reg.user.collegeName}
                  </td>
                  <td className="py-2.5 px-3 text-ink">{reg.event.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        reg.status === "CONFIRMED"
                          ? "bg-success-surface text-success-ink"
                          : reg.status === "PENDING"
                          ? "bg-warning-surface text-warning-ink"
                          : "bg-danger-surface text-danger-ink"
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
                          className="p-1 text-success-ink hover:bg-success-surface rounded"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {reg.status !== "REJECTED" && (
                        <button
                          onClick={() => onRejectSingle(reg.id)}
                          className="p-1 text-danger-ink hover:bg-danger-surface rounded"
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

