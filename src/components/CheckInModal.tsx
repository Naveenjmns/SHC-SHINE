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
  CameraOff,
  Utensils,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  RotateCcw,
  Sparkles,
  Check,
  Upload,
  SwitchCamera,
  Zap,
  ZapOff,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";
import {
  parseCameraError,
  getAvailableCameras,
  getCameraPermissionStatus,
  isSecureCameraContext,
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
        handleLookup(decodedText);
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

      // Dynamic qrbox calculation: 70% of viewport width up to 250px
      const containerWidth = scannerEl.clientWidth || 300;
      const boxSize = Math.min(250, Math.max(180, Math.floor(containerWidth * 0.7)));

      const config = {
        fps: 12,
        qrbox: { width: boxSize, height: boxSize },
        aspectRatio: 1.0,
      };

      const onScanSuccess = (decodedText: string) => {
        console.log("QR Decoded successfully:", decodedText);
        playBeep();
        triggerVibrate();
        handleLookup(decodedText);
        stopCameraScanner();
      };

      // Determine camera target: specificCameraId -> selectedCameraId -> environment (rear camera)
      let targetConfig: any;
      if (specificCameraId) {
        targetConfig = specificCameraId;
      } else if (selectedCameraId && availableCameras.some((c) => c.id === selectedCameraId)) {
        targetConfig = selectedCameraId;
      } else {
        targetConfig = { facingMode: "environment" };
      }

      // Start stream: invokes getUserMedia which triggers browser permission prompt if needed
      try {
        await html5QrCode.start(targetConfig, config, onScanSuccess, () => {});
      } catch (primaryErr: any) {
        const errText = typeof primaryErr === "string" ? primaryErr : String(primaryErr?.message || primaryErr || "");
        const isPermDenied = /notallowederror|permission denied|not allowed/i.test(errText);

        // If rear camera failed for constraint reasons (not permission denied), fallback to user/front facing camera
        if (!isPermDenied && typeof targetConfig === "object" && targetConfig.facingMode === "environment") {
          try {
            await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
          } catch (fallbackErr: any) {
            throw fallbackErr;
          }
        } else {
          throw primaryErr;
        }
      }

      // Enforce iOS Safari inline video attributes on dynamically rendered video
      if (scannerEl) {
        const vids = scannerEl.getElementsByTagName("video");
        for (let i = 0; i < vids.length; i++) {
          vids[i].setAttribute("playsinline", "true");
          vids[i].setAttribute("webkit-playsinline", "true");
          vids[i].setAttribute("muted", "true");
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
          text: data.message || (shouldCheckIn ? `${delegate.name} marked Present!` : `Check-in reverted.`),
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
            ? `Food Token verified! 1x Meal issued to ${delegate.name}.`
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
                        cameraActive ? "block" : "hidden"
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

              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <span>{delegate.name}</span>
                    <span className="text-xs font-mono font-bold bg-[#FF6B1A]/10 text-[#FF6B1A] px-2 py-0.5 rounded-lg border border-[#FF6B1A]/20">
                      {delegate.badgeCode}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{delegate.collegeName}</span>
                    {delegate.department && <span>• {delegate.department}</span>}
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
