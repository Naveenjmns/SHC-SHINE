"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  ChevronDown,
  ReceiptIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { CollegeGroup } from "./AdminRegistrationsTab";

interface AdminCollegeDelegationCardProps {
  group: CollegeGroup;
  onApproveSingle: (id: string) => void;
  onRejectSingle: (id: string) => void;
  onApproveCollege: (group: CollegeGroup) => void;
  onRejectCollege: (group: CollegeGroup) => void;
  onCollectPayment: (delegationId: string, name: string, fee: number) => void;
}

export default function AdminCollegeDelegationCard({
  group,
  onApproveSingle,
  onRejectSingle,
  onApproveCollege,
  onRejectCollege,
  onCollectPayment,
}: AdminCollegeDelegationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPaid = group.paymentStatus === "PAID" || group.paymentStatus === "VERIFIED";

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 transition-colors space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-xs text-[var(--ink)]">
            {group.collegeName}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isPaid
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            }`}
          >
            {isPaid ? `Fee Paid (₹${group.totalFee})` : `Fee Pending (₹${group.totalFee})`}
          </span>
        </div>

        <div className="shrink-0">
          {group.pendingCount === 0 && group.confirmedCount > 0 ? (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Approved ({group.confirmedCount})</span>
            </span>
          ) : group.pendingCount > 0 ? (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pending ({group.pendingCount})</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-md">
              Rejected
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Lead: <strong className="text-[var(--ink)]">{group.teamLeadName || "Unspecified"}</strong> ({group.teamLeadPhone || "-"})</span>
        {group.staffInchargeName && (
          <span>· Faculty: <strong className="text-[var(--ink)]">{group.staffInchargeName}</strong></span>
        )}
        <span>· {group.uniqueStudentsCount} delegates, {group.registrations.length} events</span>
      </div>

      {/* Actions Toolbar */}
      <div className="pt-2.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {group.pendingCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApproveCollege(group)}
              className="h-7 text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Approve College ({group.uniqueStudentsCount})
            </Button>
          )}

          {group.delegationId && !isPaid && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onCollectPayment(
                  group.delegationId!,
                  group.teamLeadName || group.collegeName,
                  group.totalFee
                )
              }
              className="h-7 text-xs text-amber-800 dark:text-amber-200"
            >
              <ReceiptIndianRupee className="w-3.5 h-3.5 mr-1" />
              Collect ₹{group.totalFee}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRejectCollege(group)}
            className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Reject college"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-7 text-xs"
        >
          <span>{isExpanded ? "Hide Roster" : `Roster (${group.registrations.length})`}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {/* Collapsible Roster Table */}
      {isExpanded && (
        <div className="pt-2 border-t border-[var(--border)] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] font-semibold text-[var(--ink-muted)] uppercase">
                <th className="py-2 px-2">Delegate</th>
                <th className="py-2 px-2">Event</th>
                <th className="py-2 px-2">Badge Code</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {group.registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2 px-2 font-medium text-[var(--ink)]">
                    <div>{reg.user.name}</div>
                    <div className="text-[11px] text-[var(--ink-muted)]">{reg.user.email}</div>
                  </td>
                  <td className="py-2 px-2 text-[var(--ink)]">{reg.event.name}</td>
                  <td className="py-2 px-2 font-mono text-[11px] text-[var(--accent)]">
                    {reg.delegationMember?.badgeCode || "-"}
                  </td>
                  <td className="py-2 px-2">
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
                  <td className="py-2 px-2 text-right">
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

