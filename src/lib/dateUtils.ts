/**
 * Cross-browser safe date parsing and formatting utility.
 * Resolves Safari and WebKit quirks where space-separated ISO strings return Invalid Date (NaN).
 */

export function parseDateSafe(
  input: string | number | Date | null | undefined
): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Safari fix: Replace space between date and time with 'T' if not already ISO
    // e.g., "2026-09-17 09:30:00" -> "2026-09-17T09:30:00"
    const normalized =
      trimmed.includes(" ") && !trimmed.includes("T")
        ? trimmed.replace(" ", "T")
        : trimmed;

    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;

    // Direct fallback
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  return null;
}

export function formatDateSafe(
  input: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-IN"
): string {
  const d = parseDateSafe(input);
  if (!d) return "—";
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    return "—";
  }
}

export function formatTimeSafe(
  input: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-IN"
): string {
  const d = parseDateSafe(input);
  if (!d) return "—";
  try {
    return d.toLocaleTimeString(locale, options);
  } catch {
    return "—";
  }
}

export function formatDateTimeSafe(
  input: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-IN"
): string {
  const d = parseDateSafe(input);
  if (!d) return "—";
  try {
    return d.toLocaleString(locale, options);
  } catch {
    return "—";
  }
}
