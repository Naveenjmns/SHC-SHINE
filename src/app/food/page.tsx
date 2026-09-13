"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Footer from "@/components/Footer";
import CheckInModal from "@/components/CheckInModal";
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
  ZapOff,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  LogOut,
  Users,
  User,
  ShieldCheck,
  Building2,
  Phone,
  Flame,
  Leaf,
  Check,
  History,
  X,
  Upload,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";
import {
  parseCameraError,
  getAvailableCameras,
  getCameraPermissionStatus,
  isSecureCameraContext,
  extractLookupCode,
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
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoClaim, setAutoClaim] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shine_auto_claim");
      if (saved !== null) return saved === "true";
    }
    return true; // Default to fast auto-claim for rush hours
  });
  const autoClaimRef = useRef(autoClaim);
  autoClaimRef.current = autoClaim;

  const toggleAutoClaim = () => {
    setAutoClaim((prev) => {
      const next = !prev;
      autoClaimRef.current = next;
      if (typeof window !== "undefined") {
        localStorage.setItem("shine_auto_claim", String(next));
      }
      return next;
    });
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Popup Modal / Toast state for quick scan review
  const [popup, setPopup] = useState<ScanPopup | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce lock for continuous scanning to avoid rapid re-scans of the same code
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);
  const scannerRef = useRef<any>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileScanning, setFileScanning] = useState(false);
  const isStoppingCameraRef = useRef(false);

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
    if (isStoppingCameraRef.current) return;
    isStoppingCameraRef.current = true;

    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          try {
            await scannerRef.current.stop();
          } catch (stopErr) {
            console.log("Scanner stop notice:", stopErr);
          }
        }
        try {
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
      }
    } catch (err) {
      console.log("Scanner cleanup notice:", err);
    } finally {
      // Clean up hardware tracks and video elements
      try {
        const container = document.getElementById(scannerDivId);
        if (container) {
          const videos = container.getElementsByTagName("video");
          for (let i = 0; i < videos.length; i++) {
            const stream = videos[i].srcObject as MediaStream | null;
            if (stream && typeof stream.getTracks === "function") {
              stream.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch (_) {}
              });
            }
          }
          container.innerHTML = "";
        }
      } catch (_) {}

      setCameraActive(false);
      setCameraStarting(false);
      isStoppingCameraRef.current = false;
    }
  };

  const startScanner = async (specificCameraId?: string) => {
    try {
      setCameraError(null);
      setCameraStarting(true);

      // Pre-flight secure context check
      if (!isSecureCameraContext()) {
        const parsed = parseCameraError(new Error("Insecure context"));
        setCameraError(parsed);
        setCameraActive(false);
        setCameraStarting(false);
        return;
      }

      // Check mediaDevices support in current browser / PWA environment
      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError({
          type: "INSECURE_CONTEXT",
          title: "Camera Hardware API Not Available",
          message: "Live video stream access is blocked by your browser. This typically occurs on mobile when accessing over HTTP via a local network IP.",
          steps: [
            "Access this application over HTTPS (e.g. 'npm run dev:https') or localhost.",
            "Tap 'Upload QR / Snap Photo' below to scan directly using your phone's camera app without live stream restrictions.",
            "Or use the Manual Code Lookup to enter the participant code.",
          ],
        });
        setCameraActive(false);
        setCameraStarting(false);
        return;
      }

      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        await stopScanner();
      }

      // Ensure viewport element exists in DOM and is rendered
      let scannerEl = document.getElementById(scannerDivId);
      if (!scannerEl) {
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          scannerEl = document.getElementById(scannerDivId);
          if (scannerEl) break;
        }
      }
      if (!scannerEl) {
        throw new Error("Scanner viewport element could not be initialized in DOM.");
      }

      const qr = new Html5Qrcode(scannerDivId, false);
      scannerRef.current = qr;

      // Dynamic qrbox based on actual rendered viewfinder width & height
      // Does not hardcode hardware aspectRatio to prevent OverconstrainedError on laptop/webcams
      const config: any = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(160, Math.min(280, Math.floor(edge * 0.78)));
          return { width: size, height: size };
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      const onScanSuccess = (decodedText: string) => {
        handleDetectedCode(decodedText);
      };

      let started = false;

      // Strategy 1: User explicitly picked a specific camera
      if (specificCameraId) {
        try {
          await qr.start(specificCameraId, config, onScanSuccess, () => {});
          started = true;
          setSelectedCameraId(specificCameraId);
        } catch (specErr) {
          console.warn("Specific camera failed, trying fallback:", specErr);
        }
      }

      // Strategy 2: Pre-selected camera if available
      if (!started && selectedCameraId) {
        try {
          await qr.start(selectedCameraId, config, onScanSuccess, () => {});
          started = true;
        } catch (selErr) {
          console.warn("Selected camera failed, trying fallback:", selErr);
        }
      }

      // Strategy 3: Mobile environment rear camera -> Front camera -> Any available camera
      if (!started) {
        try {
          await qr.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
          started = true;
        } catch (envErr: any) {
          console.log("Environment facing camera not available, attempting user camera:", envErr);
          const errStr = String(envErr?.message || envErr || "");
          if (/notallowederror|permission denied|not allowed/i.test(errStr)) {
            throw envErr;
          }

          try {
            await qr.start({ facingMode: "user" }, config, onScanSuccess, () => {});
            started = true;
          } catch (userErr: any) {
            console.log("User facing camera failed, enumerating cameras:", userErr);
            const userErrStr = String(userErr?.message || userErr || "");
            if (/notallowederror|permission denied|not allowed/i.test(userErrStr)) {
              throw userErr;
            }

            const devices = await getAvailableCameras(Html5Qrcode);
            if (devices.length > 0) {
              await qr.start(devices[0].id, config, onScanSuccess, () => {});
              started = true;
              setSelectedCameraId(devices[0].id);
            } else {
              throw userErr;
            }
          }
        }
      }

      // Enforce iOS Safari and desktop inline video autoplay attributes
      if (scannerEl) {
        const vids = scannerEl.getElementsByTagName("video");
        for (let i = 0; i < vids.length; i++) {
          vids[i].setAttribute("playsinline", "true");
          vids[i].setAttribute("webkit-playsinline", "true");
          vids[i].setAttribute("muted", "true");
          vids[i].setAttribute("autoplay", "true");
          vids[i].play().catch(() => {});
        }
      }

      setCameraActive(true);
      setCameraError(null);

      // Enumerate available devices for camera switcher
      try {
        const cameras = await getAvailableCameras(Html5Qrcode);
        setAvailableCameras(cameras);
      } catch (_) {}
    } catch (err: any) {
      console.error("Camera start error:", err);
      const parsed = parseCameraError(err);
      setCameraError(parsed);
      setCameraActive(false);
    } finally {
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

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempId = "file-qr-decoder-food";
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement("div");
        tempEl.id = tempId;
        tempEl.style.display = "none";
        document.body.appendChild(tempEl);
      }
      const qrScanner = new Html5Qrcode(tempId, false);
      const decodedText = await qrScanner.scanFile(file, false);
      qrScanner.clear();
      if (decodedText) {
        handleDetectedCode(decodedText);
      }
    } catch (err: any) {
      console.warn("Food photo QR scan error:", err);
      setPopup({
        status: "error",
        title: "QR Code Not Found",
        message: "Could not read a valid QR code in that photo. Please ensure it is clear or enter the code manually.",
      });
    } finally {
      setFileScanning(false);
      if (e.target) e.target.value = "";
    }
  };

  // Process code (from camera or manual input)
  const handleDetectedCode = async (rawCode: string) => {
    const { code: normalizedCode } = extractLookupCode(rawCode);
    const code = (normalizedCode || rawCode).trim();
    if (!code || processing || popup?.status === "eligible") return;

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

    const isAuto = autoClaimRef.current;

    try {
      if (isAuto) {
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
        } else if (data.isWrongType) {
          playSound("error");
          setPopup({
            status: "error",
            title: "Wrong Pass Type (Event Pass)",
            tokenCode: code,
            message: data.message || "You scanned an Event Registration Pass. Food distribution requires the participant's Food Token QR (FT-...).",
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
        const res = await fetch(`/api/checkin?code=${encodeURIComponent(code)}&type=FOOD`);
        const data = await safeJson(res);

        if (data.isWrongType) {
          playSound("error");
          setPopup({
            status: "error",
            title: "Wrong Pass Type (Event Pass)",
            tokenCode: code,
            message: data.message || "You scanned an Event Registration Pass. Food distribution requires the participant's Food Token QR (FT-...).",
          });
        } else if (res.ok && data.success && data.member) {
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
              status: "eligible",
              title: "Approve or Reject Meal Issue?",
              name: m.name,
              college: m.collegeName,
              foodPreference: m.foodPreference || "VEG",
              tokenCode: m.foodTokenCode,
              badgeCode: m.badgeCode,
              memberId: m.id,
              message: `Delegate verified! 1x ${m.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Pure Veg"} meal pending approval. Please choose to Approve or Reject below.`,
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

  // Manual Claim Confirmation (when Auto-Claim Mode is OFF)
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
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }
        const member = data.member;
        const pref = data.foodPreference || member?.foodPreference || popup?.foodPreference || "VEG";
        setPopup({
          status: "success",
          title: "Meal Token Claimed!",
          name: member?.name || popup?.name || "Participant",
          college: member?.collegeName || popup?.college || "Registered Contingent",
          foodPreference: pref,
          tokenCode: member?.foodTokenCode || tokenCode,
          badgeCode: member?.badgeCode || popup?.badgeCode,
          memberId: member?.id || popup?.memberId,
          message: data.message || `1x ${pref === "VEG" ? "Vegetarian" : "Non-Vegetarian"} meal confirmed and approved.`,
        });
        fetchStats();
      } else {
        playSound("error");
        setPopup({
          status: "error",
          title: "Claim Failed",
          tokenCode,
          message: data.message || "Failed to record meal claim.",
        });
      }
    } catch (err: any) {
      playSound("error");
      setPopup({
        status: "error",
        title: "Network Error",
        tokenCode,
        message: err?.message || "Failed to connect to server.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Decline meal issue (when Auto-Claim Mode is OFF)
  const handleRejectClaim = (delegateName: string) => {
    playSound("warning");
    setPopup({
      status: "warning",
      title: "Meal Issue Declined",
      name: delegateName,
      message: `Meal distribution for ${delegateName} was declined/rejected by staff. No meal voucher was consumed.`,
    });
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
        setPopup({
          status: "error",
          title: "Reset Failed",
          message: data.message || "Failed to reset claim.",
        });
      }
    } catch {
      setPopup({
        status: "error",
        title: "Network Error",
        message: "Network error while resetting claim.",
      });
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
        setPopup({
          status: "error",
          title: "Update Failed",
          message: data.message || "Failed to update dietary preference.",
        });
      }
    } catch {
      setPopup({
        status: "error",
        title: "Network Error",
        message: "Network error while updating preference.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Calm Light Navigation — Synced with Coordinator / App UI */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="container-shine py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                SHINE <span className="text-orange-600">26</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 sm:px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xs:inline">Food Committee Console</span>
              <span className="xs:hidden">Food Desk</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
              className={`tap-target px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                  : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden md:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
            </button>

            <button
              onClick={fetchStats}
              title="Refresh Statistics"
              className="tap-target px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin text-orange-600" : "text-slate-500"}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowCheckInModal(true)}
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Check-in</span>
            </button>

            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="tap-target hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors items-center"
              >
                Admin Panel →
              </Link>
            )}

            <Link
              href="/profile"
              className="tap-target px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">My Profile</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="tap-target px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="container-shine py-6 sm:py-8 flex-1 space-y-6">
        {/* Banner Card */}
        <div className="dash-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Catering & Hospitality Desk
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Distribution
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Meal Pass Verification
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Logged in as <span className="font-semibold text-slate-800">{session?.user?.name || session?.user?.email}</span> • Real-time dietary pass verification & meal quota tracking.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left sm:text-right w-full sm:w-auto shadow-xs">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Dining Facility</div>
              <div className="text-base sm:text-lg font-black text-amber-950">
                SGB Quadrangle Dining Hall
              </div>
              <div className="text-[11px] text-amber-700 font-medium">Sacred Heart College (Autonomous)</div>
            </div>
          </div>
        </div>

        {/* Live Catering KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Meals Progress */}
          <div className="dash-card p-4 sm:p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Served</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {stats?.claimPercentage ?? 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{stats?.totalClaimed ?? 0}</span>
              <span className="text-xs text-slate-500">/ {stats?.totalEligible ?? 0}</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.claimPercentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* 🥗 Vegetarian Counter */}
          <div className="dash-card p-4 sm:p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Vegetarian
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats?.veg.remaining ?? 0} left
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums">{stats?.veg.claimed ?? 0}</span>
              <span className="text-xs text-slate-500">of {stats?.veg.requested ?? 0}</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats?.veg.requested ? Math.round((stats.veg.claimed / stats.veg.requested) * 100) : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 🍗 Non-Vegetarian Counter */}
          <div className="dash-card p-4 sm:p-5 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                Non-Veg
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {stats?.nonVeg.remaining ?? 0} left
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-orange-700 tabular-nums">{stats?.nonVeg.claimed ?? 0}</span>
              <span className="text-xs text-slate-500">of {stats?.nonVeg.requested ?? 0}</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-600 to-amber-600 h-full rounded-full transition-all duration-500"
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
          <div className="dash-card p-4 sm:p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Queue Remaining</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Pending
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-800 tabular-nums">{stats?.totalRemaining ?? 0}</span>
              <span className="text-xs text-slate-500">delegates left</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 truncate font-medium">
              {stats?.veg.remaining ?? 0} Veg • {stats?.nonVeg.remaining ?? 0} Non-Veg
            </p>
          </div>
        </div>

        {/* Scanner & Rapid Queue Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner / Check-In Console (Left 7 Cols) - Synced with Check-In Hub UI */}
          <div className="lg:col-span-7 dash-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header Matching Hub UI */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
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

                {/* Auto-Claim Switch */}
                <button
                  type="button"
                  onClick={toggleAutoClaim}
                  className="flex items-center gap-3 bg-stone-50 hover:bg-stone-100/90 active:scale-[0.98] px-3.5 py-2 rounded-xl border border-stone-200 ml-auto sm:ml-0 shadow-2xs transition text-left cursor-pointer select-none"
                  title={autoClaim ? "Click to turn OFF (ask to approve or reject)" : "Click to turn ON (fast auto-claim)"}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        autoClaim ? "bg-[#FF6B1A]/15 text-[#FF6B1A]" : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {autoClaim ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block leading-tight flex items-center gap-1.5">
                        <span>Auto-Claim Mode</span>
                        <span
                          className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                            autoClaim ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {autoClaim ? "ON" : "OFF"}
                        </span>
                      </span>
                      <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                        {autoClaim ? "⚡ Scans auto-issue meal immediately" : "🛡️ Scans ask to Approve or Reject"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0 ml-1 pointer-events-none ${
                      autoClaim ? "bg-[#FF6B1A]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                        autoClaim ? "translate-x-5.5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Mode Switcher Segmented Pill Matching Screenshot */}
              <div className="flex items-center justify-center gap-2 p-1 bg-stone-100 rounded-2xl max-w-md mx-auto my-4">
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
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
                  onClick={() => {
                    setScanMode("camera");
                    startScanner();
                  }}
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

              {/* Viewport: Manual vs Camera */}
              {scanMode === "manual" ? (
                /* Manual Input Viewport Matching Screenshot */
                <div className="block max-w-md mx-auto space-y-4 py-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (inputCode.trim()) handleDetectedCode(inputCode.trim());
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SHN27-DEL-XXXX or FT-XXXX..."
                        className="w-full pl-9 pr-4 py-3 text-sm font-mono border-2 border-stone-300 rounded-xl focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/20 outline-none transition bg-white"
                        autoFocus
                      />
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputCode.trim() || processing}
                      className="btn-ember px-6 py-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                    >
                      {processing ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Lookup</span>
                          <Search className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fileScanning}
                      className="text-xs text-stone-500 hover:text-stone-800 inline-flex items-center gap-1.5 font-semibold transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      <span>{fileScanning ? "Reading Photo..." : "Or scan from QR image / photo"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Camera Scanner Viewport */
                <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 min-h-[340px] flex flex-col items-center justify-center p-4">
                  {/* Global Scanner CSS for html5-qrcode video framing */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    #${scannerDivId} {
                      position: relative !important;
                      width: 100% !important;
                      max-width: 440px !important;
                      margin: 0 auto !important;
                      border-radius: 1rem !important;
                      overflow: hidden !important;
                    }
                    #${scannerDivId} video {
                      object-fit: cover !important;
                      width: 100% !important;
                      max-height: 320px !important;
                      border-radius: 1rem !important;
                      display: block !important;
                    }
                    #${scannerDivId} img {
                      display: none !important;
                    }
                    #${scannerDivId} #qr-shaded-region {
                      border-radius: 1rem !important;
                    }
                  `}} />

                  {/* Camera Controls Bar: Switch Camera & Stop Camera */}
                  {cameraActive && (
                    <div className="flex items-center justify-end gap-2 w-full max-w-md mx-auto mb-3 px-1">
                      {availableCameras.length > 1 && (
                        <button
                          type="button"
                          onClick={switchScannerCamera}
                          className="tap-target px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1 shadow-2xs cursor-pointer transition"
                        >
                          <RefreshCw className="w-3 h-3 text-[#FF6B1A]" />
                          <span>Switch Camera ({availableCameras.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopScanner}
                        className="tap-target px-2.5 py-1.5 rounded-xl bg-white border border-rose-300 text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 shadow-2xs cursor-pointer transition"
                      >
                        <CameraOff className="w-3.5 h-3.5 text-rose-600" />
                        <span>Stop Camera</span>
                      </button>
                    </div>
                  )}

                  {/* HTML5 QR Code Container */}
                  <div
                    id={scannerDivId}
                    className={`w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-amber-500 shadow-md bg-black ${
                      cameraActive || cameraStarting ? "block" : "hidden"
                    }`}
                  />

                  {/* Camera Starting Spinner Overlay */}
                  {cameraStarting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs text-center space-y-3 p-8">
                      <span className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-slate-800 font-bold">Connecting to camera hardware...</span>
                      <span className="text-xs text-slate-500">Please allow camera permissions if requested</span>
                    </div>
                  )}

                  {/* Diagnostic Error State */}
                  {!cameraActive && !cameraStarting && cameraError && (
                    <div className="w-full max-w-md p-5 rounded-2xl bg-white border border-amber-300 shadow-sm text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{cameraError.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{cameraError.message}</p>
                      </div>

                      {cameraError.steps && cameraError.steps.length > 0 && (
                        <div className="text-left bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">How to resolve:</p>
                          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                            {cameraError.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="text-slate-800">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => startScanner()}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={fileScanning}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{fileScanning ? "Reading..." : "Upload QR / Snap"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            setScanMode("manual");
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Manual Lookup
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inactive initial state */}
                  {!cameraActive && !cameraStarting && !cameraError && (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Camera Scanner Ready</h3>
                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                          Turn on your camera for hands-free QR verification, or upload a photo of the participant pass.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => startScanner()}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-sm active:scale-98 transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Start Camera Scanner
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={fileScanning}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-xs transition cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>{fileScanning ? "Reading..." : "Upload QR / Photo"}</span>
                        </button>
                      </div>
                    </div>
                  )}



                  {cameraActive && (
                    <p className="text-xs text-slate-600 mt-3 text-center font-medium">
                      Hold delegate badge or Food Token QR code squarely in front of camera
                    </p>
                  )}

                  {/* Processing Overlay */}
                  {processing && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
                      <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-800">Verifying & Claiming Meal...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer Matching Screenshot Bottom Bar */}
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Accepts both Event QR & Food QR codes</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="tap-target text-xs font-bold text-[#FF6B1A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Modal View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Active Scan Result / Pop-up Card + Recent Feed (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pop-up result card */}
            {popup ? (
              <div
                className={`dash-card p-5 sm:p-6 border-2 relative animate-in fade-in zoom-in-95 duration-200 shadow-md ${
                  popup.status === "success"
                    ? "bg-emerald-50/70 border-emerald-300"
                    : popup.status === "eligible"
                    ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20"
                    : popup.status === "already_claimed"
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-rose-50/70 border-rose-300"
                }`}
              >
                <button
                  onClick={() => setPopup(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Status Header */}
                <div className="flex items-center gap-3 mb-4 pr-6">
                  {popup.status === "success" && (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {popup.status === "eligible" && (
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#FF6B1A] flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                  {popup.status === "already_claimed" && (
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                  {(popup.status === "unpaid" || popup.status === "not_found" || popup.status === "error") && (
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{popup.title}</h2>
                    <p className="text-xs text-slate-600 mt-0.5">{popup.message}</p>
                  </div>
                </div>

                {/* BIG PROMINENT DIETARY BADGE */}
                {popup.foodPreference && (
                  <div className="my-4">
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                        popup.foodPreference === "VEG"
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white"
                          : "bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-xs">
                          {popup.foodPreference === "VEG" ? "🥗" : "🍗"}
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold tracking-wider opacity-90 block">
                            Serve Meal Choice
                          </span>
                          <p className="text-xl font-black tracking-tight">
                            {popup.foodPreference === "VEG" ? "VEGETARIAN" : "NON-VEGETARIAN"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                        {popup.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Manual Approve or Reject Decision Prompt */}
                {popup.status === "eligible" && (
                  <div className="my-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#FF6B1A] flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                            Decision Required
                          </span>
                          <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-black border border-amber-300">
                            Auto-Claim OFF
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-stone-900 mt-1">
                          Approve 1x {popup.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Veg"} meal for {popup.name}?
                        </h3>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Auto-Claim is turned off. Please verify participant and choose to Approve or Reject below.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleManualClaim(popup.tokenCode!)}
                        disabled={actionLoading}
                        className="tap-target px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Approve &amp; Issue Meal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectClaim(popup.name || "Participant")}
                        disabled={actionLoading}
                        className="tap-target px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>✕ Reject / Decline</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Delegate Details */}
                {popup.name && (
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Delegate Name:</span>
                      <span className="font-bold text-slate-900 text-sm">{popup.name}</span>
                    </div>
                    {popup.college && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Institution:</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[200px]">
                          {popup.college}
                        </span>
                      </div>
                    )}
                    {popup.tokenCode && (
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Food Token:</span>
                        <span className="text-orange-600 font-bold">{popup.tokenCode}</span>
                      </div>
                    )}
                    {popup.claimedAt && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Prior Claim Time:</span>
                        <span className="text-amber-800 font-bold">
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
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                  {popup.tokenCode && (
                    <div className="flex items-center gap-2">
                      {popup.status === "eligible" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleManualClaim(popup.tokenCode!)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClaim(popup.name || "Participant")}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {popup.foodPreference && (
                        <button
                          onClick={() =>
                            handleSwitchPreference(
                              popup.tokenCode!,
                              popup.foodPreference === "VEG" ? "NON_VEG" : "VEG"
                            )
                          }
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
                        >
                          Switch to {popup.foodPreference === "VEG" ? "🍗 Non-Veg" : "🥗 Veg"}
                        </button>
                      )}

                      {popup.status === "already_claimed" && (
                        <button
                          onClick={() => handleUndoClaim(popup.tokenCode!)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo Claim
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setPopup(null)}
                    className="ml-auto px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="dash-card p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ready for Next Delegate</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aim camera at the delegate&apos;s food token QR code. The system will auto-approve and display their dietary preference!
                </p>
              </div>
            )}

            {/* Recent Claims Stream */}
            <div className="dash-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="font-bold text-sm text-slate-900">Recent Claims Activity</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Latest {recentClaims.length}
                </span>
              </div>

              {recentClaims.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No meals recorded yet today.</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between hover:border-slate-300 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {claim.foodPreference === "VEG" ? "🥗" : "🍗"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{claim.name}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                claim.foodPreference === "VEG"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-orange-50 text-orange-700 border border-orange-200"
                              }`}
                            >
                              {claim.foodPreference === "VEG" ? "Veg" : "Non-Veg"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[170px] sm:max-w-[200px]">
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
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
        </div>
      </div>

      {/* Centered Decision Modal when Auto-Claim is OFF and delegate is scanned */}
      {popup && popup.status === "eligible" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">Action Required: Approve or Reject?</h3>
                  <p className="text-[11px] text-white/90">Auto-Claim is turned OFF • Verify participant credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Manual Verification Mode
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 pt-1">
                  {popup.name}
                </h2>
                {popup.college && (
                  <p className="text-xs sm:text-sm font-medium text-stone-600">
                    {popup.college}
                  </p>
                )}
                {popup.tokenCode && (
                  <p className="text-xs font-mono font-bold text-[#FF6B1A] pt-0.5">
                    Token: {popup.tokenCode}
                  </p>
                )}
              </div>

              {/* Big Dietary Choice Badge */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                  popup.foodPreference === "NON_VEG"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                    {popup.foodPreference === "NON_VEG" ? "🍗" : "🥗"}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                      Assigned Meal Choice
                    </span>
                    <span className="text-lg sm:text-xl font-black">
                      {popup.foodPreference === "NON_VEG" ? "NON-VEGETARIAN" : "PURE VEGETARIAN"}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-white/25">
                  1x Meal
                </span>
              </div>

              {/* Big Binary Decision Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleManualClaim(popup.tokenCode!)}
                  disabled={actionLoading}
                  className="tap-target py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✓ Approve &amp; Issue Meal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectClaim(popup.name || "Participant")}
                  disabled={actionLoading}
                  className="tap-target py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  <span>✕ Reject / Decline</span>
                </button>
              </div>

              {/* Dietary switch & dismiss */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                {popup.foodPreference && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSwitchPreference(
                        popup.tokenCode!,
                        popup.foodPreference === "VEG" ? "NON_VEG" : "VEG"
                      )
                    }
                    disabled={actionLoading}
                    className="text-stone-600 hover:text-stone-900 font-semibold underline cursor-pointer"
                  >
                    Switch to {popup.foodPreference === "VEG" ? "🍗 Non-Veg" : "🥗 Veg"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="text-stone-400 hover:text-stone-700 font-semibold cursor-pointer ml-auto"
                >
                  Dismiss / Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* QR Check-In & Food Claim Modal Matching Hub UI */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInComplete={fetchStats}
        mode="all"
      />
    </main>
  );
}
