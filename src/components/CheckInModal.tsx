"use client";

import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Camera,
  Utensils,
  Building2,
  Calendar,
  UserCheck,
  RotateCcw,
  Sparkles,
  Check,
  Upload,
  SwitchCamera,
  Zap,
  ZapOff,
  XCircle,
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
import { formatTimeSafe } from "@/lib/dateUtils";

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
  foodPreference?: "VEG" | "NON_VEG" | null;
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
  isApproved?: boolean;
  notApprovedMessage?: string | null;
  isExpired?: boolean;
  expiredMessage?: string | null;
  registrations: RegistrationDetail[];
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEventId?: string; // Optional: if provided, coordinator is checking in for this specific event
  activeEventName?: string;
  onCheckInComplete?: () => void;
  mode?: "all" | "event_only" | "food_only";
}

export default function CheckInModal({
  isOpen,
  onClose,
  activeEventId,
  activeEventName,
  onCheckInComplete,
  mode = "all",
}: CheckInModalProps) {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [delegate, setDelegate] = useState<MemberLookupData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Auto Check-In / Auto Claim Mode:
  // When ON (true): scanning QR automatically executes check-in / food claim immediately without extra confirmation
  // When OFF (false): scanning QR looks up delegate and prompts to Approve or Reject before recording
  const storageKey = mode === "food_only" ? "shine_auto_claim" : "shine_auto_checkin";

  const [autoCheckIn, setAutoCheckIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === "true";
    }
    return true;
  });
  const autoCheckInRef = useRef(autoCheckIn);
  autoCheckInRef.current = autoCheckIn;

  // Track whether the last searched code was for food or event
  const [targetActionType, setTargetActionType] = useState<"food" | "event" | null>(null);

  // Synchronize state whenever modal opens or storageKey changes
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const val = saved === "true";
        setAutoCheckIn(val);
        autoCheckInRef.current = val;
      }
    }
  }, [isOpen, storageKey]);

  const toggleAutoCheckIn = () => {
    setAutoCheckIn((prev) => {
      const next = !prev;
      autoCheckInRef.current = next;
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(next));
      }
      return next;
    });
  };

  const handleRejectCheckIn = (delegateName: string) => {
    setMessage({
      type: "warning",
      text: `Check-in / claim for ${delegateName} was declined/rejected by staff. No attendance or meal token was recorded.`,
    });
    setDelegate(null);
    setTargetActionType(null);
  };

  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const scannerRef = useRef<any>(null);
  const scannerDivId = "reader-camera-stream";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileScanning, setFileScanning] = useState(false);
  const isStoppingCameraRef = useRef(false);

  // Play audio chime on successful scan (cross-browser safe with AudioContext cleanup)
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          ctx.close();
        } catch (_) {}
      };
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  };


  // Haptic feedback
  const triggerVibrate = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch (_) {}
    }
  };

  // Stop camera and release all hardware tracks cleanly
  const stopCameraScanner = async () => {
    if (isStoppingCameraRef.current) return;
    isStoppingCameraRef.current = true;
    setTorchOn(false);
    setTorchSupported(false);

    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          try {
            await scannerRef.current.stop();
          } catch (stopErr) {
            console.log("Scanner stop ignored:", stopErr);
          }
        }
        try {
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
      }
    } catch (err) {
      console.log("Scanner shutdown note:", err);
    } finally {
      // Explicitly stop all video tracks in the container to release OS camera hardware sensor
      try {
        const container = document.getElementById(scannerDivId);
        if (container) {
          const videos = container.getElementsByTagName("video");
          for (let i = 0; i < videos.length; i++) {
            const stream = videos[i].srcObject as MediaStream | null;
            if (stream && typeof stream.getTracks === "function") {
              stream.getTracks().forEach((track) => {
                try {
                  track.stop();
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
      setCameraError(null);
      setScanMode("manual");
    } else {
      // Whenever modal opens, guarantee Manual Code Lookup is the default selected mode
      stopCameraScanner();
      setScanMode("manual");
      setDelegate(null);
      setMessage(null);
      setInputCode("");
      setCameraError(null);
    }
  }, [isOpen]);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    setMessage(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempId = "file-qr-decoder-checkin";
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
        console.log("QR decoded from photo:", decodedText);
        playBeep();
        triggerVibrate();
        handleLookup(decodedText, true);
      }
    } catch (err: any) {
      console.warn("QR file scan error:", err);
      setMessage({
        type: "error",
        text: "Could not detect a valid QR code in that photo. Please ensure good lighting or enter the code manually.",
      });
    } finally {
      setFileScanning(false);
      if (e.target) e.target.value = "";
    }
  };

  const startCameraScanner = async (specificCameraId?: string) => {
    try {
      setCameraError(null);
      setMessage(null);
      setScanMode("camera");
      setCameraStarting(true);
      setTorchOn(false);
      setTorchSupported(false);

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
        await stopCameraScanner();
      }

      // Give browser time to ensure DOM element exists
      let scannerEl = document.getElementById(scannerDivId);
      if (!scannerEl) {
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          scannerEl = document.getElementById(scannerDivId);
          if (scannerEl) break;
        }
      }
      if (!scannerEl) {
        throw new Error("Scanner viewport element could not be initialized in DOM.");
      }

      // Initialize with verbose=false so html5-qrcode logger does not trigger Turbopack console error overlay
      const html5QrCode = new Html5Qrcode(scannerDivId, false);
      scannerRef.current = html5QrCode;

      // Dynamic qrbox calculation based on real viewfinder dimensions without hardcoded aspectRatio
      const config: any = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(160, Math.min(250, Math.floor(edge * 0.72)));
          return { width: size, height: size };
        },
      };

      const onScanSuccess = (decodedText: string) => {
        console.log("QR Decoded successfully:", decodedText);
        playBeep();
        triggerVibrate();
        handleLookup(decodedText, true);
        stopCameraScanner();
      };

      let started = false;

      // 1. Specific camera if explicitly provided
      if (specificCameraId) {
        try {
          await html5QrCode.start(specificCameraId, config, onScanSuccess, () => {});
          started = true;
          setSelectedCameraId(specificCameraId);
        } catch (specErr) {
          console.warn("Specific camera failed:", specErr);
        }
      }

      // 2. Pre-selected camera if available
      if (!started && selectedCameraId) {
        try {
          await html5QrCode.start(selectedCameraId, config, onScanSuccess, () => {});
          started = true;
        } catch (selErr) {
          console.warn("Selected camera failed:", selErr);
        }
      }

      // 3. Fallback hierarchy: environment -> user -> enumerated devices
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
          started = true;
        } catch (primaryErr: any) {
          const errText = typeof primaryErr === "string" ? primaryErr : String(primaryErr?.message || primaryErr || "");
          const isPermDenied = /notallowederror|permission denied|not allowed/i.test(errText);
          if (isPermDenied) throw primaryErr;

          try {
            await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
            started = true;
          } catch (fallbackErr: any) {
            const fbText = String(fallbackErr?.message || fallbackErr || "");
            if (/notallowederror|permission denied|not allowed/i.test(fbText)) throw fallbackErr;

            const devices = await getAvailableCameras(Html5Qrcode);
            if (devices.length > 0) {
              await html5QrCode.start(devices[0].id, config, onScanSuccess, () => {});
              started = true;
              setSelectedCameraId(devices[0].id);
            } else {
              throw fallbackErr;
            }
          }
        }
      }

      // Enforce iOS Safari inline video attributes on dynamically rendered video
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

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities?.();
        if (capabilities && "torch" in capabilities) {
          setTorchSupported(true);
        }
      } catch (_) {}

      // Enumerate available cameras cleanly after stream is active for lens flipping
      try {
        const cameras = await getAvailableCameras(Html5Qrcode);
        setAvailableCameras(cameras);
      } catch (_) {}
    } catch (innerErr: any) {
      const parsed = parseCameraError(innerErr);
      setCameraError(parsed);
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    await startCameraScanner(nextCam.id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    const nextTorch = !torchOn;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (torchErr) {
      console.warn("Toggle torch failed:", torchErr);
    }
  };

  const executeAutoFoodClaim = async (m: MemberLookupData) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: m.foodTokenCode,
          action: "FOOD_CLAIM",
        }),
      });
      const data = await safeJson(res, { success: false });

      if (data.success) {
        playBeep();
        triggerVibrate();
        setMessage({
          type: "success",
          text: `⚡ Auto-Claim Complete: 1x ${m.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Veg"} meal issued to ${m.name} (${m.collegeName})!`,
        });
        setDelegate((prev) =>
          prev
            ? {
                ...prev,
                foodTokenClaimed: true,
                foodClaimedAt: new Date().toISOString(),
                foodClaimedBy: "Staff",
              }
            : null
        );
        if (onCheckInComplete) onCheckInComplete();
      } else {
        setMessage({
          type: data.alreadyClaimed || data.paymentPending ? "warning" : "error",
          text: data.message || "Failed to auto-claim food token.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Auto-claim error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const executeAutoEventCheckIn = async (m: MemberLookupData, targetReg: RegistrationDetail) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: m.badgeCode,
          action: "EVENT_CHECKIN",
          eventId: targetReg.eventId,
        }),
      });
      const data = await safeJson(res, { success: false });

      if (data.success) {
        playBeep();
        triggerVibrate();
        setMessage({
          type: "success",
          text: `⚡ Auto Check-In Complete: ${m.name} (${m.collegeName}) marked Present for ${targetReg.eventName}!`,
        });
        setDelegate((prev) =>
          prev
            ? {
                ...prev,
                eventCheckedIn: true,
                registrations: prev.registrations.map((r) =>
                  r.eventId === targetReg.eventId
                    ? { ...r, attended: true, checkedInAt: new Date().toISOString() }
                    : r
                ),
              }
            : null
        );
        if (onCheckInComplete) onCheckInComplete();
      } else {
        setMessage({
          type: data.alreadyCheckedIn || data.paymentPending ? "warning" : "error",
          text: data.message || "Failed to auto-checkin event.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Auto-checkin error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLookup = async (codeToSearch?: string, isFromScan = false) => {
    const raw = (codeToSearch || inputCode).trim();
    const { code: normalized } = extractLookupCode(raw);
    const code = normalized || raw;
    if (!code) {
      setMessage({ type: "warning", text: "Please enter or scan a code." });
      return;
    }

    // Cooldown check for rapid duplicate scans (prevents duplicate requests in 3s)
    if (isFromScan) {
      const now = Date.now();
      if (
        lastScannedCodeRef.current.toUpperCase() === code.toUpperCase() &&
        now - lastScannedTimeRef.current < 3000
      ) {
        return;
      }
      lastScannedCodeRef.current = code;
      lastScannedTimeRef.current = now;
    }

    setLoading(true);
    setMessage(null);
    try {
      const typeParam = mode === "event_only" ? "&type=EVENT" : mode === "food_only" ? "&type=FOOD" : "";
      const res = await fetch(`/api/checkin?code=${encodeURIComponent(code)}${typeParam}`);
      const data = await safeJson(res, { success: false });

      if (data.isWrongType) {
        setDelegate(null);
        setMessage({
          type: "error",
          text: data.message || "Wrong pass type scanned.",
        });
        return;
      }

      if (data.success && data.member) {
        const m = data.member;
        const memberApproved = data.isApproved ?? m.isApproved ?? m.isPaid;
        const memberExpired = data.isExpired ?? m.isExpired ?? m.allEventsAttended;

        const updatedDelegate: MemberLookupData = {
          ...m,
          isApproved: memberApproved,
          isExpired: memberExpired,
          notApprovedMessage: data.notApprovedMessage,
          expiredMessage: data.expiredMessage,
        };
        setDelegate(updatedDelegate);

        if (!memberApproved) {
          setMessage({
            type: "warning",
            text: data.notApprovedMessage || `QR code is valid, but registration is NOT APPROVED yet. Please direct ${m.name} (${m.collegeName}) to Registration Desk.`,
          });
          return;
        }

        // Determine if scanned code is a food token or badge code
        const isCodeFood =
          (m.foodTokenCode && m.foodTokenCode.toUpperCase() === code.toUpperCase()) ||
          code.toUpperCase().startsWith("FT-");
        const isFoodAction = mode === "food_only" || (mode === "all" && isCodeFood);
        setTargetActionType(isFoodAction ? "food" : "event");

        if (!isFoodAction && memberExpired) {
          setMessage({
            type: "warning",
            text: data.expiredMessage || `QR Code Expired / Already Checked In: All event check-ins have already been recorded for ${m.name}.`,
          });
          return;
        }

        const isAuto = autoCheckInRef.current;
        if (isFromScan && isAuto) {
          // AUTO CLAIM / AUTO CHECK-IN IS ENABLED AND QR WAS SCANNED
          if (isFoodAction) {
            if (m.foodTokenClaimed) {
              setMessage({
                type: "warning",
                text: `Meal Already Claimed: Food token for ${m.name} was already redeemed at ${
                  m.foodClaimedAt ? formatTimeSafe(m.foodClaimedAt) : "earlier"
                } by ${m.foodClaimedBy || "staff"}.`,
              });
            } else {
              await executeAutoFoodClaim(m);
            }
          } else {
            // Event check-in: Find target registration
            const targetReg = activeEventId
              ? m.registrations?.find((r: RegistrationDetail) => r.eventId === activeEventId)
              : m.registrations?.length === 1
              ? m.registrations[0]
              : null;

            if (!targetReg) {
              if (activeEventId) {
                setMessage({
                  type: "warning",
                  text: `${m.name} (${m.collegeName}) is not registered for ${activeEventName || "this event"}.`,
                });
              } else {
                setMessage({
                  type: "warning",
                  text: `Auto Check-In Notice: ${m.name} has ${m.registrations?.length || 0} registered events. Please select which competition below.`,
                });
              }
            } else if (targetReg.attended) {
              setMessage({
                type: "warning",
                text: `Already Checked In: ${m.name} is already marked Present for ${targetReg.eventName} at ${
                  targetReg.checkedInAt ? formatTimeSafe(targetReg.checkedInAt) : "earlier"
                }.`,
              });
            } else if (!targetReg.canCheckIn) {
              setMessage({
                type: "warning",
                text: `Authorization Notice: You are not assigned to check in attendees for ${targetReg.eventName}.`,
              });
            } else {
              await executeAutoEventCheckIn(m, targetReg);
            }
          }
        } else {
          // AUTO CHECK-IN IS TURNED OFF OR MANUAL LOOKUP: Ask to Approve or Reject
          setMessage({
            type: "success",
            text: isFoodAction
              ? `Delegate Verified: ${m.name} (${m.collegeName}) • Food: ${
                  m.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Veg"
                } • Please choose to Approve or Reject below.`
              : `Delegate Verified: ${m.name} (${m.collegeName}) • Please choose to Approve or Reject check-in below.`,
          });
        }
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
        playBeep();
        triggerVibrate();
        setMessage({
          type: "success",
          text: data.message || (shouldCheckIn ? `${delegate.name} marked Present!` : `Check-in reverted.`),
        });
        // Update local delegate data
        setDelegate((prev) =>
          prev
            ? {
                ...prev,
                eventCheckedIn: shouldCheckIn,
                registrations: prev.registrations.map((r) =>
                  r.eventId === evId
                    ? {
                        ...r,
                        attended: shouldCheckIn,
                        checkedInAt: shouldCheckIn ? new Date().toISOString() : null,
                      }
                    : r
                ),
              }
            : null
        );
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
        playBeep();
        triggerVibrate();
        setMessage({
          type: "success",
          text: shouldClaim
            ? `Food Token verified! 1x ${delegate.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Veg"} meal issued to ${delegate.name}.`
            : `Food token status reset to Unclaimed.`,
        });
        setDelegate((prev) =>
          prev
            ? {
                ...prev,
                foodTokenClaimed: shouldClaim,
                foodClaimedAt: shouldClaim ? new Date().toISOString() : null,
                foodClaimedBy: shouldClaim ? "Staff" : null,
              }
            : null
        );
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
    setTargetActionType(null);
    lastScannedCodeRef.current = "";
    lastScannedTimeRef.current = 0;
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
                <span>
                  {mode === "event_only"
                    ? "QR Check-In Hub"
                    : mode === "food_only"
                    ? "Food Token Claim Hub"
                    : "QR Check-In & Food Claim Hub"}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  LIVE VERIFIER
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                {mode === "event_only"
                  ? "Scan or enter student delegate badge codes to verify competition attendance"
                  : mode === "food_only"
                  ? "Scan or enter food token QR codes to issue meal tokens"
                  : "Scan or enter student delegate badge / meal QR codes to confirm attendance and issue food"}
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
          {/* Global Scanner CSS for html5-qrcode video framing */}
          <style dangerouslySetInnerHTML={{ __html: `
            #${scannerDivId} video {
              object-fit: cover !important;
              width: 100% !important;
              max-height: 280px !important;
              border-radius: 0.75rem !important;
            }
            #${scannerDivId} img {
              display: none !important;
            }
          `}} />

          {/* Hidden File Input for QR Photo / Camera Snapshot */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileScan}
            className="hidden"
          />

          {/* Auto Check-In / Auto Claim Mode Switcher Bar */}
          <button
            type="button"
            onClick={toggleAutoCheckIn}
            className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 hover:bg-stone-100/90 active:scale-[0.98] border border-stone-200 rounded-2xl p-3 px-4 max-w-md mx-auto shadow-2xs transition text-left cursor-pointer select-none"
            title={autoCheckIn ? "Click to turn OFF (ask to approve or reject)" : "Click to turn ON (fast auto check-in)"}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  autoCheckIn ? "bg-[#FF6B1A]/15 text-[#FF6B1A]" : "bg-stone-200 text-stone-500"
                }`}
              >
                {autoCheckIn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 block leading-tight flex items-center gap-1.5">
                  <span>{mode === "food_only" ? "Auto-Claim Mode" : "Auto Check-In Mode"}</span>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                      autoCheckIn ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {autoCheckIn ? "ON" : "OFF"}
                  </span>
                </span>
                <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                  {autoCheckIn
                    ? "⚡ Scans automatically complete check-in immediately"
                    : "🛡️ Scans ask to Approve or Reject"}
                </span>
              </div>
            </div>

            <div
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0 pointer-events-none ${
                autoCheckIn ? "bg-[#FF6B1A]" : "bg-stone-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                  autoCheckIn ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </div>
          </button>

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
              onClick={() => startCameraScanner()}
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
            <div className="bg-stone-900 rounded-2xl p-4 sm:p-5 text-center text-white space-y-4 border border-stone-800 max-w-md mx-auto">
              {/* Diagnostic Error State */}
              {cameraError ? (
                <div className="space-y-3.5 py-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                      <span>{cameraError.title}</span>
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                      {cameraError.message}
                    </p>
                  </div>

                  {cameraError.steps && cameraError.steps.length > 0 && (
                    <div className="text-left bg-stone-950/80 rounded-xl p-3.5 border border-stone-800/80 max-w-sm mx-auto space-y-2">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">How to resolve:</p>
                      <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside">
                        {cameraError.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            <span className="text-stone-200">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCameraScanner()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fileScanning}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{fileScanning ? "Reading Photo..." : "Upload QR / Snap Photo"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode("manual");
                        setCameraError(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Manual Lookup</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {cameraStarting && (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                        <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Connecting camera...</span>
                      </div>
                    )}

                    <div
                      id={scannerDivId}
                      className={`w-full max-w-xs mx-auto overflow-hidden rounded-xl border-2 border-amber-400 shadow-lg ${
                        cameraActive || cameraStarting ? "block" : "hidden"
                      }`}
                    />
                  </div>

                  {cameraActive && (
                    <div className="space-y-2">
                      <p className="text-xs text-stone-300">
                        Point camera at participant&apos;s <strong>QR Code</strong>
                      </p>

                      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                        {availableCameras.length > 1 && (
                          <button
                            type="button"
                            onClick={switchCamera}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-stone-700"
                          >
                            <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
                            <span>Switch Camera ({availableCameras.length})</span>
                          </button>
                        )}

                        {torchSupported && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`tap-target px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-stone-700 ${
                              torchOn
                                ? "bg-amber-400 text-stone-950 font-bold"
                                : "bg-stone-800 hover:bg-stone-700 text-stone-200"
                            }`}
                          >
                            {torchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                            <span>{torchOn ? "Torch On" : "Flashlight"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            stopCameraScanner();
                            setScanMode("manual");
                          }}
                          className="text-xs text-stone-400 hover:text-stone-200 underline font-semibold px-2 py-1 cursor-pointer"
                        >
                          Switch to Manual Code Entry
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Manual Input Viewport */
            <div className="block max-w-md mx-auto space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. SHN27-DEL-XXXX or FT-XXXX-MEAL"
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    autoFocus={scanMode === "manual"}
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

              <div className="text-center pt-1">
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
              {/* Desk Payment & Approval Warning Banner */}
              {(!delegate.isApproved || !delegate.isPaid) ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-950 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 text-amber-800 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <span>QR Code is Valid, but NOT APPROVED</span>
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      This QR pass exists in the system, but has <strong>NOT been approved</strong> by the Registration Desk yet. Fee: <strong>₹{delegate.totalFee}</strong> ({delegate.paymentStatus}). Please direct <strong>{delegate.name}</strong> to the Registration Desk to collect payment and activate official passes before venue entry.
                    </p>
                  </div>
                </div>
              ) : delegate.allEventsAttended ? (
                <div className="bg-stone-100 border border-stone-300 rounded-2xl p-4 flex items-start gap-3.5 text-stone-900 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center shrink-0 text-stone-700 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      QR Pass Expired / Completed
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      All competition events have already been checked in for <strong>{delegate.name}</strong>. Passes are single-use and cannot be used for additional event entries.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <strong className="font-bold">Pass Active & Verified:</strong> {delegate.name} is approved. Ready for competition check-in below.
                  </div>
                </div>
              )}

              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-black text-stone-900">
                      {delegate.name}
                    </h3>
                    <span className="text-xs font-mono font-bold bg-[#FF6B1A]/10 text-[#FF6B1A] px-2 py-0.5 rounded-lg border border-[#FF6B1A]/20">
                      {delegate.badgeCode}
                    </span>
                    {(!delegate.isApproved || !delegate.isPaid) ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        PENDING APPROVAL
                      </span>
                    ) : delegate.allEventsAttended ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 border border-stone-300">
                        PASS EXPIRED
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                        APPROVED & ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{delegate.collegeName}</span>
                    {delegate.department && <span className="text-stone-500 font-normal">• {delegate.department}</span>}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Team: {delegate.teamName || "Individual"} • Lead: {delegate.teamLeadName} ({delegate.teamLeadPhone})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForNext}
                  className="self-start sm:self-auto text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-semibold underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Scan Next</span>
                </button>
              </div>

              {/* Manual Confirmation Prompt when Auto Check-In is OFF */}
              {!autoCheckIn && (() => {
                const isFoodDecision =
                  mode === "food_only" ||
                  targetActionType === "food" ||
                  (delegate.foodTokenCode && lastScannedCodeRef.current.toUpperCase() === delegate.foodTokenCode.toUpperCase()) ||
                  lastScannedCodeRef.current.toUpperCase().startsWith("FT-");

                const isApprovedOrPaid = Boolean(delegate.isApproved || delegate.isPaid);

                return (
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#FF6B1A] flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                            Action Required: Approve or Reject Check-In
                          </span>
                          <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-black border border-amber-300">
                            Auto Check-In OFF
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-black text-stone-900 mt-1">
                          {isFoodDecision
                            ? `Approve 1x ${delegate.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Veg"} meal for ${delegate.name}?`
                            : activeEventName
                            ? `Approve check-in for ${delegate.name} in ${activeEventName}?`
                            : `Approve check-in for ${delegate.name} (${delegate.collegeName})?`}
                        </p>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Auto Check-In is disabled. Please verify delegate identity and credentials, then click Approve or Reject below.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-amber-200/70 flex-wrap">
                      {!isApprovedOrPaid ? (
                        <>
                          <span className="text-xs font-bold text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-300 self-center">
                            Approval / Payment Pending at Desk
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRejectCheckIn(delegate.name)}
                            disabled={actionLoading}
                            className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>✕ Reject / Decline</span>
                          </button>
                        </>
                      ) : isFoodDecision ? (
                        !delegate.foodTokenClaimed ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleClaimFood(true)}
                              disabled={actionLoading}
                              className="tap-target px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ Approve &amp; Issue Meal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectCheckIn(delegate.name)}
                              disabled={actionLoading}
                              className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>✕ Reject / Decline</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-stone-600 bg-stone-200 px-3 py-1.5 rounded-xl text-center">
                            Meal Already Claimed
                          </span>
                        )
                      ) : activeEventId ? (
                        (() => {
                          const reg = delegate.registrations?.find((r) => r.eventId === activeEventId);
                          if (reg?.attended) {
                            return (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Already Marked Present</span>
                              </span>
                            );
                          }
                          if (reg && reg.canCheckIn) {
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCheckInEvent(true, activeEventId)}
                                  disabled={actionLoading}
                                  className="tap-target px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>✓ Approve Check-In</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectCheckIn(delegate.name)}
                                  disabled={actionLoading}
                                  className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>✕ Reject / Decline</span>
                                </button>
                              </>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => handleRejectCheckIn(delegate.name)}
                              disabled={actionLoading}
                              className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>✕ Reject / Decline</span>
                            </button>
                          );
                        })()
                      ) : delegate.registrations?.length === 1 && delegate.registrations[0].canCheckIn && !delegate.registrations[0].attended ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCheckInEvent(true, delegate.registrations[0].eventId)}
                            disabled={actionLoading}
                            className="tap-target px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ Approve for {delegate.registrations[0].eventName}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectCheckIn(delegate.name)}
                            disabled={actionLoading}
                            className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>✕ Reject / Decline</span>
                          </button>
                        </>
                      ) : delegate.registrations && delegate.registrations.some((r) => !r.attended && r.canCheckIn) ? (
                        <>
                          <div className="flex flex-wrap gap-2 items-center">
                            {delegate.registrations.filter((r) => !r.attended && r.canCheckIn).map((r) => (
                              <button
                                key={r.registrationId}
                                type="button"
                                onClick={() => handleCheckInEvent(true, r.eventId)}
                                disabled={actionLoading}
                                className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>✓ Approve: {r.eventName}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRejectCheckIn(delegate.name)}
                            disabled={actionLoading}
                            className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>✕ Reject / Decline</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-stone-500 italic self-center">
                            No pending event check-ins available
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRejectCheckIn(delegate.name)}
                            disabled={actionLoading}
                            className="tap-target px-4 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>✕ Reject / Decline</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={resetForNext}
                        className="tap-target px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/80 hover:bg-stone-200 transition cursor-pointer text-center"
                      >
                        Skip / Next
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 1. Event Registrations & Specific Venue Check-Ins */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF6B1A]" />
                    <span>Registered Events ({delegate.registrations?.length || 0})</span>
                  </h4>
                  {activeEventName && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      Your Desk: {activeEventName}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {delegate.registrations?.map((reg) => {
                    const isCurrentEvent = activeEventId && reg.eventId === activeEventId;
                    return (
                      <div
                        key={reg.registrationId}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentEvent
                            ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
                            : reg.attended
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-white border-stone-200"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">{reg.eventName}</span>
                            <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                              {reg.category}
                            </span>
                            {isCurrentEvent && (
                              <span className="text-[9px] font-black uppercase bg-[#FF6B1A] text-white px-1.5 py-0.5 rounded">
                                ACTIVE DESK
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                            {reg.venue && <span>Venue: <b>{reg.venue}</b> • </span>}
                            <span>Scheduled: {reg.dateTime ? formatTimeSafe(reg.dateTime) : "TBD"}</span>
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
                                    {formatTimeSafe(reg.checkedInAt)}
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
                          ) : (!delegate.isPaid || !delegate.isApproved) ? (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                              Approval Required at Desk
                            </span>
                          ) : reg.canCheckIn ? (
                            <button
                              type="button"
                              onClick={() => handleCheckInEvent(true, reg.eventId)}
                              disabled={actionLoading}
                              className="tap-target px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm hover:shadow-emerald-600/20 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Confirm Check-In</span>
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

              {/* 2. Food Token Voucher Claim Card (Hidden in event_only mode for event coordinators) */}
              {mode !== "event_only" && (
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-700 text-white inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>CLAIMED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-2xs">
                          READY (1x MEAL)
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (delegate.foodPreference || "VEG") === "VEG"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {(delegate.foodPreference || "VEG") === "VEG" ? "🥗 Pure Veg" : "🍗 Non-Veg"}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600">
                      Token: <strong className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">{delegate.foodTokenCode}</strong>
                      {delegate.foodTokenClaimed ? (
                        <span className="ml-2 text-stone-700 font-medium">
                          (Issued at {delegate.foodClaimedAt ? formatTimeSafe(delegate.foodClaimedAt) : "earlier"} by {delegate.foodClaimedBy || "staff"})
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
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {mode === "event_only"
                ? "Accepts Event Badge QR codes & Manual Code Entry"
                : mode === "food_only"
                ? "Accepts Food Token QR codes"
                : "Accepts both Event QR & Food QR codes"}
            </span>
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
