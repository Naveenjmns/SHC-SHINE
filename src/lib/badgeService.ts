import QRCode from "qrcode";
import { randomInt } from "crypto";

// Unambiguous uppercase alphabet (no 0/O, 1/I/L) so codes can be typed from a printed badge
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Cryptographically random code segment. Badge and food codes act as bearer
 * credentials (the public /badge/<code> page and food counters accept them),
 * so they must not be guessable: 10 chars ≈ 49 bits of entropy.
 */
function randomCodeSegment(length: number = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Generates a clean, unique Delegate Badge Code.
 * Example: "SHN27-DEL-7KQ4M9XR2T"
 */
export function generateBadgeCode(editionYear: string = "2027"): string {
  const shortYear = editionYear.slice(-2);
  return `SHN${shortYear}-DEL-${randomCodeSegment()}`;
}

/**
 * Generates a unique Food & Refreshment Token code.
 * Independent of the badge code so one cannot be derived from the other.
 * Example: "FT-H3M8Q2ZK7P-MEAL"
 */
export function generateFoodTokenCode(): string {
  return `FT-${randomCodeSegment()}-MEAL`;
}

/**
 * Generates an Event Entry Pass QR Code Data URL.
 */
export async function generateEventPassQr(payload: {
  badgeCode: string;
  name: string;
  college?: string;
  verifyUrl?: string;
}): Promise<string> {
  try {
    const rawContent = payload.verifyUrl || payload.badgeCode;

    return await QRCode.toDataURL(rawContent, {
      errorCorrectionLevel: "M",
      margin: 3,
      scale: 8,
      color: {
        dark: "#000000", // Pure pitch black for maximum camera optical contrast
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating Event Pass QR code:", error);
    return "";
  }
}

/**
 * Generates a Food & Meal Token QR Code Data URL.
 * Optimized for high-speed scanning at food counters under varied ambient lighting.
 */
export async function generateFoodTokenQr(payload: {
  foodTokenCode: string;
  badgeCode: string;
  name: string;
  foodPreference?: string;
  verifyUrl?: string;
}): Promise<string> {
  try {
    // Ultra-high scannability: Use direct foodTokenCode (e.g. "FT-4819AB-MEAL").
    // A concise 14-character payload produces a Version 1/2 QR code with large, chunky modules
    // that decode instantly under camera video streams.
    const rawContent = payload.verifyUrl || payload.foodTokenCode;

    return await QRCode.toDataURL(rawContent, {
      errorCorrectionLevel: "M",
      margin: 3,
      scale: 8,
      color: {
        dark: "#000000", // Pure high-contrast black for 100% optical camera recognition
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating Food Token QR code:", error);
    return "";
  }
}

/**
 * Generates a scannable QR code data URL representing the delegate pass (backward compatibility).
 */
export async function generateQrCodeDataUrl(payload: {
  badgeCode: string;
  name: string;
  college: string;
  foodTokenCode: string;
  verifyUrl?: string;
}): Promise<string> {
  return generateEventPassQr({
    badgeCode: payload.badgeCode,
    name: payload.name,
    college: payload.college,
    verifyUrl: payload.verifyUrl,
  });
}
