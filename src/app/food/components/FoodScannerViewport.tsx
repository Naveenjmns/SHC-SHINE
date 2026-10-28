"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, RefreshCw, Upload, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui";
import {
  parseCameraError,
  getAvailableCameras,
  isSecureCameraContext,
  CameraErrorInfo,
  CameraDeviceInfo,
} from "@/lib/cameraScanner";

interface FoodScannerViewportProps {
  scannerDivId: string;
  onDetectedCode: (code: string) => void;
  processing: boolean;
  autoClaim: boolean;
  onToggleAutoClaim: () => void;
}

export default function FoodScannerViewport({
  scannerDivId,
  onDetectedCode,
  processing,
  autoClaim,
  onToggleAutoClaim,
}: FoodScannerViewportProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [fileScanning, setFileScanning] = useState(false);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingCameraRef = useRef(false);

  const stopScanner = async () => {
    if (isStoppingCameraRef.current) return;
    isStoppingCameraRef.current = true;
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) {
          try {
            await scannerRef.current.stop();
          } catch (_) {}
        }
        try {
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
      }
    } finally {
      try {
        const container = document.getElementById(scannerDivId);
        if (container) {
          const videos = container.getElementsByTagName("video");
          for (let i = 0; i < videos.length; i++) {
            const stream = videos[i].srcObject as MediaStream | null;
            stream?.getTracks?.().forEach((t) => {
              try {
                t.stop();
              } catch (_) {}
            });
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

      if (!isSecureCameraContext()) {
        setCameraError(parseCameraError(new Error("Insecure context")));
        setCameraActive(false);
        return;
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraError({
          type: "INSECURE_CONTEXT",
          title: "Camera Access Unavailable",
          message: "Live video stream access blocked by browser.",
          steps: ["Use photo upload fallback or manual code search."],
        });
        setCameraActive(false);
        return;
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      if (scannerRef.current) await stopScanner();

      let scannerEl = document.getElementById(scannerDivId);
      if (!scannerEl) {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 40));
          scannerEl = document.getElementById(scannerDivId);
          if (scannerEl) break;
        }
      }
      if (!scannerEl) throw new Error("Scanner viewport could not initialize.");

      const qr = new Html5Qrcode(scannerDivId, false);
      scannerRef.current = qr;

      const config: any = {
        fps: 20,
        qrbox: (w: number, h: number) => {
          const edge = Math.min(w, h);
          const size = Math.max(160, Math.min(280, Math.floor(edge * 0.78)));
          return { width: size, height: size };
        },
      };

      const targetCam = specificCameraId || selectedCameraId;
      if (targetCam) {
        try {
          await qr.start(targetCam, config, onDetectedCode, () => {});
          setSelectedCameraId(targetCam);
        } catch (_) {}
      }

      if (!scannerRef.current?.isScanning) {
        try {
          await qr.start({ facingMode: "environment" }, config, onDetectedCode, () => {});
        } catch (_) {
          await qr.start({ facingMode: "user" }, config, onDetectedCode, () => {});
        }
      }

      setCameraActive(true);
      const cameras = await getAvailableCameras(Html5Qrcode);
      setAvailableCameras(cameras);
    } catch (err: any) {
      setCameraError(parseCameraError(err));
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const idx = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextCam = availableCameras[(idx + 1) % availableCameras.length];
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
      const text = await qrScanner.scanFile(file, false);
      qrScanner.clear();
      if (text) onDetectedCode(text);
    } catch (_) {
    } finally {
      setFileScanning(false);
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Camera Viewport</h2>
          <p className="text-sm text-ink-muted">Scan delegate badge or food voucher QR code</p>
        </div>

        <button
          type="button"
          onClick={onToggleAutoClaim}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-sm font-semibold transition-colors cursor-pointer ${
            autoClaim
              ? "bg-accent-muted border-accent text-accent-strong"
              : "bg-surface-raised border-border text-ink-muted"
          }`}
        >
          {autoClaim ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
          <span>Auto-Claim: {autoClaim ? "ON" : "OFF"}</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border bg-[#071E33] min-h-[260px] flex items-center justify-center">
        <div id={scannerDivId} className="w-full h-full max-h-[360px]" />

        {!cameraActive && !cameraStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-raised">
            <Camera className="w-8 h-8 text-ink-muted mb-2" />
            <p className="text-sm font-semibold text-ink mb-1">Camera is Inactive</p>
            <p className="text-sm text-ink-muted max-w-xs mb-4">
              Start camera to scan physical passes or upload a QR snapshot.
            </p>
            <Button variant="primary" size="sm" onClick={() => startScanner()} className="gap-2">
              <Camera className="w-4 h-4" />
              Start Camera
            </Button>
          </div>
        )}

        {cameraStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071E33]/90 text-white p-4">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mb-2" />
            <p className="text-sm font-semibold text-[#C9D7E6]">Initializing camera hardware...</p>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm font-semibold text-ink">Verifying &amp; Claiming Meal...</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mt-3 p-3 rounded-xl border border-danger-border bg-danger-surface text-sm text-danger-ink">
          <p className="font-semibold">{cameraError.title}</p>
          <p className="mt-0.5 text-xs opacity-90">{cameraError.message}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {cameraActive ? (
            <Button variant="outline" size="sm" onClick={stopScanner} className="text-sm">
              <CameraOff className="w-3.5 h-3.5 mr-1" />
              Stop Camera
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => startScanner()} className="text-sm">
              <Camera className="w-3.5 h-3.5 mr-1" />
              Start Camera
            </Button>
          )}

          {availableCameras.length > 1 && cameraActive && (
            <Button variant="ghost" size="sm" onClick={switchCamera} className="text-sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Switch Camera
            </Button>
          )}
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={fileScanning}
            className="text-sm text-ink-muted hover:text-ink"
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            Upload QR Photo
          </Button>
        </div>
      </div>
    </div>
  );
}

