"use client";

import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  Utensils,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

interface RegistrationDetail {
  registrationId: string;
  eventId: string;
  eventName: string;
  category: string;
  venue: string | null;
  dateTime: string;
  status: string;
  score: number | null;
  result: string | null;
  attended: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  canCheckIn?: boolean;
}

interface MemberLookupData {
  id: string;
  name: string;
  email: string;
  phone: string;
  badgeCode: string;
  foodTokenCode: string;
  eventCheckedIn: boolean;
  eventCheckedInAt: string | null;
  eventCheckedInBy: string | null;
  allEventsAttended?: boolean;
  foodTokenClaimed: boolean;
  foodClaimedAt: string | null;
  foodClaimedBy: string | null;
  collegeName: string;
  department: string | null;
  teamName: string | null;
  teamLeadName: string;
  teamLeadPhone: string;
  staffInchargeName: string | null;
  staffInchargePhone: string | null;
  totalFee: number;
  paymentStatus: string;
  isPaid: boolean;
  registrations: RegistrationDetail[];
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEventId?: string; // Optional: if coordinator is in a specific event page
  onCheckInComplete?: () => void;
}

export default function CheckInModal({
  isOpen,
  onClose,
  activeEventId,
  onCheckInComplete,
}: CheckInModalProps) {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [delegate, setDelegate] = useState<MemberLookupData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef<any>(null);
  const scannerDivId = "reader-camera-stream";

  // Stop camera when closing modal or unmounting
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setDelegate(null);
      setMessage(null);
      setInputCode("");
    }
  }, [isOpen]);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.log("Scanner stop ignored:", err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const startCameraScanner = async () => {
    try {
      setMessage(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      setScanMode("camera");
      setCameraActive(true);

      // Slight timeout to allow DOM element to render
      setTimeout(async () => {
        try {
          if (scannerRef.current) {
            await stopCameraScanner();
          }

          const html5QrCode = new Html5Qrcode(scannerDivId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string) => {
              // Successfully decoded QR code
              console.log("QR Decoded successfully:", decodedText);
              handleLookup(decodedText);
              stopCameraScanner();
            },
            () => {
              // Ignore scan failures per frame
            }
          );
        } catch (err: any) {
          console.error("Camera start inner error:", err);
          setMessage({
            type: "warning",
            text: "Camera unavailable or permission denied. Please enter the unique code manually below.",
          });
          setScanMode("manual");
          setCameraActive(false);
        }
      }, 200);
    } catch (err: any) {
      console.error("Camera load error:", err);
      setMessage({
        type: "warning",
        text: "Camera scanner could not initialize. Please use manual code lookup.",
      });
      setScanMode("manual");
      setCameraActive(false);
    }
  };

  const handleLookup = async (codeToSearch?: string) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) {
      setMessage({ type: "warning", text: "Please enter or scan a code." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/checkin?code=${encodeURIComponent(code)}`);
      const data = await safeJson(res, { success: false });

      if (data.success && data.member) {
        setDelegate(data.member);
        setMessage({
          type: "success",
          text: `Found participant: ${data.member.name} (${data.member.collegeName})`,
        });
      } else {
        setDelegate(null);
        setMessage({
          type: "error",
          text: data.message || `No participant delegate found for code "${code}".`,
        });
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      setMessage({ type: "error", text: "Failed to connect to verification server." });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInEvent = async (shouldCheckIn: boolean, targetEventId?: string) => {
    if (!delegate) return;
    const evId = targetEventId || activeEventId;
    if (!evId && shouldCheckIn) {
      setMessage({ type: "warning", text: "Please select which event you are checking this student in for." });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: delegate.badgeCode,
          action: shouldCheckIn ? "EVENT_CHECKIN" : "EVENT_UNCHECK",
          eventId: evId,
        }),
      });
      const data = await safeJson(res, { success: false });

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || (shouldCheckIn ? `✓ ${delegate.name} marked Present!` : `Check-in reverted.`),
        });
        // Refresh delegate data
        await handleLookup(delegate.badgeCode);
        if (onCheckInComplete) onCheckInComplete();
      } else {
        setMessage({
          type: data.alreadyCheckedIn || data.paymentPending ? "warning" : "error",
          text: data.message || "Failed to update event check-in.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimFood = async (shouldClaim: boolean) => {
    if (!delegate) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: delegate.foodTokenCode,
          action: shouldClaim ? "FOOD_CLAIM" : "FOOD_UNCLAIM",
        }),
      });
      const data = await safeJson(res, { success: false });

      if (data.success) {
        setMessage({
          type: "success",
          text: shouldClaim
            ? `🍱 Food Token verified! 1x Meal issued to ${delegate.name}.`
            : `Food token status reset to Unclaimed.`,
        });
        await handleLookup(delegate.badgeCode);
        if (onCheckInComplete) onCheckInComplete();
      } else {
        setMessage({
          type: data.alreadyClaimed || data.paymentPending ? "warning" : "error",
          text: data.message || "Failed to process food token.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForNext = () => {
    setDelegate(null);
    setInputCode("");
    setMessage(null);
    if (scanMode === "camera") {
      startCameraScanner();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-5 sm:p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                <span>QR Check-In & Food Claim Hub</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  LIVE VERIFIER
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Scan or enter student delegate badge / meal QR codes to confirm attendance and issue food
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tap-target p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-2 p-1 bg-stone-100 rounded-2xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                stopCameraScanner();
                setScanMode("manual");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scanMode === "manual"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual Code Lookup</span>
            </button>

            <button
              type="button"
              onClick={startCameraScanner}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scanMode === "camera"
                  ? "bg-[#1C1917] text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Camera QR Scanner</span>
            </button>
          </div>

          {/* Scanner / Input Area */}
          {scanMode === "camera" ? (
            <div className="bg-stone-900 rounded-2xl p-4 text-center text-white space-y-3">
              <div
                id={scannerDivId}
                className="w-full max-w-xs mx-auto overflow-hidden rounded-xl border-2 border-amber-400"
              />
              <p className="text-xs text-stone-300">
                Point your mobile or webcam at the participant&apos;s <strong>Event Entry QR</strong> or <strong>Food Token QR</strong>
              </p>
              <button
                type="button"
                onClick={stopCameraScanner}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Switch to Manual Code Entry
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex gap-2 max-w-md mx-auto"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. SHN27-DEL-XXXX or FT-XXXX-MEAL"
                  className="w-full pl-9 pr-4 py-2.5 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                  autoFocus
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-ember px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Lookup</span>
                    <Search className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Status / Alert Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
                message.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : message.type === "warning"
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Delegate Verification Card */}
          {delegate && (
            <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-5 space-y-5 animate-in fade-in duration-200">
              {/* Desk Payment Warning Banner */}
              {!delegate.isPaid && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-rose-900">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                      Payment & Approval Pending at Registration Desk
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Fee: <strong>₹{delegate.totalFee}</strong> (Status: {delegate.paymentStatus}). The delegate must pay the amount at the Registration Desk and be marked Approved before venue check-in or food distribution.
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-stone-900">{delegate.name}</h3>
                    <span className="font-mono text-xs font-bold bg-white text-stone-800 px-2.5 py-0.5 rounded-md border border-stone-300 shadow-2xs">
                      {delegate.badgeCode}
                    </span>
                    {delegate.isPaid ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        PAID & APPROVED ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                        PAYMENT PENDING
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-stone-900">
                      <GraduationCap className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      <span>{delegate.collegeName}</span>
                    </span>
                    {delegate.teamName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Contingent: <strong>{delegate.teamName}</strong></span>
                      </span>
                    )}
                    <span>• {delegate.phone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForNext}
                  className="tap-target px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition self-start sm:self-auto flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-stone-500" />
                  <span>Scan Next</span>
                </button>
              </div>

              {/* 1. Scoped Multi-Event Attendance Hub */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Registered Competitions ({delegate.registrations.length})</span>
                  </span>
                  {delegate.allEventsAttended ? (
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      ALL EVENTS ATTENDED ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      QR Valid for remaining events
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {delegate.registrations.map((reg) => {
                    const isCurrentActive = activeEventId && activeEventId === reg.eventId;
                    return (
                      <div
                        key={reg.registrationId}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          reg.attended
                            ? "bg-emerald-50/60 border-emerald-200"
                            : isCurrentActive
                            ? "bg-amber-50/50 border-amber-300 ring-1 ring-amber-300"
                            : "bg-stone-50/60 border-stone-200"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">{reg.eventName}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                              {reg.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                            </span>
                            {isCurrentActive && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                Current Desk
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {reg.venue && <span>Venue: <b>{reg.venue}</b> • </span>}
                            <span>Scheduled: {reg.dateTime ? new Date(reg.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "TBD"}</span>
                          </div>
                        </div>

                        {/* Event Check-In Actions per Event */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {reg.attended ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Present
                                {reg.checkedInAt && (
                                  <span className="font-normal text-[9px] text-emerald-700 ml-1">
                                    {new Date(reg.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </span>

                              {reg.canCheckIn && (
                                <button
                                  type="button"
                                  onClick={() => handleCheckInEvent(false, reg.eventId)}
                                  disabled={actionLoading}
                                  className="text-[10px] text-stone-400 hover:text-rose-600 underline font-medium cursor-pointer"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          ) : !delegate.isPaid ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              Payment Required
                            </span>
                          ) : reg.canCheckIn ? (
                            <button
                              type="button"
                              onClick={() => handleCheckInEvent(true, reg.eventId)}
                              disabled={actionLoading}
                              className="tap-target px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mark Present</span>
                            </button>
                          ) : (
                            <span
                              className="text-[10px] font-medium text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg cursor-not-allowed"
                              title="Only assigned coordinator for this specific competition can mark attendance."
                            >
                              Other Coordinator Event
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Food Token Voucher Claim Card */}
              <div
                className={`p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  delegate.foodTokenClaimed
                    ? "bg-stone-100/90 border-stone-300"
                    : "bg-amber-50/70 border-amber-300"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-700" />
                      <span>Meal & Food Voucher</span>
                    </span>
                    {delegate.foodTokenClaimed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-700 text-white">
                        CLAIMED ✓
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-2xs">
                        READY (1x MEAL)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600">
                    Token: <strong className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">{delegate.foodTokenCode}</strong>
                    {delegate.foodTokenClaimed ? (
                      <span className="ml-2 text-stone-700 font-medium">
                        (Issued at {delegate.foodClaimedAt ? new Date(delegate.foodClaimedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "earlier"} by {delegate.foodClaimedBy || "staff"})
                      </span>
                    ) : (
                      <span className="ml-2 text-stone-500">Valid for 1 lunch/refreshment packet</span>
                    )}
                  </p>
                </div>

                <div className="self-end sm:self-auto shrink-0 flex items-center gap-2">
                  {delegate.foodTokenClaimed ? (
                    <button
                      type="button"
                      onClick={() => handleClaimFood(false)}
                      disabled={actionLoading}
                      className="text-[11px] text-stone-500 hover:text-amber-700 underline font-medium cursor-pointer"
                    >
                      Reset Token
                    </button>
                  ) : !delegate.isPaid ? (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                      Payment Required
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleClaimFood(true)}
                      disabled={actionLoading}
                      className="tap-target px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 text-stone-950" />
                      <span>Issue Food (1x)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Accepts both Event QR & Food QR codes</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
