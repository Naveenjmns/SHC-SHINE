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
    <div className="bg-surface-raised border border-border rounded-2xl p-4 transition-colors space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-xs text-ink">
            {group.collegeName}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isPaid
                ? "bg-success-surface text-success-ink border-success-border"
                : "bg-warning-surface text-warning-ink border-warning-border"
            }`}
          >
            {isPaid ? `Fee Paid (₹${group.totalFee})` : `Fee Pending (₹${group.totalFee})`}
          </span>
        </div>

        <div className="shrink-0">
          {group.pendingCount === 0 && group.confirmedCount > 0 ? (
            <span className="text-xs font-semibold text-success-ink bg-success-surface border border-success-border px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Approved ({group.confirmedCount})</span>
            </span>
          ) : group.pendingCount > 0 ? (
            <span className="text-xs font-semibold text-warning-ink bg-warning-surface border border-warning-border px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-warning" />
              <span>Pending ({group.pendingCount})</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-danger-ink bg-danger-surface border border-danger-border px-2 py-0.5 rounded-full">
              Rejected
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Lead: <strong className="text-ink">{group.teamLeadName || "Unspecified"}</strong> ({group.teamLeadPhone || "-"})</span>
        {group.staffInchargeName && (
          <span>· Faculty: <strong className="text-ink">{group.staffInchargeName}</strong></span>
        )}
        <span>· {group.uniqueStudentsCount} delegates, {group.registrations.length} events</span>
      </div>

      {/* Actions Toolbar */}
      <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2">
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
              className="h-7 text-xs text-warning-ink"
            >
              <ReceiptIndianRupee className="w-3.5 h-3.5 mr-1" />
              Collect ₹{group.totalFee}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRejectCollege(group)}
            className="h-7 text-xs text-danger hover:bg-danger-surface"
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
        <div className="pt-2 border-t border-border overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border font-semibold text-ink-muted uppercase">
                <th className="py-2 px-2">Delegate</th>
                <th className="py-2 px-2">Event</th>
                <th className="py-2 px-2">Badge Code</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {group.registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-surface transition-colors">
                  <td className="py-2 px-2 font-medium text-ink">
                    <div>{reg.user.name}</div>
                    <div className="text-[11px] text-ink-muted">{reg.user.email}</div>
                  </td>
                  <td className="py-2 px-2 text-ink">{reg.event.name}</td>
                  <td className="py-2 px-2 font-mono text-[11px] text-accent">
                    {reg.delegationMember?.badgeCode || "-"}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
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
                  <td className="py-2 px-2 text-right">
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

