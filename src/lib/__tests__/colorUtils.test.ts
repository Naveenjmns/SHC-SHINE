import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  INK_NAVY,
  resolveEditionTheme,
  parseHexColor,
  rgbToHex,
  hexToRgba,
  calculateLuminance,
  getContrastRatio,
  isContrastSafe,
  getContrastSafeInk,
  darkenColor,
  lightenColor,
  deriveAccentPalette,
  generateThemeCss,
  INSTITUTION_THEME_PRESETS,
} from "../colorUtils";

describe("Color Utilities & WCAG AA Validation", () => {
  test("parseHexColor correctly parses 3-digit and 6-digit hex colors", () => {
    assert.deepEqual(parseHexColor("#FFF"), { r: 255, g: 255, b: 255 });
    assert.deepEqual(parseHexColor("#000"), { r: 0, g: 0, b: 0 });
    assert.deepEqual(parseHexColor("#FF6B1A"), { r: 255, g: 107, b: 26 });
    // Fallback for invalid hex
    assert.deepEqual(parseHexColor("invalid"), { r: 0, g: 107, b: 255 });
  });

  test("rgbToHex converts RGB values with proper clamping", () => {
    assert.equal(rgbToHex(255, 107, 26), "#ff6b1a");
    assert.equal(rgbToHex(0, 0, 0), "#000000");
    assert.equal(rgbToHex(300, -20, 100), "#ff0064");
  });

  test("hexToRgba outputs valid CSS rgba string", () => {
    assert.equal(hexToRgba("#FF6B1A", 0.5), "rgba(255, 107, 26, 0.5)");
    assert.equal(hexToRgba("#FFFFFF", 0.1), "rgba(255, 255, 255, 0.1)");
  });

  test("calculateLuminance produces correct relative luminance per WCAG 2.1", () => {
    const whiteLum = calculateLuminance(255, 255, 255);
    const blackLum = calculateLuminance(0, 0, 0);
    assert.equal(whiteLum, 1);
    assert.equal(blackLum, 0);

    const orange = parseHexColor("#FF6B1A");
    const orangeLum = calculateLuminance(orange.r, orange.g, orange.b);
    assert.ok(orangeLum > 0 && orangeLum < 1);
  });

  test("getContrastRatio correctly matches known contrast pairs", () => {
    const whiteOnBlack = getContrastRatio("#FFFFFF", "#000000");
    assert.equal(Math.round(whiteOnBlack), 21);

    const sameColor = getContrastRatio("#FF6B1A", "#FF6B1A");
    assert.equal(Math.round(sameColor), 1);

    // Ink on light surface
    const inkOnWhite = getContrastRatio("#0C0A09", "#FFFFFF");
    assert.ok(inkOnWhite >= 18);

    // Muted ink on light surface meets WCAG AA body requirement (>= 4.5)
    const mutedInkOnWhite = getContrastRatio("#57534E", "#FFFFFF");
    assert.ok(mutedInkOnWhite >= 4.5);

    // Subtle ink on light surface meets WCAG AA (>= 4.5)
    const subtleInkOnWhite = getContrastRatio("#78716C", "#FFFFFF");
    assert.ok(subtleInkOnWhite >= 4.5);
  });

  test("isContrastSafe validates minimum thresholds", () => {
    assert.equal(isContrastSafe("#0C0A09", "#FFFFFF", 4.5), true);
    assert.equal(isContrastSafe("#FFFFFF", "#0C0A09", 4.5), true);
    assert.equal(isContrastSafe("#CCCCCC", "#FFFFFF", 4.5), false);
  });

  test("getContrastSafeInk picks highest contrast foreground text", () => {
    // SHINE Orange #FF6B1A requires navy ink for WCAG AA compliance
    const orangeInk = getContrastSafeInk("#FF6B1A");
    assert.notEqual(orangeInk, "#FFFFFF");
    assert.ok(getContrastRatio(orangeInk, "#FF6B1A") >= 4.5);

    // Gold #D9A441 is lighter, requires dark text for WCAG compliance
    const goldInk = getContrastSafeInk("#D9A441");
    assert.equal(goldInk, INK_NAVY);

    // Pure white requires dark text
    const whiteInk = getContrastSafeInk("#FFFFFF");
    assert.equal(whiteInk, INK_NAVY);

    // Pure black requires white text
    const blackInk = getContrastSafeInk("#000000");
    assert.equal(blackInk, "#FFFFFF");
  });

  test("darkenColor and lightenColor modify color tone correctly", () => {
    const original = "#808080";
    const darker = darkenColor(original, 20);
    const lighter = lightenColor(original, 20);
    assert.notEqual(darker, original);
    assert.notEqual(lighter, original);

    const origLum = calculateLuminance(128, 128, 128);
    const darkRgb = parseHexColor(darker);
    const lightRgb = parseHexColor(lighter);
    assert.ok(calculateLuminance(darkRgb.r, darkRgb.g, darkRgb.b) < origLum);
    assert.ok(calculateLuminance(lightRgb.r, lightRgb.g, lightRgb.b) > origLum);
  });

  test("deriveAccentPalette returns complete tokens with valid ink colors", () => {
    const palette = deriveAccentPalette("#FF6B1A", "#D9A441");
    assert.equal(palette.accent, "#FF6B1A");
    assert.equal(palette.gold, "#D9A441");
    assert.ok(getContrastRatio(palette.accentInk, "#FF6B1A") >= 4.5);
    assert.equal(palette.goldInk, INK_NAVY);
    assert.ok(palette.accentMuted.startsWith("#"));
    assert.ok(palette.goldMuted.startsWith("rgba("));
  });

  test("generateThemeCss outputs clean single-accent CSS variables without glow/gradient", () => {
    const css = generateThemeCss("#FF6B1A", "#D9A441", "#FFFFFF");
    assert.ok(css.includes("--accent: #FF6B1A"));
    assert.ok(css.includes("--gold: #D9A441"));
    assert.ok(css.includes("--accent-ink: #0A0A0A"));
    assert.ok(!css.includes("linear-gradient"));
    assert.ok(!css.includes("box-shadow: 0 0"));
  });

  test("resolveEditionTheme maps untouched legacy defaults to the v3 palette", () => {
    assert.deepEqual(resolveEditionTheme("#FF6B1A", "#D9A441", "#FAF8F5"), {
      primary: "#006BFF",
      secondary: "#D9A441",
      bg: "#F8F9FB",
    });
    assert.equal(resolveEditionTheme("#ff6b1a", null, null).primary, "#006BFF");
    assert.deepEqual(resolveEditionTheme(null, null, null), {
      primary: "#006BFF",
      secondary: "#D9A441",
      bg: "#F8F9FB",
    });
  });

  test("resolveEditionTheme keeps deliberately chosen palettes", () => {
    // The Solar Ember preset saves orange on white — must not be overridden
    assert.equal(resolveEditionTheme("#FF6B1A", "#D9A441", "#FFFFFF").primary, "#FF6B1A");
    assert.equal(resolveEditionTheme("#059669", "#D9A441", "#FAF8F5").primary, "#059669");
  });

  test("INSTITUTION_THEME_PRESETS all have valid contrast ink colors", () => {
    for (const preset of INSTITUTION_THEME_PRESETS) {
      const palette = deriveAccentPalette(preset.primary, preset.secondary, preset.bg);
      // Validate that derived accent ink has good contrast on the primary color
      const inkContrast = getContrastRatio(palette.accentInk, palette.accent);
      assert.ok(
        inkContrast >= 3.0,
        `Preset ${preset.name} primary contrast ${inkContrast} should be at least 3.0:1`
      );
    }
  });
});
