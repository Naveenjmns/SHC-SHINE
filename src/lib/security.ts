/**
 * Security utilities for the SHINE event management platform.
 * Provides rate limiting, input sanitization, and secure error handling.
 */

// ─── In-Memory Rate Limiter (Token Bucket) ─────────────────────────────────
interface RateBucket {
  tokens: number;
  lastRefill: number;
}

const rateBuckets = new Map<string, RateBucket>();

// Clean up stale buckets every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BUCKET_STALE_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleBuckets() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now - bucket.lastRefill > BUCKET_STALE_MS) {
      rateBuckets.delete(key);
    }
  }
}

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier (e.g., IP + route)
 * @param maxTokens - Maximum number of tokens (burst capacity)
 * @param refillRatePerSec - Tokens refilled per second
 * @returns {allowed: boolean, retryAfterMs: number}
 */
export function checkRateLimit(
  key: string,
  maxTokens: number,
  refillRatePerSec: number
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  cleanupStaleBuckets();

  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: maxTokens - 1, lastRefill: now };
    rateBuckets.set(key, bucket);
    return { allowed: true, retryAfterMs: 0, remaining: bucket.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRatePerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterMs: 0, remaining: Math.floor(bucket.tokens) };
  }

  // Calculate retry-after time
  const deficit = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil((deficit / refillRatePerSec) * 1000);
  return { allowed: false, retryAfterMs, remaining: 0 };
}

// ─── Input Sanitization ─────────────────────────────────────────────────────

/**
 * Sanitize and truncate a string input.
 */
export function sanitizeString(
  input: unknown,
  maxLength: number = 500
): string {
  if (typeof input !== "string") return "";
  // Remove null bytes, trim whitespace, and limit length
  return input
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate email format (basic RFC 5322 subset).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (digits, spaces, dashes, parentheses, plus sign).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || phone.length > 20) return false;
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  return phoneRegex.test(phone);
}

// ─── Secure Error Handling ──────────────────────────────────────────────────

/**
 * Build a safe error response that never leaks internal details.
 * Logs the actual error server-side for debugging.
 */
export function buildSecureErrorResponse(
  error: unknown,
  context: string,
  fallbackMessage: string = "An unexpected error occurred. Please try again."
): { message: string; logMessage: string } {
  const err = error instanceof Error ? error : new Error(String(error));

  // Log full error server-side
  console.error(`[${context}]`, err.message, err.stack);

  return {
    message: fallbackMessage,
    logMessage: err.message,
  };
}

// ─── IP Extraction ──────────────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// ─── SMTP Password Encryption ───────────────────────────────────────────────
// Uses AES-256-GCM with NEXTAUTH_SECRET as the encryption key

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set for encryption operations");
  }
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64 string containing IV + ciphertext + auth tag.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack as: IV (16) + Tag (16) + Ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return `enc:${combined.toString("base64")}`;
}

/**
 * Decrypt a string that was encrypted with encryptSecret.
 * If the input is not encrypted (no "enc:" prefix), returns it as-is for backward compatibility.
 */
export function decryptSecret(encryptedString: string): string {
  if (!encryptedString) return "";
  // Backward compatibility: if not encrypted, return as-is
  if (!encryptedString.startsWith("enc:")) return encryptedString;

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedString.slice(4), "base64");
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
