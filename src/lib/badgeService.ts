import QRCode from "qrcode";

/**
 * Generates a clean, unique Delegate Badge Code.
 * Example: "SHN27-DEL-4819"
 */
export function generateBadgeCode(editionYear: string = "2027"): string {
  const shortYear = editionYear.slice(-2);
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampPart = Date.now().toString(36).slice(-2).toUpperCase();
  return `SHN${shortYear}-DEL-${timestampPart}${randomHex}`;
}

/**
 * Generates a unique Food & Refreshment Token code.
 * Example: "FT-4819-MEAL"
 */
export function generateFoodTokenCode(badgeCode?: string): string {
  const seed = badgeCode ? badgeCode.split("-").pop() || "" : Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `FT-${seed}${randomSuffix}-MEAL`;
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
    const rawContent =
      payload.verifyUrl ||
      JSON.stringify({
        type: "EVENT_ENTRY",
        code: payload.badgeCode,
        name: payload.name,
        college: payload.college || "",
      });

    return await QRCode.toDataURL(rawContent, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#1C1917",
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
 */
export async function generateFoodTokenQr(payload: {
  foodTokenCode: string;
  badgeCode: string;
  name: string;
  foodPreference?: string;
  verifyUrl?: string;
}): Promise<string> {
  try {
    const rawContent =
      payload.verifyUrl ||
      JSON.stringify({
        type: "FOOD_TOKEN",
        code: payload.foodTokenCode,
        badge: payload.badgeCode,
        name: payload.name,
        diet: payload.foodPreference || "VEG",
      });

    return await QRCode.toDataURL(rawContent, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#78350F", // Amber-900 warm tone for food court scanner
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
