"use client";

import React from "react";
import { CheckCircle2, Clock, XCircle, Info } from "lucide-react";

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
    <div className="flex flex-col border border-border rounded-2xl overflow-hidden bg-surface shadow-card">
      <div
        className="h-16 w-full p-2.5 flex flex-col justify-between border-b border-border-muted"
        style={{ backgroundColor: `var(${variable}, ${hexValue})` }}
      >
        <span
          className={`text-xs font-mono font-medium ${
            textVariant === "light" ? "text-white" : "text-ink"
          }`}
        >
          {variable}
        </span>
        {wcagContrast && (
          <span
            className={`self-end text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
              textVariant === "light"
                ? "bg-white/20 text-white"
                : "bg-white/80 text-ink"
            }`}
          >
            {wcagContrast}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-0.5 bg-surface">
        <span className="text-xs font-semibold text-ink">{name}</span>
        <span className="text-[11px] font-mono text-ink-muted">{hexValue}</span>
        {notes && <span className="text-[11px] text-ink-subtle mt-0.5">{notes}</span>}
      </div>
    </div>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="eyebrow">{children}</h3>;
}

export default function ColorMatrix() {
  return (
    <section className="space-y-8">
      <div>
        <p className="eyebrow">Palette</p>
        <h2 className="text-2xl font-bold text-ink mt-1">2. Color Tokens &amp; WCAG AA Contrast</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-3xl">
          Navy ink on cool marble: a Cloud canvas with white cards, navy text instead of black, one Signal Blue
          action color, and hairline borders. Every swatch below reads its live CSS variable, so it reflects the
          active theme.
        </p>
      </div>

      {/* Surfaces */}
      <div className="space-y-3">
        <GroupHeading>Surfaces &amp; canvas</GroupHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Swatch
            name="Canvas (Cloud)"
            variable="--canvas"
            hexValue="#F8F9FB / dark #071E33"
            notes="Page background. Cards float on it."
          />
          <Swatch
            name="Surface (Paper)"
            variable="--surface"
            hexValue="#FFFFFF / dark #0A2740"
            notes="Cards, panels, modals, popovers"
          />
          <Swatch
            name="Surface Raised (Pebble)"
            variable="--surface-raised"
            hexValue="#F0F3F8 / dark #0F3250"
            notes="Input fills, hover washes, table headers"
          />
          <Swatch
            name="Surface Inverse (Ink Navy)"
            variable="--surface-inverse"
            hexValue="#0B3558 / dark #F0F3F8"
            textVariant="light"
            notes="Dark CTAs and inverse panels only"
          />
        </div>
      </div>

      {/* Borders */}
      <div className="space-y-3">
        <GroupHeading>1px hairline borders</GroupHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Swatch
            name="Border (Hairline)"
            variable="--border"
            hexValue="#D4E0ED / dark #1B4268"
            notes="Default perimeter for cards, inputs, tables"
          />
          <Swatch
            name="Border Muted"
            variable="--border-muted"
            hexValue="#E7EEF6 / dark #123553"
            notes="Interior dividers inside dense cards"
          />
          <Swatch
            name="Border Strong"
            variable="--border-strong"
            hexValue="#B4C7DB / dark #2A5A85"
            notes="Hover / emphasis borders"
          />
        </div>
      </div>

      {/* Ink */}
      <div className="space-y-3">
        <GroupHeading>Ink &amp; typography hierarchy (never pure black)</GroupHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Swatch
            name="Ink (Navy)"
            variable="--ink"
            hexValue="#0B3558"
            textVariant="light"
            wcagContrast="12.6:1 AAA"
            notes="Headings, body copy, primary text"
          />
          <Swatch
            name="Ink Muted (Slate)"
            variable="--ink-muted"
            hexValue="#476788"
            textVariant="light"
            wcagContrast="5.9:1 AA"
            notes="Secondary text, descriptions, metadata"
          />
          <Swatch
            name="Ink Subtle"
            variable="--ink-subtle"
            hexValue="#56708D"
            textVariant="light"
            wcagContrast="5.1:1 AA"
            notes="Helper text, captions, timestamps"
          />
          <Swatch
            name="Ink Disabled (Mist)"
            variable="--ink-disabled"
            hexValue="#A6BBD1"
            wcagContrast="2.0:1 decorative"
            notes="Disabled / inactive states only"
          />
        </div>
      </div>

      {/* Accent */}
      <div className="space-y-3">
        <GroupHeading>Accent: Signal Blue (the only action color)</GroupHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Swatch
            name="Accent"
            variable="--accent"
            hexValue="#006BFF"
            textVariant="light"
            wcagContrast="4.6:1 AA"
            notes="Primary buttons, links, focus ring"
          />
          <Swatch
            name="Accent Hover"
            variable="--accent-hover"
            hexValue="#0058D6"
            textVariant="light"
            notes="Primary button hover"
          />
          <Swatch
            name="Accent Strong (Cobalt)"
            variable="--accent-strong"
            hexValue="#004EBA"
            textVariant="light"
            wcagContrast="6.5:1 on muted"
            notes="Active state; text on accent-muted"
          />
          <Swatch
            name="Accent Muted"
            variable="--accent-muted"
            hexValue="#E6F0FF"
            notes="Tinted fills, selected rows, pill badges"
          />
          <Swatch
            name="Accent Ink"
            variable="--accent-ink"
            hexValue="#FFFFFF"
            notes="Text on accent / navy fills"
          />
        </div>
      </div>

      {/* Decorative + Gold */}
      <div className="space-y-3">
        <GroupHeading>Decorative blobs &amp; awards gold</GroupHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Swatch
            name="Blob Magenta"
            variable="--blob-magenta"
            hexValue="#E55CFF"
            notes="Atmosphere behind hero visuals only. Never a UI fill."
          />
          <Swatch
            name="Blob Cyan"
            variable="--blob-cyan"
            hexValue="#0099FF"
            notes="Atmosphere behind hero visuals only. Never a UI fill."
          />
          <Swatch
            name="Gold (Awards Only)"
            variable="--gold"
            hexValue="#D9A441"
            wcagContrast="5.6:1 with navy"
            notes="Trophies, podium, winners. Nothing else."
          />
        </div>
      </div>

      {/* Semantic Roles */}
      <div className="space-y-3">
        <GroupHeading>Semantic roles (always paired with an icon)</GroupHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 border border-success-border bg-success-surface rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-success-ink">Success / Confirmed</div>
              <div className="text-[11px] text-success-ink/80 font-mono mt-0.5">#0E9F6E · ink #065F46 (7.3:1)</div>
            </div>
          </div>

          <div className="p-4 border border-warning-border bg-warning-surface rounded-2xl flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-warning-ink">Warning / Pending</div>
              <div className="text-[11px] text-warning-ink/80 font-mono mt-0.5">#D97706 · ink #78350F (8.8:1)</div>
            </div>
          </div>

          <div className="p-4 border border-danger-border bg-danger-surface rounded-2xl flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-danger-ink">Danger / Rejected</div>
              <div className="text-[11px] text-danger-ink/80 font-mono mt-0.5">#E02424 · ink #9B1C1C (7.4:1)</div>
            </div>
          </div>

          <div className="p-4 border border-info-border bg-info-surface rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-info-ink">Info / System Notice</div>
              <div className="text-[11px] text-info-ink/80 font-mono mt-0.5">#006BFF · ink #004EBA (6.5:1)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
