"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Utensils,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  RefreshCw,
  LogOut,
  Users,
  ShieldCheck,
  Building2,
  Phone,
  Flame,
  Leaf,
  Check,
  History,
  X,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";
import {
  parseCameraError,
  getAvailableCameras,
  CameraErrorInfo,
  CameraDeviceInfo,
} from "@/lib/cameraScanner";

interface FoodStats {
  totalEligible: number;
  totalClaimed: number;
  totalRemaining: number;
  claimPercentage: number;
  veg: {
    requested: number;
    claimed: number;
    remaining: number;
  };
  nonVeg: {
    requested: number;
    claimed: number;
    remaining: number;
  };
}

interface RecentClaim {
  id: string;
  name: string;
  collegeName: string;
  foodPreference: "VEG" | "NON_VEG";
  foodClaimedAt: string | null;
  foodClaimedBy: string | null;
  foodTokenCode: string;
  badgeCode: string;
}

interface ScanPopup {
  status: "success" | "already_claimed" | "unpaid" | "not_found" | "error" | "warning";
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
  delegateName?: string;
  regNo?: string;
  collegeName?: string;
  code?: string;
}

export default function FoodCoordinatorPage() {
  const { data: session, status } = useSession();

  // State
  const [stats, setStats] = useState<FoodStats | null>(null);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoClaim, setAutoClaim] = useState(true); // Default to fast auto-claim for rush hours
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Popup Modal / Toast state for quick scan review
  const [popup, setPopup] = useState<ScanPopup | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce lock for continuous scanning to avoid rapid re-scans of the same code
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);
  const scannerRef = useRef<any>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scannerDivId = "food-qr-reader";

  // Synthesize Web Audio API tones
  const playSound = useCallback(
    (type: "success" | "warning" | "error") => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "success") {
          // Cheerful chime: D5 (587) -> A5 (880)
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } else if (type === "warning") {
          // Warning dual tone: 320 -> 220
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.22);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        } else {
          // Low buzzer
          osc.type = "square";
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.28);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {
        // AudioContext policy
      }
    },
    [soundEnabled]
  );

  // Fetch stats and claims
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/food/stats");
      const data = await safeJson(res);
      if (data.success) {
        setStats(data.stats);
        setRecentClaims(data.recentClaims || []);
      }
    } catch (err) {
      console.error("Failed to load food stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
      const interval = setInterval(fetchStats, 12000);
      return () => clearInterval(interval);
    }
  }, [status, fetchStats]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.log("Scanner cleanup notice:", err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setCameraStarting(false);
  };

  const startScanner = async (specificCameraId?: string) => {
    try {
      setCameraError(null);
      setCameraStarting(true);
      const { Html5Qrcode } = await import("html5-qrcode");

      setTimeout(async () => {
        try {
          if (scannerRef.current) {
            await stopScanner();
          }

          const qr = new Html5Qrcode(scannerDivId);
          scannerRef.current = qr;

          // Enumerate devices for camera switching & fallback
          const cameras = await getAvailableCameras(Html5Qrcode);
          setAvailableCameras(cameras);

          let targetConfig: any = { facingMode: "environment" };

          const camIdToUse = specificCameraId || selectedCameraId;
          if (camIdToUse && cameras.some((c) => c.id === camIdToUse)) {
            targetConfig = camIdToUse;
          } else if (cameras.length > 0) {
            const backCam = cameras.find((c) => c.isBackCamera);
            const chosen = backCam || cameras[0];
            targetConfig = chosen.id;
            setSelectedCameraId(chosen.id);
          }

          const config = {
            fps: 12,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          };

          const onScanSuccess = (decodedText: string) => {
            handleDetectedCode(decodedText);
          };

          try {
            await qr.start(targetConfig, config, onScanSuccess, () => {});
          } catch (primaryErr: any) {
            console.warn("Primary camera start failed in food portal, attempting user camera fallback:", primaryErr);
            const isPermDenied =
              primaryErr?.name === "NotAllowedError" ||
              primaryErr?.name === "PermissionDeniedError" ||
              /permission denied/i.test(primaryErr?.message || "");

            if (!isPermDenied) {
              await qr.start({ facingMode: "user" }, config, onScanSuccess, () => {});
            } else {
              throw primaryErr;
            }
          }

          setCameraActive(true);
          setCameraError(null);
        } catch (err: any) {
          console.error("Camera start failed:", err);
          const parsed = parseCameraError(err);
          setCameraError(parsed);
          setCameraActive(false);
        } finally {
          setCameraStarting(false);
        }
      }, 150);
    } catch (err: any) {
      console.error("Html5Qrcode import failed:", err);
      const parsed = parseCameraError(err);
      setCameraError(parsed);
      setCameraActive(false);
      setCameraStarting(false);
    }
  };

  const switchScannerCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    await startScanner(nextCam.id);
  };

  // Process code (from camera or manual input)
  const handleDetectedCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || processing) return;

    // Throttle duplicate scans within 3.5 seconds
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
        // Fast Continuous Auto-Claim: Claim meal in 1 shot!
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, action: "FOOD_CLAIM" }),
        });

        const data = await safeJson(res);

        if (res.ok && data.success) {
          // SUCCESS CLAIM
          playSound("success");
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
          }

          const member = data.member;
          const pref = data.foodPreference || member?.foodPreference || "VEG";

          setPopup({
            status: "success",
            title: "Meal Token Claimed!",
            name: member?.name || "Participant",
            college: member?.collegeName || member?.delegation?.collegeName || "Registered Contingent",
            foodPreference: pref,
            tokenCode: member?.foodTokenCode || code,
            badgeCode: member?.badgeCode,
            memberId: member?.id,
            message: data.message || `1x ${pref === "VEG" ? "Vegetarian" : "Non-Vegetarian"} meal approved.`,
          });

          fetchStats();
        } else if (data.alreadyClaimed) {
          // ALREADY CLAIMED
          playSound("warning");
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(250);
          }

          const member = data.member;
          setPopup({
            status: "already_claimed",
            title: "Meal Already Redeemed!",
            name: member?.name || "Participant",
            college: member?.collegeName || member?.delegation?.collegeName || "Registered Contingent",
            foodPreference: data.foodPreference || member?.foodPreference || "VEG",
            tokenCode: member?.foodTokenCode || code,
            badgeCode: member?.badgeCode,
            claimedAt: member?.foodClaimedAt,
            claimedBy: member?.foodClaimedBy,
            memberId: member?.id,
            message: data.message || "This food token has already been served earlier today.",
          });
        } else if (data.paymentPending) {
          // UNPAID CONTINGENT
          playSound("error");
          setPopup({
            status: "unpaid",
            title: "Unpaid Registration",
            name: data.member?.name,
            college: data.member?.collegeName,
            tokenCode: code,
            message: data.message || "Contingent has not paid registration fee. Direct to Registration Desk.",
          });
        } else if (res.status === 404) {
          playSound("error");
          setPopup({
            status: "not_found",
            title: "Token Not Found",
            tokenCode: code,
            message: `No participant or token matches "${code}". Please verify code with participant.`,
          });
        } else {
          playSound("error");
          setPopup({
            status: "error",
            title: "Verification Failed",
            tokenCode: code,
            message: data.message || "Unable to claim food token.",
          });
        }
      } else {
        // Manual Inspection Mode: Lookup first, then let coordinator click confirm
        const res = await fetch(`/api/checkin?code=${encodeURIComponent(code)}`);
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
              message: "Direct delegate to Registration Desk before issuing meal.",
            });
          } else {
            playSound("success");
            setPopup({
              status: "success",
              title: "Eligible for Meal",
              name: m.name,
              college: m.collegeName,
              foodPreference: m.foodPreference || "VEG",
              tokenCode: m.foodTokenCode,
              badgeCode: m.badgeCode,
              memberId: m.id,
              message: "Ready to issue. Click Claim Meal below to record.",
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
    } catch (err: any) {
      console.error("Scan processing error:", err);
      playSound("error");
      setPopup({
        status: "error",
        title: "Network Error",
        message: "Failed to connect to server. Please check your internet connection.",
      });
    } finally {
      setProcessing(false);
      setInputCode("");
    }
  };

  // Revert / Undo a claim
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
          message: data.message || "Food claim successfully reset to unclaimed.",
        });
        fetchStats();
      } else {
        alert(data.message || "Failed to reset claim.");
      }
    } catch (err) {
      alert("Network error while resetting claim.");
    } finally {
      setActionLoading(false);
    }
  };

  // Switch Dietary Preference on the spot
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
                message: `Dietary preference changed to ${newPref === "VEG" ? "Vegetarian" : "Non-Vegetarian"}.`,
              }
            : null
        );
        fetchStats();
      } else {
        alert(data.message || "Failed to update dietary preference.");
      }
    } catch (err) {
      alert("Network error while updating preference.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Utensils className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-wide">SHINE &apos;26 FOOD CONSOLE</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Food Committee
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-medium">{session?.user?.name || session?.user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute chimes" : "Enable chimes"}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? "bg-slate-800 border-slate-700 text-amber-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={fetchStats}
              title="Refresh Stats"
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Live Catering KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Meals Progress */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Served</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {stats?.claimPercentage ?? 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats?.totalClaimed ?? 0}</span>
              <span className="text-xs text-slate-400">/ {stats?.totalEligible ?? 0}</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.claimPercentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* 🥗 Vegetarian Counter */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 relative overflow-hidden group hover:border-emerald-700/60 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" />
                Vegetarian
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                {stats?.veg.remaining ?? 0} left
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats?.veg.claimed ?? 0}</span>
              <span className="text-xs text-emerald-500/80">served of {stats?.veg.requested ?? 0}</span>
            </div>
            <div className="mt-3 w-full bg-emerald-950/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats?.veg.requested ? Math.round((stats.veg.claimed / stats.veg.requested) * 100) : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 🍗 Non-Vegetarian Counter */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 relative overflow-hidden group hover:border-amber-700/60 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Non-Vegetarian
              </span>
              <span className="text-xs font-semibold text-amber-300">
                {stats?.nonVeg.remaining ?? 0} left
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{stats?.nonVeg.claimed ?? 0}</span>
              <span className="text-xs text-amber-500/80">served of {stats?.nonVeg.requested ?? 0}</span>
            </div>
            <div className="mt-3 w-full bg-amber-950/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats?.nonVeg.requested
                      ? Math.round((stats.nonVeg.claimed / stats.nonVeg.requested) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Queue Remaining */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Queue Remaining</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Pending
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-300">{stats?.totalRemaining ?? 0}</span>
              <span className="text-xs text-slate-400">delegates yet to eat</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 truncate">
              {stats?.veg.remaining ?? 0} Veg • {stats?.nonVeg.remaining ?? 0} Non-Veg
            </p>
          </div>
        </section>

        {/* Scanner & Rapid Queue Interface */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Console (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Mode Toggle Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white">Live Food Scanner</span>
                </div>

                {/* Auto-Claim Switch requested by user for fast lunch queue */}
                <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Zap className={`w-3.5 h-3.5 ${autoClaim ? "text-amber-400" : "text-slate-500"}`} />
                    <span className={autoClaim ? "text-amber-400 font-semibold" : "text-slate-400"}>
                      Auto-Claim Mode
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoClaim}
                    onClick={() => setAutoClaim(!autoClaim)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoClaim ? "bg-amber-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        autoClaim ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[320px] flex flex-col items-center justify-center p-4">
                {/* HTML5 QR Code Container */}
                <div
                  id={scannerDivId}
                  className={`w-full max-w-md ${cameraActive ? "block" : "hidden"}`}
                />

                {/* Camera Starting Spinner */}
                {cameraStarting && (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <span className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-300 font-semibold">Initializing camera stream...</span>
                  </div>
                )}

                {/* Diagnostic Error State */}
                {!cameraActive && !cameraStarting && cameraError && (
                  <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{cameraError.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{cameraError.message}</p>
                    </div>

                    {cameraError.steps && cameraError.steps.length > 0 && (
                      <div className="text-left bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">How to resolve:</p>
                        <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                          {cameraError.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              <span className="text-slate-200">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startScanner()}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera Access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCameraError(null)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Inactive initial state */}
                {!cameraActive && !cameraStarting && !cameraError && (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Camera Scanner Inactive</h3>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Turn on your device camera for hands-free instant QR verification and auto-claiming.
                      </p>
                    </div>
                    <button
                      onClick={() => startScanner()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Start Camera Scanner
                    </button>
                  </div>
                )}

                {/* Active Controls Header */}
                {cameraActive && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    {availableCameras.length > 1 && (
                      <button
                        onClick={switchScannerCamera}
                        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-medium text-amber-300 hover:text-white flex items-center gap-1.5 shadow cursor-pointer transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Switch Camera ({availableCameras.length})</span>
                      </button>
                    )}
                    <button
                      onClick={stopScanner}
                      className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 shadow cursor-pointer transition"
                    >
                      <CameraOff className="w-3.5 h-3.5 text-red-400" />
                      Stop Camera
                    </button>
                  </div>
                )}

                {/* Processing Overlay */}
                {processing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-2">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-amber-300">Verifying & Claiming Meal...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Code Input Bar */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputCode.trim()) handleDetectedCode(inputCode.trim());
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Enter Token Code (e.g. FT-26-XXXX) or Badge Code..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputCode.trim() || processing}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-2"
                >
                  <span>Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Scan Result / Pop-up Card + Recent Activity (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pop-up result card requested by user */}
            {popup ? (
              <div
                className={`rounded-3xl p-6 border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 relative ${
                  popup.status === "success"
                    ? "bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40"
                    : popup.status === "already_claimed"
                    ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40"
                    : "bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-red-500/40"
                }`}
              >
                <button
                  onClick={() => setPopup(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Status Header */}
                <div className="flex items-center gap-3 mb-4">
                  {popup.status === "success" && (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {popup.status === "already_claimed" && (
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                  {(popup.status === "unpaid" || popup.status === "not_found" || popup.status === "error") && (
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-white">{popup.title}</h2>
                    <p className="text-xs text-slate-400">{popup.message}</p>
                  </div>
                </div>

                {/* BIG PROMINENT DIETARY BADGE */}
                {popup.foodPreference && (
                  <div className="my-4">
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
                        popup.foodPreference === "VEG"
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white"
                          : "bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-2xl">
                          {popup.foodPreference === "VEG" ? "🥗" : "🍗"}
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider opacity-90">
                            Serve Meal Choice
                          </span>
                          <p className="text-xl font-black tracking-wide">
                            {popup.foodPreference === "VEG" ? "VEGETARIAN" : "NON-VEGETARIAN"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                        {popup.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Delegate Details */}
                {popup.name && (
                  <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Delegate Name:</span>
                      <span className="font-bold text-white text-sm">{popup.name}</span>
                    </div>
                    {popup.college && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Institution:</span>
                        <span className="font-medium text-slate-300 text-right truncate max-w-[200px]">
                          {popup.college}
                        </span>
                      </div>
                    )}
                    {popup.tokenCode && (
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-400">Food Token:</span>
                        <span className="text-amber-400 font-semibold">{popup.tokenCode}</span>
                      </div>
                    )}
                    {popup.claimedAt && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Prior Claim Time:</span>
                        <span className="text-amber-300 font-semibold">
                          {new Date(popup.claimedAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick In-Popup Actions */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {popup.tokenCode && (
                    <div className="flex items-center gap-2">
                      {popup.foodPreference && (
                        <button
                          onClick={() =>
                            handleSwitchPreference(
                              popup.tokenCode!,
                              popup.foodPreference === "VEG" ? "NON_VEG" : "VEG"
                            )
                          }
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                        >
                          Switch to {popup.foodPreference === "VEG" ? "🍗 Non-Veg" : "🥗 Veg"}
                        </button>
                      )}

                      {popup.status === "already_claimed" && (
                        <button
                          onClick={() => handleUndoClaim(popup.tokenCode!)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo Claim
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setPopup(null)}
                    className="ml-auto px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl p-6 bg-slate-900 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Ready for Next Attendee</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Point camera at student&apos;s food token QR code. The system will auto-approve in{" "}
                  <span className="text-amber-400 font-semibold">1 second</span> and flash their dietary meal badge!
                </p>
              </div>
            )}

            {/* Recent Claims Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="font-bold text-sm text-white">Recent Claims Feed</h3>
                </div>
                <span className="text-xs text-slate-500">Latest {recentClaims.length} meals</span>
              </div>

              {recentClaims.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No meals served yet today.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {claim.foodPreference === "VEG" ? "🥗" : "🍗"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{claim.name}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                claim.foodPreference === "VEG"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {claim.foodPreference}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {claim.collegeName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {claim.foodClaimedAt
                            ? new Date(claim.foodClaimedAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        <button
                          onClick={() => handleUndoClaim(claim.foodTokenCode)}
                          title="Undo claim"
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
