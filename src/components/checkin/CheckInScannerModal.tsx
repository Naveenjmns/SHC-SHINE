"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Badge } from "@/components/ui";
import { Camera, CameraOff, SwitchCamera, AlertCircle, RefreshCw, Zap, ZapOff } from "lucide-react";
import {
  parseCameraError,
  getAvailableCameras,
  getCameraPermissionStatus,
  isSecureCameraContext,
  CameraDeviceInfo,
  CameraErrorInfo,
} from "@/lib/cameraScanner";

interface CheckInScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export default function CheckInScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan Delegate QR Code",
}: CheckInScannerModalProps) {
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const scannerRef = useRef<any>(null);
  const scannerContainerId = "checkin-scanner-viewport";
  // Bumped by "Retry Camera" to restart the scanner with the same camera selection
  const [startAttempt, setStartAttempt] = useState(0);

  // Latest callbacks, so the running scanner never calls a stale onScanSuccess/onClose
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onCloseRef.current = onClose;
  });

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScannerActive(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch (e) {
      console.error("Error stopping checkin scanner:", e);
    }
  };

  // List cameras when opened. Before permission is granted browsers return devices with an empty
  // deviceId, so those are ignored and the scanner falls back to facingMode (which prompts).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getAvailableCameras()
      .then((cams) => {
        if (cancelled) return;
        const usable = cams.filter((c) => c.id);
        setCameras(usable);
        if (usable.length > 0) {
          const backCam = usable.find((c) => /back|rear|environment/i.test(c.label));
          setSelectedCameraId((prev) => prev ?? (backCam ? backCam.id : usable[0].id));
        }
      })
      .catch((err) => !cancelled && setCameraError(parseCameraError(err)));
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Start Html5Qrcode whenever the modal opens, the camera changes or a retry is requested
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let scanner: any = null;
    let hasFired = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        await stopScanner();
        scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        await scanner.start(
          selectedCameraId || { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // The decoder keeps firing until stopped; report only the first read
            if (hasFired) return;
            hasFired = true;
            onScanSuccessRef.current(decodedText);
            onCloseRef.current();
          },
          () => {}
        );

        if (!isMounted) {
          // Closed while the camera was starting: stop the stream we just opened
          await scanner.stop().catch(() => {});
          await scanner.clear();
          return;
        }
        setScannerActive(true);
        setCameraError(null);

        // Permission is granted now, so real device ids/labels are available for switching
        if (!selectedCameraId) {
          const cams = (await getAvailableCameras()).filter((c) => c.id);
          if (isMounted) setCameras(cams);
        }
      } catch (err) {
        if (isMounted) {
          setCameraError(parseCameraError(err));
          setScannerActive(false);
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current === scanner) stopScanner();
    };
  }, [isOpen, selectedCameraId, startAttempt]);

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIdx = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIdx].id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !scannerActive) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch not supported on this device");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Point camera at delegate badge QR code"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Scanner Viewport */}
        <div className="relative rounded-2xl bg-[#071E33] overflow-hidden border border-border aspect-square flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Scanner Overlay Box */}
          {scannerActive && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 rounded-2xl border-2 border-accent border-dashed animate-pulse" />
            </div>
          )}

          {/* Error Message */}
          {cameraError && (
            <div className="absolute inset-0 p-6 bg-surface/95 flex flex-col items-center justify-center text-center space-y-3 z-10">
              <AlertCircle className="w-8 h-8 text-danger" />
              <div className="text-[15px] font-semibold text-ink">{cameraError.title}</div>
              <p className="text-sm text-ink-muted">{cameraError.message}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCameraError(null);
                  setStartAttempt((n) => n + 1);
                }}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Camera
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          {cameras.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={switchCamera}
              leftIcon={<SwitchCamera className="w-3.5 h-3.5" />}
            >
              Switch Camera
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleTorch}
            leftIcon={torchOn ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          >
            {torchOn ? "Flash Off" : "Flash On"}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

