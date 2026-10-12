"use client";

import { useState, useRef } from "react";
import { safeJson } from "@/lib/safeFetch";
import { extractLookupCode } from "@/lib/cameraScanner";
import { ScanPopup } from "../components/FoodScanResultCard";

interface UseFoodClaimsProps {
  autoClaim: boolean;
  playSound: (type: "success" | "warning" | "error") => void;
  onRefreshStats: () => void;
}

export function useFoodClaims({
  autoClaim,
  playSound,
  onRefreshStats,
}: UseFoodClaimsProps) {
  const [processing, setProcessing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [popup, setPopup] = useState<ScanPopup | null>(null);

  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const handleDetectedCode = async (rawCode: string) => {
    const { code: normalizedCode } = extractLookupCode(rawCode);
    const code = (normalizedCode || rawCode).trim();
    if (!code || processing || popup?.status === "eligible") return;

    const now = Date.now();
    if (
      lastScannedCodeRef.current.toUpperCase() === code.toUpperCase() &&
      now - lastScannedTimeRef.current < 3500
    ) {
      return;
    }

    lastScannedCodeRef.current = code;
    lastScannedTimeRef.current = now;
    setProcessing(true);

    try {
      if (autoClaim) {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, action: "FOOD_CLAIM" }),
        });
        const data = await safeJson(res);

        if (res.ok && data.success) {
          playSound("success");
          const m = data.member;
          const pref = data.foodPreference || m?.foodPreference || "VEG";
          setPopup({
            status: "success",
            title: "Meal Token Claimed",
            name: m?.name || "Participant",
            college: m?.collegeName || m?.delegation?.collegeName || "Registered Institution",
            foodPreference: pref,
            tokenCode: m?.foodTokenCode || code,
            badgeCode: m?.badgeCode,
            memberId: m?.id,
            message: data.message || `1x ${pref === "VEG" ? "Vegetarian" : "Non-Vegetarian"} meal approved.`,
          });
          onRefreshStats();
        } else if (data.alreadyClaimed) {
          playSound("warning");
          const m = data.member;
          setPopup({
            status: "already_claimed",
            title: "Meal Already Redeemed",
            name: m?.name || "Participant",
            college: m?.collegeName || m?.delegation?.collegeName || "Registered Institution",
            foodPreference: data.foodPreference || m?.foodPreference || "VEG",
            tokenCode: m?.foodTokenCode || code,
            badgeCode: m?.badgeCode,
            claimedAt: m?.foodClaimedAt,
            claimedBy: m?.foodClaimedBy,
            memberId: m?.id,
            message: data.message || "This meal token was redeemed earlier today.",
          });
        } else {
          playSound("error");
          setPopup({
            status: data.paymentPending ? "unpaid" : "not_found",
            title: data.paymentPending ? "Unpaid Registration" : "Token Not Found",
            name: data.member?.name,
            college: data.member?.collegeName,
            tokenCode: code,
            message: data.message || `No participant found matching "${code}".`,
          });
        }
      } else {
        const res = await fetch(`/api/checkin?code=${encodeURIComponent(code)}&type=FOOD`);
        const data = await safeJson(res);

        if (res.ok && data.success && data.member) {
          const m = data.member;
          if (m.foodTokenClaimed) {
            playSound("warning");
            setPopup({
              status: "already_claimed",
              title: "Meal Already Redeemed",
              name: m.name,
              college: m.collegeName,
              foodPreference: m.foodPreference || "VEG",
              tokenCode: m.foodTokenCode,
              badgeCode: m.badgeCode,
              claimedAt: m.foodClaimedAt,
              claimedBy: m.foodClaimedBy,
              memberId: m.id,
              message: `Redeemed earlier by ${m.foodClaimedBy || "staff"}.`,
            });
          } else if (!m.isPaid) {
            playSound("error");
            setPopup({
              status: "unpaid",
              title: "Payment Pending",
              name: m.name,
              college: m.collegeName,
              tokenCode: m.foodTokenCode,
              message: "Payment pending at registration desk.",
            });
          } else {
            playSound("success");
            setPopup({
              status: "eligible",
              title: "Confirm Meal Issue",
              name: m.name,
              college: m.collegeName,
              foodPreference: m.foodPreference || "VEG",
              tokenCode: m.foodTokenCode,
              badgeCode: m.badgeCode,
              memberId: m.id,
              message: `1x ${m.foodPreference === "NON_VEG" ? "Non-Vegetarian" : "Vegetarian"} meal ready to issue.`,
            });
          }
        } else {
          playSound("error");
          setPopup({
            status: "not_found",
            title: "Delegate Not Found",
            tokenCode: code,
            message: data.message || "Could not find delegate record.",
          });
        }
      }
    } catch (_) {
      playSound("error");
      setPopup({
        status: "error",
        title: "Network Error",
        message: "Failed to communicate with server.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualClaim = async (tokenCode: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tokenCode, action: "FOOD_CLAIM" }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        playSound("success");
        const m = data.member;
        const pref = data.foodPreference || m?.foodPreference || popup?.foodPreference || "VEG";
        setPopup({
          status: "success",
          title: "Meal Token Claimed",
          name: m?.name || popup?.name || "Participant",
          college: m?.collegeName || popup?.college || "Registered Institution",
          foodPreference: pref,
          tokenCode: m?.foodTokenCode || tokenCode,
          badgeCode: m?.badgeCode || popup?.badgeCode,
          memberId: m?.id || popup?.memberId,
          message: data.message || `1x ${pref === "VEG" ? "Vegetarian" : "Non-Vegetarian"} meal issued.`,
        });
        onRefreshStats();
      } else {
        playSound("error");
        setPopup({
          status: "error",
          title: "Claim Failed",
          tokenCode,
          message: data.message || "Failed to record meal claim.",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = (delegateName: string) => {
    playSound("warning");
    setPopup({
      status: "warning",
      title: "Meal Issue Declined",
      name: delegateName,
      message: `Meal distribution for ${delegateName} declined by staff.`,
    });
  };

  const handleUndoClaim = async (code: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action: "FOOD_UNCLAIM" }),
      });
      const data = await safeJson(res);
      if (data.success) {
        playSound("success");
        setPopup({
          status: "success",
          title: "Claim Reset",
          message: data.message || "Food claim reset to unclaimed.",
        });
        onRefreshStats();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchPreference = async (code: string, newPref: "VEG" | "NON_VEG") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          action: "UPDATE_FOOD_PREFERENCE",
          preference: newPref,
        }),
      });
      const data = await safeJson(res);
      if (data.success) {
        playSound("success");
        setPopup((prev) =>
          prev
            ? {
                ...prev,
                foodPreference: newPref,
                message: `Dietary choice changed to ${newPref === "VEG" ? "Vegetarian" : "Non-Vegetarian"}.`,
              }
            : null
        );
        onRefreshStats();
      }
    } finally {
      setActionLoading(false);
    }
  };

  return {
    processing,
    actionLoading,
    popup,
    setPopup,
    handleDetectedCode,
    handleManualClaim,
    handleRejectClaim,
    handleUndoClaim,
    handleSwitchPreference,
  };
}

