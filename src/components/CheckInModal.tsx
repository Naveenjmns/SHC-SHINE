"use client";

import React, { useState } from "react";
import { Modal, Input, Button, Badge } from "@/components/ui";
import { Search, Camera, QrCode, AlertCircle, RefreshCw } from "lucide-react";
import CheckInScannerModal from "./checkin/CheckInScannerModal";
import CheckInSearchResultCard, { LookupMember } from "./checkin/CheckInSearchResultCard";
import { safeJson } from "@/lib/safeFetch";
import { useToast } from "@/components/ToastProvider";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
  onCheckInComplete?: () => void | Promise<void>;
  mode?: string;
}

export default function CheckInModal({
  isOpen,
  onClose,
  defaultEventId,
  onCheckInComplete,
  mode,
}: CheckInModalProps) {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [memberResult, setMemberResult] = useState<LookupMember | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLookup = async (code: string) => {
    if (!code.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/checkin?code=${encodeURIComponent(code.trim())}`);
      const data = await safeJson(res, { success: false, member: null });

      if (!res.ok || !data.success || !data.member) {
        setSearchError(data.message || "No delegate matching this badge code or query found");
        setMemberResult(null);
        return;
      }

      setMemberResult(data.member);
    } catch (err: any) {
      setSearchError(err.message || "Failed to lookup participant");
      setMemberResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleEventCheckIn = async (registrationId: string, currentAttended: boolean) => {
    const registration = memberResult?.registrations.find((r) => r.registrationId === registrationId);
    if (!memberResult || !registration) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: memberResult.badgeCode,
          action: currentAttended ? "EVENT_UNCHECK" : "EVENT_CHECKIN",
          eventId: registration.eventId,
        }),
      });

      const data = await safeJson(res, { success: false });
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update attendance");
      }

      toast.success(
        !currentAttended ? "Delegate marked as checked-in" : "Check-in undone",
        "Attendance Updated"
      );

      onCheckInComplete?.();

      // Refresh member lookup
      if (memberResult) {
        handleLookup(memberResult.badgeCode);
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed", "Check-in Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimFood = async () => {
    if (!memberResult) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: memberResult.foodTokenCode, action: "FOOD_CLAIM" }),
      });

      const data = await safeJson(res, { success: false });
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to claim meal token");
      }

      toast.success("Meal token claimed successfully", "Meal Distributed");
      onCheckInComplete?.();

      if (memberResult) {
        handleLookup(memberResult.badgeCode);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to claim meal", "Meal Claim Error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Delegate Check-In Desk"
        description="Fast lookup by badge code, meal token code, or camera QR scan"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Lookup Input Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter badge code or meal token code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup(searchQuery)}
                startIcon={<Search className="w-4 h-4 text-ink-subtle" />}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleLookup(searchQuery)}
              isLoading={isSearching}
            >
              Search
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setScannerOpen(true)}
              leftIcon={<Camera className="w-4 h-4 text-accent" />}
              title="Open QR Scanner"
            >
              Scan
            </Button>
          </div>

          {searchError && (
            <div className="p-4 rounded-2xl bg-danger-surface border border-danger-border text-[15px] text-danger-ink flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div>{searchError}</div>
            </div>
          )}

          {/* Result Card */}
          {memberResult && (
            <CheckInSearchResultCard
              member={memberResult}
              onToggleEventCheckIn={handleToggleEventCheckIn}
              onClaimFood={handleClaimFood}
              isProcessing={isProcessing}
            />
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Desk
            </Button>
          </div>
        </div>
      </Modal>

      {/* Camera QR Scanner Modal */}
      <CheckInScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          setSearchQuery(decodedText);
          handleLookup(decodedText);
        }}
      />
    </>
  );
}
