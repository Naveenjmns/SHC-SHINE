"use client";

import React from "react";
import { CheckCircle2, Clock, XCircle, Info, Award } from "lucide-react";

interface ColorSwatchProps {
  name: string;
  variable: string;
  hexValue: string;
  textVariant?: "light" | "dark";
  wcagContrast?: string;
  notes?: string;
}

function Swatch({ name, variable, hexValue, textVariant = "dark", wcagContrast, notes }: ColorSwatchProps) {
  return (
    <div className="flex flex-col border border-border rounded-[8px] overflow-hidden bg-surface">
      <div
        className="h-16 w-full p-2.5 flex flex-col justify-between"
        style={{ backgroundColor: `var(${variable}, ${hexValue})` }}
      >
        <span
          className={`text-xs font-mono font-medium ${
            textVariant === "light" ? "text-white" : "text-stone-950"
          }`}
        >
          {variable}
        </span>
        {wcagContrast && (
          <span
            className={`self-end text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] ${
              textVariant === "light"
                ? "bg-black/40 text-white"
                : "bg-white/70 text-stone-900 font-semibold"
            }`}
          >
            {wcagContrast}
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-0.5 bg-surface">
        <span className="text-xs font-semibold text-ink">{name}</span>
        <span className="text-[11px] font-mono text-ink-muted">{hexValue}</span>
        {notes && <span className="text-[11px] text-ink-subtle mt-0.5">{notes}</span>}
      </div>
    </div>
  );
}

export default function ColorMatrix() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink">1. Color Tokens & WCAG AA Contrast</h2>
        <p className="text-sm text-ink-muted mt-1">
          Single accent palette (#FF6B1A SHINE Orange), stone neutral ramp, and strict semantic roles.
        </p>
      </div>

      {/* Surface Ramp */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Surfaces & Canvases
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Swatch
            name="Surface Default"
            variable="--surface"
            hexValue="#FFFFFF (Light) / #121110 (Dark)"
            textVariant="dark"
            notes="Base page background and card canvases"
          />
          <Swatch
            name="Surface Raised"
            variable="--surface-raised"
            hexValue="#F5F5F4 (Light) / #1C1917 (Dark)"
            textVariant="dark"
            notes="Secondary cards, sidebars, interactive controls"
          />
          <Swatch
            name="Surface Sunken"
            variable="--surface-sunken"
            hexValue="#E7E5E4 (Light) / #0C0A09 (Dark)"
            textVariant="dark"
            notes="Wells, table headers, search input backgrounds"
          />
        </div>
      </div>

      {/* Borders Ramp */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          1px Hairline Borders
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Swatch
            name="Border Default"
            variable="--border"
            hexValue="#E7E5E4 (Light) / #292524 (Dark)"
            textVariant="dark"
            notes="Standard 1px perimeter for cards, tables, panels"
          />
          <Swatch
            name="Border Muted"
            variable="--border-muted"
            hexValue="#F5F5F4 (Light) / #1C1917 (Dark)"
            textVariant="dark"
            notes="Interior divider lines within complex cards"
          />
          <Swatch
            name="Border Strong"
            variable="--border-strong"
            hexValue="#D6D3D1 (Light) / #44403C (Dark)"
            textVariant="dark"
            notes="Active borders, focused input rings, modal perimeters"
          />
        </div>
      </div>

      {/* Ink Typography */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Ink & Typography Hierarchy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Swatch
            name="Ink Primary"
            variable="--ink"
            hexValue="#0C0A09 (Light) / #FAFAF9 (Dark)"
            textVariant="light"
            wcagContrast="18.8:1 (AAA)"
            notes="Headings, primary body copy, high-emphasis text"
          />
          <Swatch
            name="Ink Muted"
            variable="--ink-muted"
            hexValue="#57534E (Light) / #A8A29E (Dark)"
            textVariant="light"
            wcagContrast="5.1:1 (AA)"
            notes="Subtitles, table metadata, form helper text"
          />
          <Swatch
            name="Ink Subtle"
            variable="--ink-subtle"
            hexValue="#78716C (Light) / #78716C (Dark)"
            textVariant="light"
            wcagContrast="4.6:1 (AA)"
            notes="Placeholder text, timestamps, captions, disabled states"
          />
        </div>
      </div>

      {/* Primary Accent & Gold */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Primary Accent (#FF6B1A) & Awards Gold (#D9A441)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Swatch
            name="Accent Base"
            variable="--accent"
            hexValue="#FF6B1A"
            textVariant="dark"
            wcagContrast="6.94:1 on dark"
            notes="Sole primary CTA color"
          />
          <Swatch
            name="Accent Hover"
            variable="--accent-hover"
            hexValue="#E8551F"
            textVariant="dark"
            notes="Primary button hover"
          />
          <Swatch
            name="Accent Active"
            variable="--accent-active"
            hexValue="#CC4414"
            textVariant="light"
            notes="Pressed button state"
          />
          <Swatch
            name="Accent Muted"
            variable="--accent-muted"
            hexValue="rgba(255,107,26,0.10)"
            textVariant="dark"
            notes="Selection & active tabs"
          />
          <Swatch
            name="Gold (Awards Only)"
            variable="--gold"
            hexValue="#D9A441"
            textVariant="dark"
            wcagContrast="7.2:1 (AA)"
            notes="Exclusively for trophies"
          />
        </div>
      </div>

      {/* Semantic Roles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Semantic Roles (Paired with Icons)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 border border-success-border bg-success-surface rounded-[8px] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-success-ink">Success / Confirmed</div>
              <div className="text-[11px] text-success-ink/80 font-mono mt-0.5">#16A34A (4.6:1 AA)</div>
            </div>
          </div>

          <div className="p-3 border border-warning-border bg-warning-surface rounded-[8px] flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-warning-ink">Warning / Pending</div>
              <div className="text-[11px] text-warning-ink/80 font-mono mt-0.5">#D97706 (4.5:1 AA)</div>
            </div>
          </div>

          <div className="p-3 border border-danger-border bg-danger-surface rounded-[8px] flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-danger-ink">Danger / Rejected</div>
              <div className="text-[11px] text-danger-ink/80 font-mono mt-0.5">#DC2626 (4.8:1 AA)</div>
            </div>
          </div>

          <div className="p-3 border border-info-border bg-info-surface rounded-[8px] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-info-ink">Info / System Notice</div>
              <div className="text-[11px] text-info-ink/80 font-mono mt-0.5">#2563EB (5.2:1 AA)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
