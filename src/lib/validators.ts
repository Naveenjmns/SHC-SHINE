/**
 * Validation utilities for Email and Mobile Numbers across SHINE 26
 */

/**
 * Validate email address format requiring valid username, domain, and TLD.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // RFC 5322 compatible regex requiring at least one period in domain and 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  // Ensure TLD has at least 2 characters (e.g. .com, .edu, .in)
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split(".");
  const tld = domainParts[domainParts.length - 1];
  return tld.length >= 2;
}

/**
 * Returns a human-friendly error message if email is invalid, or null if valid.
 */
export function getEmailError(email: string, fieldName = "Email"): string | null {
  if (!email || !email.trim()) {
    return `${fieldName} is required.`;
  }
  if (!isValidEmail(email)) {
    return `Please enter a valid email address (e.g., student@college.edu).`;
  }
  return null;
}

/**
 * Validate mobile number (supports 10-digit Indian mobile numbers with optional +91, 0, or dashes/spaces,
 * as well as 10-15 digit international standard numbers).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();

  // Basic allowed characters: digits, spaces, dashes, +, parentheses
  if (!/^[+]?[\d\s()-]{10,20}$/.test(trimmed)) {
    return false;
  }

  // Extract pure digits
  const digits = trimmed.replace(/\D/g, "");

  // Indian 10-digit mobile number: must start with 6, 7, 8, or 9
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }

  // With leading 0 (11 digits): e.g. 09840123456
  if (digits.length === 11 && digits.startsWith("0")) {
    return /^[6-9]\d{9}$/.test(digits.slice(1));
  }

  // With +91 country code (12 digits): e.g. 919840123456
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(digits.slice(2));
  }

  // General valid international mobile format (10 to 15 digits)
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Returns a human-friendly error message if mobile number is invalid, or null if valid.
 */
export function getPhoneError(phone: string, fieldName = "Mobile number"): string | null {
  if (!phone || !phone.trim()) {
    return `${fieldName} is required.`;
  }
  if (!isValidPhone(phone)) {
    return `Please enter a valid 10-digit mobile number (e.g., 9876543210 or +91 9876543210).`;
  }
  return null;
}

/**
 * Format mobile number cleanly to "+91 XXXXX XXXXX" or normalized digits
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const raw = digits.slice(2);
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  }
  return phone.trim();
}
