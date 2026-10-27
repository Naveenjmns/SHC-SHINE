"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon, Monitor, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import {
  deriveAccentPalette,
  getContrastRatio,
  isContrastSafe,
  getContrastSafeInk,
  INSTITUTION_THEME_PRESETS,
} from "@/lib/colorUtils";

export default function ThemePlayground() {
  const [activeTheme, setActiveTheme] = useState<"light" | "dark" | "stage">("light");
  const [customPrimary, setCustomPrimary] = useState("#FF6B1A");
  const [customSecondary, setCustomSecondary] = useState("#D9A441");

  // Contrast calculator state
  const [fgColor, setFgColor] = useState("#0C0A09");
  const [bgColor, setBgColor] = useState("#FFFFFF");

  // Switch document theme
  const applyTheme = (theme: "light" | "dark" | "stage") => {
    setActiveTheme(theme);
    const root = document.documentElement;

    if (theme === "light") {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
      root.removeAttribute("data-stage-mode");
    } else if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.removeAttribute("data-stage-mode");
    } else if (theme === "stage") {
      root.classList.add("dark");
      root.setAttribute("data-stage-mode", "true");
    }
  };

  // Dynamically update CSS variables on accent selection
  const handlePresetSelect = (primary: string, secondary: string) => {
    setCustomPrimary(primary);
    setCustomSecondary(secondary);
    applyDynamicAccent(primary, secondary);
  };

  const applyDynamicAccent = (primary: string, secondary: string) => {
    const palette = deriveAccentPalette(primary, secondary);
    const root = document.documentElement;

    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-hover", palette.accentHover);
    root.style.setProperty("--accent-active", palette.accentActive);
    root.style.setProperty("--accent-muted", palette.accentMuted);
    root.style.setProperty("--accent-ink", palette.accentInk);

    root.style.setProperty("--gold", palette.gold);
    root.style.setProperty("--gold-hover", palette.goldHover);
    root.style.setProperty("--gold-muted", palette.goldMuted);
    root.style.setProperty("--gold-ink", palette.goldInk);
  };

  const resetToDefault = () => {
    handlePresetSelect("#FF6B1A", "#D9A441");
    applyTheme("light");
  };

  // Contrast calculations
  const contrastRatio = getContrastRatio(fgColor, bgColor);
  const passesNormalAA = isContrastSafe(fgColor, bgColor, 4.5);
  const passesLargeAA = isContrastSafe(fgColor, bgColor, 3.0);
  const passesAAA = isContrastSafe(fgColor, bgColor, 7.0);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">4. Interactive Theme & Token Playground</h2>
        <p className="text-sm text-ink-muted mt-1">
          Switch themes, test dynamic edition presets, and audit color contrast in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Theme Mode & Accent Presets */}
        <div className="p-5 border border-border rounded-[12px] bg-surface space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Theme Mode & Presets
            </h3>
            <button
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Reset Default
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyTheme("light")}
              className={`h-10 px-3 rounded-[8px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTheme === "light"
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-surface-raised border-border text-ink hover:bg-surface-sunken"
              }`}
            >
              <Sun className="w-4 h-4" /> Light (Default)
            </button>

            <button
              onClick={() => applyTheme("dark")}
              className={`h-10 px-3 rounded-[8px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTheme === "dark"
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-surface-raised border-border text-ink hover:bg-surface-sunken"
              }`}
            >
              <Moon className="w-4 h-4" /> Dark Workspace
            </button>

            <button
              onClick={() => applyTheme("stage")}
              className={`h-10 px-3 rounded-[8px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTheme === "stage"
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-surface-raised border-border text-ink hover:bg-surface-sunken"
              }`}
            >
              <Monitor className="w-4 h-4" /> Stage (16:9)
            </button>
          </div>

          {/* Edition Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">Institution Edition Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSTITUTION_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.primary, preset.secondary)}
                  className={`p-2.5 rounded-[8px] border text-left flex items-center gap-2.5 transition-all ${
                    customPrimary.toLowerCase() === preset.primary.toLowerCase()
                      ? "border-accent bg-accent-muted"
                      : "border-border bg-surface hover:bg-surface-raised"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-ink truncate">{preset.name}</div>
                    <div className="text-[11px] text-ink-subtle truncate">{preset.primary}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live WCAG AA Contrast Calculator */}
        <div className="p-5 border border-border rounded-[12px] bg-surface space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Live WCAG AA Contrast Calculator
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Foreground Ink</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-9 h-9 rounded-[6px] border border-border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-[6px] border border-border bg-surface text-xs font-mono uppercase text-ink"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Background Surface</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-9 h-9 rounded-[6px] border border-border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-[6px] border border-border bg-surface text-xs font-mono uppercase text-ink"
                />
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div
            className="p-4 rounded-[8px] border border-border text-center space-y-1"
            style={{ backgroundColor: bgColor, color: fgColor }}
          >
            <div className="text-base font-bold">Sample Event Text Preview</div>
            <div className="text-xs opacity-90">
              The quick brown fox jumps over the lazy dog. 1234567890
            </div>
          </div>

          {/* Results Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-[8px] border border-border bg-surface-raised space-y-0.5">
              <div className="text-[10px] uppercase font-mono text-ink-muted">Contrast Ratio</div>
              <div className="text-base font-bold font-mono text-ink">
                {contrastRatio.toFixed(2)}:1
              </div>
            </div>

            <div
              className={`p-2.5 rounded-[8px] border space-y-0.5 ${
                passesNormalAA
                  ? "bg-success-surface border-success-border text-success-ink"
                  : "bg-danger-surface border-danger-border text-danger-ink"
              }`}
            >
              <div className="text-[10px] uppercase font-mono">Normal (≥4.5)</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                {passesNormalAA ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {passesNormalAA ? "Pass (AA)" : "Fail"}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-[8px] border space-y-0.5 ${
                passesLargeAA
                  ? "bg-success-surface border-success-border text-success-ink"
                  : "bg-danger-surface border-danger-border text-danger-ink"
              }`}
            >
              <div className="text-[10px] uppercase font-mono">Large (≥3.0)</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                {passesLargeAA ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {passesLargeAA ? "Pass (AA)" : "Fail"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
