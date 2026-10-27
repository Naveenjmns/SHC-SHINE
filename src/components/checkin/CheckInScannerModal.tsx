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

  // Check cameras when opened
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    async function initCameras() {
      try {
        const cams = await getAvailableCameras();
        setCameras(cams);
        if (cams.length > 0) {
          // Prefer back camera if available
          const backCam = cams.find((c) => c.label.toLowerCase().includes("back"));
          setSelectedCameraId(backCam ? backCam.id : cams[0].id);
        }
      } catch (err) {
        setCameraError(parseCameraError(err));
      }
    }
    initCameras();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Start Html5Qrcode when camera ID is selected
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return;

    let isMounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        if (scannerRef.current) {
          await stopScanner();
        }

        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        await scanner.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            onScanSuccess(decodedText);
            onClose();
          },
          () => {}
        );

        if (isMounted) {
          setScannerActive(true);
          setCameraError(null);
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
      stopScanner();
    };
  }, [isOpen, selectedCameraId]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.error("Error stopping checkin scanner:", e);
      } finally {
        scannerRef.current = null;
        setScannerActive(false);
      }
    }
  };

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
              <div className="text-sm font-semibold text-ink">{cameraError.title}</div>
              <p className="text-xs text-ink-muted">{cameraError.message}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCameraId(selectedCameraId)}
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

