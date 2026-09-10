/**
 * Utility functions for dynamic theme color calculations and CSS variable generation.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

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

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHexColor(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates the CSS rule string to apply to :root
 */
export function generateThemeCss(
  primaryAccent: string = "#FF6B1A",
  secondaryAccent: string = "#D9A441",
  bgColor: string = "#FAF8F5"
): string {
  const primaryDark = darkenColor(primaryAccent, 12);
  const primaryLight = lightenColor(primaryAccent, 12);
  const primaryGlow = hexToRgba(primaryAccent, 0.25);
  const primaryGlowStrong = hexToRgba(primaryAccent, 0.38);

  const secondaryLight = lightenColor(secondaryAccent, 12);
  const secondaryGlow = hexToRgba(secondaryAccent, 0.2);

  return `
    :root {
      --fest-ember: ${primaryAccent};
      --fest-ember-dark: ${primaryDark};
      --fest-ember-light: ${primaryLight};
      --fest-ember-glow: ${primaryGlow};
      --fest-ember-glow-strong: ${primaryGlowStrong};
      
      --fest-gold: ${secondaryAccent};
      --fest-gold-light: ${secondaryLight};
      --fest-gold-glow: ${secondaryGlow};

      --fest-bg: ${bgColor};
    }

    .hero-wordmark-gradient {
      background: linear-gradient(135deg, var(--fest-text, #1C1917) 0%, var(--fest-ember) 50%, var(--fest-gold) 100%) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }

    .btn-ember {
      background: linear-gradient(135deg, var(--fest-ember) 0%, var(--fest-ember-dark) 100%) !important;
      box-shadow: 0 4px 18px var(--fest-ember-glow) !important;
    }

    .btn-ember:hover {
      box-shadow: 0 8px 24px var(--fest-ember-glow-strong) !important;
      filter: brightness(1.06);
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
    bg: "#FAF8F5",
    description: "Signature high-energy ember and gold",
  },
  {
    id: "royal-sapphire",
    name: "Royal Tech Blue",
    institutionType: "IIT / NIT / Engineering Universities",
    primary: "#2563EB",
    secondary: "#38BDF8",
    bg: "#FAF8F5",
    description: "Deep academic sapphire with cyan highlights",
  },
  {
    id: "imperial-violet",
    name: "Imperial Amethyst",
    institutionType: "Arts, Science & Media Colleges",
    primary: "#7C3AED",
    secondary: "#F472B6",
    bg: "#FAF8F5",
    description: "Rich modern violet with vibrant rose accents",
  },
  {
    id: "emerald-campus",
    name: "Emerald Campus",
    institutionType: "Autonomous / Biotech / Eco Institutions",
    primary: "#059669",
    secondary: "#34D399",
    bg: "#FAF8F5",
    description: "Distinguished emerald green with fresh mint",
  },
  {
    id: "crimson-ruby",
    name: "Crimson Ruby",
    institutionType: "Polytechnic, Tech & Sports",
    primary: "#DC2626",
    secondary: "#FB923C",
    bg: "#FAF8F5",
    description: "Bold crimson red with fiery coral energy",
  },
  {
    id: "heritage-amber",
    name: "Heritage Golden Amber",
    institutionType: "Heritage & Centennial Institutions",
    primary: "#D97706",
    secondary: "#FBBF24",
    bg: "#FAF8F5",
    description: "Prestigious golden amber and warm ochre",
  },
  {
    id: "cyber-teal",
    name: "Cyber Teal & Aqua",
    institutionType: "Computer Science & AI Hubs",
    primary: "#0891B2",
    secondary: "#2DD4BF",
    bg: "#FAF8F5",
    description: "High-tech futuristic ocean cyan and teal",
  },
  {
    id: "obsidian-slate",
    name: "Obsidian Slate",
    institutionType: "Management & Corporate Institutes",
    primary: "#334155",
    secondary: "#94A3B8",
    bg: "#FAF8F5",
    description: "Clean executive slate and refined platinum",
  },
];

