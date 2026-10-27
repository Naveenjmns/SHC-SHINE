/**
 * Color Utilities for Dynamic Theme Adaptation (Phase 1)
 * Computes WCAG AA-compliant contrast ratios, auto-derives hover/active/muted
 * variants, and generates CSS variables for dynamic EventEdition themes.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses any 3 or 6 digit hex color string into an RGB object.
 */
export function parseHexColor(hex: string): RgbColor {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) {
    return { r: 255, g: 107, b: 26 }; // Fallback to #FF6B1A
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    "#" +
    [r, g, b]
      .map((x) => clamp(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHexColor(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calculates relative luminance according to WCAG 2.1 specifications.
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes contrast ratio between two hex colors (returns value between 1 and 21).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);
  const l1 = calculateLuminance(c1.r, c1.g, c1.b);
  const l2 = calculateLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if the contrast ratio satisfies WCAG AA (>= 4.5:1 for body, >= 3.0:1 for large text).
 */
export function isContrastSafe(textColor: string, bgColor: string, minRatio: number = 4.5): boolean {
  return getContrastRatio(textColor, bgColor) >= minRatio;
}

/**
 * Determines whether text on a background color should be white or near-black for WCAG AA compliance.
 */
export function getContrastSafeInk(bgHex: string): string {
  const contrastWithWhite = getContrastRatio("#FFFFFF", bgHex);
  const contrastWithBlack = getContrastRatio("#0C0A09", bgHex);
  return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#0C0A09";
}

export function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = parseHexColor(hex);
  const factor = 1 - percent / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = parseHexColor(hex);
  const factor = percent / 100;
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

export interface DerivedAccentPalette {
  accent: string;
  accentHover: string;
  accentActive: string;
  accentMuted: string;
  accentInk: string;
  gold: string;
  goldHover: string;
  goldMuted: string;
  goldInk: string;
  surfaceOverride?: string;
}

/**
 * Auto-derives all required token variants for primary and secondary accents.
 */
export function deriveAccentPalette(
  primaryHex: string = "#FF6B1A",
  secondaryHex: string = "#D9A441",
  bgHex?: string
): DerivedAccentPalette {
  const primaryRgb = parseHexColor(primaryHex);
  const primaryLum = calculateLuminance(primaryRgb.r, primaryRgb.g, primaryRgb.b);

  // If primary accent is very light, hover should darken; if dark, hover should lighten
  const accentHover = primaryLum > 0.4 ? darkenColor(primaryHex, 10) : lightenColor(primaryHex, 10);
  const accentActive = primaryLum > 0.4 ? darkenColor(primaryHex, 18) : darkenColor(primaryHex, 10);
  const accentMuted = hexToRgba(primaryHex, 0.10);
  const accentInk = getContrastSafeInk(primaryHex);

  const secondaryRgb = parseHexColor(secondaryHex);
  const secondaryLum = calculateLuminance(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  const goldHover = secondaryLum > 0.4 ? darkenColor(secondaryHex, 10) : lightenColor(secondaryHex, 10);
  const goldMuted = hexToRgba(secondaryHex, 0.12);
  const goldInk = getContrastSafeInk(secondaryHex);

  return {
    accent: primaryHex,
    accentHover,
    accentActive,
    accentMuted,
    accentInk,
    gold: secondaryHex,
    goldHover,
    goldMuted,
    goldInk,
    surfaceOverride: bgHex,
  };
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/**
 * Generates the CSS rule string to apply to :root and [data-theme="dark"]
 * Zero decorative gradients, zero glowing drop-shadows.
 */
export function generateThemeCss(
  primaryAccent: string = "#FF6B1A",
  secondaryAccent: string = "#D9A441",
  bgColor: string = "#FFFFFF"
): string {
  // SECURITY: The output is injected into a <style> tag, so only plain hex colours may pass through
  primaryAccent = isHexColor(primaryAccent) ? primaryAccent : "#FF6B1A";
  secondaryAccent = isHexColor(secondaryAccent) ? secondaryAccent : "#D9A441";
  bgColor = isHexColor(bgColor) ? bgColor : "#FFFFFF";
  const palette = deriveAccentPalette(primaryAccent, secondaryAccent, bgColor);

  return `
    :root {
      --accent: ${palette.accent};
      --accent-hover: ${palette.accentHover};
      --accent-active: ${palette.accentActive};
      --accent-muted: ${palette.accentMuted};
      --accent-ink: ${palette.accentInk};

      --gold: ${palette.gold};
      --gold-hover: ${palette.goldHover};
      --gold-muted: ${palette.goldMuted};
      --gold-ink: ${palette.goldInk};

      /* Legacy compatibility mappings for migration phase */
      --fest-ember: ${palette.accent};
      --fest-ember-dark: ${palette.accentHover};
      --fest-ember-light: ${palette.accentActive};
      --fest-ember-glow: ${palette.accentMuted};
      
      --fest-gold: ${palette.gold};
      --fest-gold-light: ${palette.goldHover};
      --fest-gold-glow: ${palette.goldMuted};
      
      --fest-bg: ${bgColor};
    }
  `;
}

export interface ThemePreset {
  id: string;
  name: string;
  institutionType: string;
  primary: string;
  secondary: string;
  bg: string;
  description: string;
}

export const INSTITUTION_THEME_PRESETS: ThemePreset[] = [
  {
    id: "shine-orange",
    name: "SHINE Solar Ember",
    institutionType: "Sacred Heart College (Default)",
    primary: "#FF6B1A",
    secondary: "#D9A441",
    bg: "#FFFFFF",
    description: "Signature high-energy ember and award gold",
  },
  {
    id: "royal-sapphire",
    name: "Royal Tech Blue",
    institutionType: "Engineering Universities",
    primary: "#2563EB",
    secondary: "#D9A441",
    bg: "#FFFFFF",
    description: "Deep academic sapphire with gold awards",
  },
  {
    id: "emerald-campus",
    name: "Emerald Campus",
    institutionType: "Autonomous & Tech Institutions",
    primary: "#059669",
    secondary: "#D9A441",
    bg: "#FFFFFF",
    description: "Distinguished emerald green with gold awards",
  },
  {
    id: "crimson-ruby",
    name: "Crimson Ruby",
    institutionType: "Polytechnic & Tech Institutions",
    primary: "#DC2626",
    secondary: "#D9A441",
    bg: "#FFFFFF",
    description: "Bold crimson red with gold awards",
  },
  {
    id: "obsidian-slate",
    name: "Obsidian Slate",
    institutionType: "Management & Corporate Institutes",
    primary: "#334155",
    secondary: "#D9A441",
    bg: "#FFFFFF",
    description: "Clean executive slate with gold awards",
  },
];
