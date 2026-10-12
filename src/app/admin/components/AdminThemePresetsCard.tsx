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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--accent)]" />
            <span>Theme Tokens &amp; Institutional Palettes</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Select an institutional palette or customize primary and secondary accents.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink-muted)] self-start sm:self-auto">
          CSS Variables Engine
        </span>
      </div>

      {/* Preset Badges Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--ink)] block">
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
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center -space-x-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white dark:border-stone-900"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white dark:border-stone-900"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--ink)] leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-[var(--ink-muted)] truncate">
                    {preset.institutionType}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border)]">
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
            Primary Brand Accent (Hero Buttons &amp; Highlights)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryAccent || "#FF6B1A"}
              onChange={(e) => onChangeColor(e.target.value, secondaryAccent, bgColor)}
              className="w-9 h-9 rounded-md cursor-pointer border border-[var(--border)] p-0.5 bg-[var(--surface)]"
            />
            <input
              type="text"
              value={primaryAccent || "#FF6B1A"}
              onChange={(e) => onChangeColor(e.target.value, secondaryAccent, bgColor)}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold uppercase border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--ink)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
            Secondary Accent (Awards &amp; Trophies Only)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryAccent || "#D9A441"}
              onChange={(e) => onChangeColor(primaryAccent, e.target.value, bgColor)}
              className="w-9 h-9 rounded-md cursor-pointer border border-[var(--border)] p-0.5 bg-[var(--surface)]"
            />
            <input
              type="text"
              value={secondaryAccent || "#D9A441"}
              onChange={(e) => onChangeColor(primaryAccent, e.target.value, bgColor)}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold uppercase border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--ink)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

