"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Leaf,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";

export interface ScanPopup {
  status: "success" | "already_claimed" | "unpaid" | "not_found" | "error" | "warning" | "eligible";
  title: string;
  name?: string;
  college?: string;
  foodPreference?: "VEG" | "NON_VEG";
  tokenCode?: string;
  badgeCode?: string;
  claimedAt?: string;
  claimedBy?: string;
  message: string;
  memberId?: string;
}

interface FoodScanResultCardProps {
  popup: ScanPopup;
  actionLoading: boolean;
  mealOptions?: string;
  onManualClaim: (code: string) => void;
  onRejectClaim: (name: string) => void;
  onUndoClaim: (code: string) => void;
  onSwitchPreference: (code: string, newPref: "VEG" | "NON_VEG") => void;
  onDismiss: () => void;
}

export default function FoodScanResultCard({
  popup,
  actionLoading,
  mealOptions,
  onManualClaim,
  onRejectClaim,
  onUndoClaim,
  onSwitchPreference,
  onDismiss,
}: FoodScanResultCardProps) {
  const isSuccess = popup.status === "success";
  const isEligible = popup.status === "eligible";
  const isAlreadyClaimed = popup.status === "already_claimed";
  const isError = popup.status === "unpaid" || popup.status === "not_found" || popup.status === "error";

  const getStatusColorClass = () => {
    if (isSuccess) return "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20";
    if (isEligible) return "border-amber-400 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20";
    if (isAlreadyClaimed) return "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/15";
    return "border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20";
  };

  return (
    <div
      className={`border rounded-xl p-5 relative transition-all ${getStatusColorClass()}`}
      role="region"
      aria-label="Scan Result"
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss scan result"
        className="absolute top-4 right-4 p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        {isSuccess && <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
        {isEligible && <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
        {isAlreadyClaimed && <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
        {isError && <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}

        <div>
          <h3 className="text-base font-semibold text-[var(--ink)]">
            {popup.title}
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
            {popup.message}
          </p>
        </div>
      </div>

      {/* Dietary Badge */}
      {popup.foodPreference && (
        <div className="my-4">
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between ${
              popup.foodPreference === "VEG"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {popup.foodPreference === "VEG" ? (
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-75 block">
                  Catering Choice
                </span>
                <span className="text-base font-bold tracking-tight">
                  {popup.foodPreference === "VEG" ? "VEGETARIAN" : "NON-VEGETARIAN"}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)]">
              {popup.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
            </span>
          </div>
        </div>
      )}

      {/* Manual Approve or Reject Action (Auto-Claim is OFF) */}
      {isEligible && popup.tokenCode && (
        <div className="my-3 p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink)]">
              Approval Required
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              Auto-claim mode off
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => onManualClaim(popup.tokenCode!)}
              className="w-full"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approve Meal
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={actionLoading}
              onClick={() => onRejectClaim(popup.name || "Participant")}
              className="w-full text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Delegate Info */}
      {popup.name && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-muted)]">Delegate:</span>
            <span className="font-semibold text-[var(--ink)]">{popup.name}</span>
          </div>
          {popup.college && (
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-muted)]">Institution:</span>
              <span className="font-medium text-[var(--ink)] text-right truncate max-w-[200px]">
                {popup.college}
              </span>
            </div>
          )}
          {popup.tokenCode && (
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[var(--ink-muted)]">Token Code:</span>
              <span className="text-[var(--accent)] font-semibold">{popup.tokenCode}</span>
            </div>
          )}
          {popup.claimedAt && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--ink-muted)]">Previously Issued:</span>
              <span className="font-medium text-[var(--ink)]">
                {new Date(popup.claimedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions: Switch Preference or Undo */}
      {popup.tokenCode && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
          {popup.foodPreference && mealOptions !== "VEG_ONLY" && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading}
              onClick={() =>
                onSwitchPreference(
                  popup.tokenCode!,
                  popup.foodPreference === "VEG" ? "NON_VEG" : "VEG"
                )
              }
            >
              Switch to {popup.foodPreference === "VEG" ? "Non-Veg" : "Veg"}
            </Button>
          )}

          {isAlreadyClaimed && (
            <Button
              variant="ghost"
              size="sm"
              loading={actionLoading}
              onClick={() => onUndoClaim(popup.tokenCode!)}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Undo Claim
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

