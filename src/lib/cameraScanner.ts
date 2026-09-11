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
      title: "HTTPS Required for Camera on Mobile / LAN",
      message: `Your browser strictly blocks live camera access on unencrypted HTTP (${origin}).`,
      steps: [
        "Modern mobile browsers (Chrome, Safari, Edge, Samsung Internet) require HTTPS or localhost to access the camera.",
        "If testing locally from a mobile phone over Wi-Fi, run the dev server with HTTPS: 'npm run dev:https' or use ngrok/Cloudflare tunnel.",
        "In Chrome on Android, you can also enable: chrome://flags/#unsafely-treat-insecure-origin-as-secure and add your local IP.",
        "Instant fallback: Tap 'Upload QR / Snap Photo' below to scan using your phone's built-in camera app without HTTPS restrictions!",
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
      title: "Camera Permission Needed",
      message: "Camera access was denied or blocked by your browser or operating system settings.",
      steps: [
        "Mobile (Chrome / Edge / PWA): Tap the tune/settings icon (🔒 or ⚙️) in the address bar → Site Settings → Camera → tap 'Allow' or 'Reset'.",
        "iOS Safari / PWA: Open iOS Settings → Safari (or the installed PWA) → Camera → select 'Allow' or 'Ask'.",
        "Android System: Open Android Settings → Apps → Chrome/SHINE → Permissions → Camera → 'Allow only while using the app'.",
        "Laptops (Windows/Mac): Check Windows Privacy settings (Win+I → Privacy → Camera → On) or Mac System Preferences → Privacy → Camera.",
        "Instant fallback: Tap 'Upload QR / Snap Photo' below to capture a picture of the QR code immediately!",
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
        "Ensure your device has a functional camera sensor.",
        "Check that no physical privacy shutter or hardware switch is covering the lens.",
        "Use 'Upload QR / Snap Photo' or Manual Code Lookup below.",
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
      message: "The camera sensor is currently held by another program, tab, or background process.",
      steps: [
        "Close any other apps using the camera (Zoom, Teams, Google Meet, WhatsApp, Camera app).",
        "Close other browser tabs that may have opened the camera.",
        "Tap 'Retry Camera Access' below.",
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
      "Tap 'Retry Camera Access' below, or tap 'Upload QR / Snap Photo'.",
    ],
    rawError: err,
  };
}

/**
 * Attempts to enumerate video input devices cleanly without opening a dummy media stream.
 */
export async function getAvailableCameras(Html5QrcodeClass?: any): Promise<CameraDeviceInfo[]> {
  try {
    // Prefer navigator.mediaDevices.enumerateDevices to avoid opening/stopping streams
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length > 0) {
        return videoDevices.map((d, index) => ({
          id: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          isBackCamera: /back|rear|environment/i.test(d.label || "") || (videoDevices.length > 1 && index === 0),
        }));
      }
    }

    if (Html5QrcodeClass && typeof Html5QrcodeClass.getCameras === "function") {
      const devices = await Html5QrcodeClass.getCameras();
      if (!Array.isArray(devices)) return [];
      return devices.map((d: any, index: number) => ({
        id: d.id,
        label: d.label || `Camera ${index + 1}`,
        isBackCamera: /back|rear|environment/i.test(d.label || "") || (devices.length > 1 && index === 0),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extracts normalized clean code from scanned QR or typed input.
 * Handles raw badge codes, food token codes, URLs, and JSON stringified payloads.
 */
export function extractLookupCode(rawInput: string): { code: string; typeHint?: "EVENT" | "FOOD" } {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) return { code: "" };

  // 1. Handle JSON encoded QR codes: e.g. {"type":"FOOD_TOKEN","code":"FT-..."}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.code) {
        return {
          code: String(parsed.code).toUpperCase().trim(),
          typeHint: parsed.type === "FOOD_TOKEN" ? "FOOD" : "EVENT",
        };
      }
      if (parsed.b) return { code: String(parsed.b).toUpperCase().trim(), typeHint: "EVENT" };
      if (parsed.f) return { code: String(parsed.f).toUpperCase().trim(), typeHint: "FOOD" };
    } catch {
      // Fall through to plain text
    }
  }

  // 2. Handle URLs like https://.../badge/SHN27-DEL-XXXX or /badge/SHN27-DEL-XXXX
  if (trimmed.includes("/badge/")) {
    const parts = trimmed.split("/badge/");
    const slug = parts[parts.length - 1].split(/[?#]/)[0];
    return { code: slug.toUpperCase().trim(), typeHint: "EVENT" };
  }

  // 3. Handle URLs like https://.../food?code=FT-XXXX or /food/claim/FT-XXXX
  if (trimmed.includes("/food")) {
    try {
      const url = new URL(trimmed, "http://localhost");
      const c = url.searchParams.get("code") || url.pathname.split("/").pop();
      if (c && c !== "food") {
        return { code: c.toUpperCase().trim(), typeHint: "FOOD" };
      }
    } catch {
      const match = trimmed.match(/[?&]code=([^&#]+)/);
      if (match) {
        return { code: decodeURIComponent(match[1]).toUpperCase().trim(), typeHint: "FOOD" };
      }
    }
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith("FT-")) {
    return { code: upper, typeHint: "FOOD" };
  }

  return { code: upper };
}
