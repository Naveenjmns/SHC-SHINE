"use client";

import React from "react";
import { Palette, CheckCircle2 } from "lucide-react";
import { INSTITUTION_THEME_PRESETS, ThemePreset } from "@/lib/colorUtils";
import { useToast } from "@/components/ToastProvider";

interface AdminThemePresetsCardProps {
  primaryAccent: string;
  secondaryAccent: string;
  bgColor: string;
  onChangeColor: (primary: string, secondary: string, bg: string) => void;
}

export default function AdminThemePresetsCard({
  primaryAccent,
  secondaryAccent,
  bgColor,
  onChangeColor,
}: AdminThemePresetsCardProps) {
  const { toast } = useToast();

  const handleSelectPreset = (preset: ThemePreset) => {
    onChangeColor(preset.primary, preset.secondary, preset.bg);
    toast.success(`Applied ${preset.name} theme palette.`);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <span>Theme Tokens &amp; Institutional Palettes</span>
          </h3>
          <p className="text-sm text-ink-muted mt-0.5">
            Select an institutional palette or customize primary and secondary accents.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-ink-muted self-start sm:self-auto">
          CSS Variables Engine
        </span>
      </div>

      {/* Preset Badges Grid */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-ink block">
          Institution Brand Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INSTITUTION_THEME_PRESETS.map((preset) => {
            const isSelected = primaryAccent?.toUpperCase() === preset.primary.toUpperCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border bg-surface-raised hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center -space-x-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-xs text-ink-muted truncate">
                    {preset.institutionType}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Primary Brand Accent (Hero Buttons &amp; Highlights)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryAccent || "#006BFF"}
              onChange={(e) => onChangeColor(e.target.value, secondaryAccent, bgColor)}
              className="w-9 h-9 rounded-[8px] cursor-pointer border border-border p-0.5 bg-surface"
            />
            <input
              type="text"
              value={primaryAccent || "#006BFF"}
              onChange={(e) => onChangeColor(e.target.value, secondaryAccent, bgColor)}
              className="flex-1 px-2.5 py-1.5 text-sm font-mono font-semibold uppercase border border-border rounded-[8px] bg-surface text-ink"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Secondary Accent (Awards &amp; Trophies Only)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryAccent || "#D9A441"}
              onChange={(e) => onChangeColor(primaryAccent, e.target.value, bgColor)}
              className="w-9 h-9 rounded-[8px] cursor-pointer border border-border p-0.5 bg-surface"
            />
            <input
              type="text"
              value={secondaryAccent || "#D9A441"}
              onChange={(e) => onChangeColor(primaryAccent, e.target.value, bgColor)}
              className="flex-1 px-2.5 py-1.5 text-sm font-mono font-semibold uppercase border border-border rounded-[8px] bg-surface text-ink"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

