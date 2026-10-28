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
    if (isSuccess) return "border-success-border bg-success-surface";
    if (isEligible) return "border-warning-border bg-warning-surface";
    if (isAlreadyClaimed) return "border-warning-border bg-warning-surface";
    return "border-danger-border bg-danger-surface";
  };

  return (
    <div
      className={`border rounded-2xl shadow-card p-5 relative transition-all ${getStatusColorClass()}`}
      role="region"
      aria-label="Scan Result"
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss scan result"
        className="absolute top-4 right-4 p-1 rounded-[8px] text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        {isSuccess && <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />}
        {isEligible && <AlertCircle className="w-6 h-6 text-warning shrink-0 mt-0.5" />}
        {isAlreadyClaimed && <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />}
        {isError && <XCircle className="w-6 h-6 text-danger shrink-0 mt-0.5" />}

        <div>
          <h3 className="text-base font-semibold text-ink">
            {popup.title}
          </h3>
          <p className="text-sm text-ink-muted mt-0.5 leading-relaxed">
            {popup.message}
          </p>
        </div>
      </div>

      {/* Dietary Badge */}
      {popup.foodPreference && (
        <div className="my-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              popup.foodPreference === "VEG"
                ? "bg-success-surface border-success-border text-success-ink"
                : "bg-warning-surface border-warning-border text-warning-ink"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {popup.foodPreference === "VEG" ? (
                <Leaf className="w-5 h-5 text-success shrink-0" />
              ) : (
                <Utensils className="w-5 h-5 text-warning shrink-0" />
              )}
              <div>
                <span className="text-xs font-semibold opacity-80 block">
                  Catering Choice
                </span>
                <span className="text-base font-bold tracking-tight">
                  {popup.foodPreference === "VEG" ? "VEGETARIAN" : "NON-VEGETARIAN"}
                </span>
              </div>
            </div>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-surface border border-border">
              {popup.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
            </span>
          </div>
        </div>
      )}

      {/* Manual Approve or Reject Action (Auto-Claim is OFF) */}
      {isEligible && popup.tokenCode && (
        <div className="my-3 p-3.5 rounded-xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              Approval Required
            </span>
            <span className="text-xs text-ink-muted">
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
              className="w-full text-danger hover:text-danger-ink"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Delegate Info */}
      {popup.name && (
        <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Delegate:</span>
            <span className="font-semibold text-ink">{popup.name}</span>
          </div>
          {popup.college && (
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Institution:</span>
              <span className="font-medium text-ink text-right truncate max-w-[200px]">
                {popup.college}
              </span>
            </div>
          )}
          {popup.tokenCode && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Token Code:</span>
              <span className="font-mono text-accent font-semibold">{popup.tokenCode}</span>
            </div>
          )}
          {popup.claimedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Previously Issued:</span>
              <span className="font-medium text-ink">
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
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
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
              className="text-danger hover:bg-danger-surface"
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

