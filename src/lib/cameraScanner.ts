/**
 * Camera Scanner Diagnostic & Resolution Utility
 * Provides device enumeration, front/rear camera fallbacks,
 * secure context checks, and actionable permission recovery guidance.
 */

export interface CameraErrorInfo {
  type: "PERMISSION_DENIED" | "INSECURE_CONTEXT" | "NO_CAMERA" | "CAMERA_IN_USE" | "UNKNOWN";
  title: string;
  message: string;
  steps: string[];
  rawError?: any;
}

export interface CameraDeviceInfo {
  id: string;
  label: string;
  isBackCamera: boolean;
}

/**
 * Checks if the current browser window is in a secure context where
 * navigator.mediaDevices.getUserMedia is permitted by web standards.
 */
export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * Checks permission status via the modern Permissions API without triggering any browser errors.
 */
export async function getCameraPermissionStatus(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.permissions || !navigator.permissions.query) {
    return "unsupported";
  }
  try {
    const status = await navigator.permissions.query({ name: "camera" as any });
    return status.state;
  } catch {
    return "unsupported";
  }
}

/**
 * Parses any media / camera initialization error into user-friendly diagnostics
 * with actionable recovery instructions.
 */
export function parseCameraError(err: any): CameraErrorInfo {
  if (!isSecureCameraContext()) {
    const origin = typeof window !== "undefined" ? window.location.origin : "insecure origin";
    return {
      type: "INSECURE_CONTEXT",
      title: "HTTPS Required for Camera",
      message: `Your browser strictly blocks camera access on unencrypted HTTP (${origin}).`,
      steps: [
        "Open this application using https:// or on the host PC via http://localhost:3000.",
        "Browsers (Chrome, Edge, Safari, iOS, Android) forbid camera access over local network IPs without HTTPS.",
        "Alternatively, enter or paste the unique delegate code manually below.",
      ],
      rawError: err,
    };
  }

  const errStr = String(err?.message || err || "");
  const errName = String(err?.name || "");

  if (
    errName === "NotAllowedError" ||
    errName === "PermissionDeniedError" ||
    /permission denied|not allowed/i.test(errStr)
  ) {
    return {
      type: "PERMISSION_DENIED",
      title: "Camera Permission Denied",
      message: "Camera access was blocked by your browser or device permissions.",
      steps: [
        "Look at the left side of your browser address bar at the top: click the Lock (🔒) or Camera (📷) icon.",
        "Change the Camera setting from 'Block' to 'Allow'.",
        "If using Windows, check Settings > Privacy & security > Camera to ensure desktop app access is turned On.",
        "Click the 'Retry Camera Access' button below.",
      ],
      rawError: err,
    };
  }

  if (
    errName === "NotFoundError" ||
    errName === "DevicesNotFoundError" ||
    /device not found|no camera/i.test(errStr)
  ) {
    return {
      type: "NO_CAMERA",
      title: "No Camera Detected",
      message: "No working camera or video capture hardware was detected on this device.",
      steps: [
        "Ensure your webcam is plugged in, powered on, and recognized by your computer.",
        "Check that no physical privacy shutter or hardware switch is blocking the lens.",
        "Or use the Manual Code Lookup below.",
      ],
      rawError: err,
    };
  }

  if (
    errName === "NotReadableError" ||
    errName === "TrackStartError" ||
    /could not start video|in use/i.test(errStr)
  ) {
    return {
      type: "CAMERA_IN_USE",
      title: "Camera Currently In Use",
      message: "Your camera is currently being used by another program or browser tab.",
      steps: [
        "Close other applications using the camera (Zoom, Teams, Google Meet, Skype, etc.).",
        "Close any other browser tabs that may have opened the camera.",
        "Click the 'Retry Camera Access' button below.",
      ],
      rawError: err,
    };
  }

  return {
    type: "UNKNOWN",
    title: "Camera Unavailable",
    message: errStr || "Could not start video stream. Please check permissions or use manual code lookup.",
    steps: [
      "Click the 🔒 icon in your browser address bar to ensure camera permission is Allowed.",
      "Click 'Retry Camera Access' below, or switch to manual code lookup.",
    ],
    rawError: err,
  };
}

/**
 * Attempts to enumerate video input devices cleanly.
 */
export async function getAvailableCameras(Html5QrcodeClass: any): Promise<CameraDeviceInfo[]> {
  try {
    const devices = await Html5QrcodeClass.getCameras();
    if (!Array.isArray(devices)) return [];
    return devices.map((d: any) => ({
      id: d.id,
      label: d.label || `Camera ${d.id.slice(0, 6)}...`,
      isBackCamera: /back|rear|environment/i.test(d.label || ""),
    }));
  } catch (err) {
    console.warn("Camera enumeration warning:", err);
    return [];
  }
}
