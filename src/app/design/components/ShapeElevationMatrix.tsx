"use client";

import React from "react";

const RADII = [
  { name: "Control", token: "--radius-control", cls: "rounded-[8px]", px: "8px", use: "Buttons, inputs, selects, small controls" },
  { name: "Card", token: "--radius-panel", cls: "rounded-2xl", px: "16px", use: "Product cards, tables, stat cards" },
  { name: "Feature", token: "--radius-feature", cls: "rounded-3xl", px: "24px", use: "Feature panels, modals, hero visuals" },
  { name: "Pill", token: "--radius-full", cls: "rounded-full", px: "9999px", use: "Badges, pills, avatars, switches" },
];

const ELEVATION = [
  { name: "Card", cls: "shadow-card", use: "Every card resting on the canvas" },
  { name: "Elevated", cls: "shadow-elevated", use: "Hero / feature visuals, hovered interactive cards" },
  { name: "Button", cls: "shadow-button", use: "Primary button hover lift" },
  { name: "Popover", cls: "shadow-popover", use: "Dropdowns, tooltips, toasts, floating map controls" },
  { name: "Modal", cls: "shadow-modal", use: "Dialogs and sheets over the navy scrim" },
];

export default function ShapeElevationMatrix() {
  return (
    <section className="space-y-8">
      <div>
        <p className="eyebrow">Shape &amp; depth</p>
        <h2 className="text-2xl font-bold text-ink mt-1">4. Radii &amp; Blue-Tinted Elevation</h2>
        <p className="text-[15px] text-ink-muted mt-1 max-w-3xl">
          Three radii (8 / 16 / 24) plus pills. Shadows are layered and tinted with slate-blue, never neutral black,
          so white cards appear to float on the Cloud canvas. Surfaces are flat: no gradients, glows or neon.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {RADII.map((r) => (
          <div key={r.token} className="space-y-3">
            <div
              className={`h-24 bg-surface border border-border shadow-card flex items-center justify-center ${r.cls}`}
            >
              <span className="text-[15px] font-bold text-ink tabular-nums">{r.px}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">{r.name}</div>
              <div className="text-xs font-mono text-accent">{r.cls}</div>
              <div className="text-xs text-ink-subtle mt-0.5">{r.use}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-canvas border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {ELEVATION.map((e) => (
            <div key={e.cls} className={`p-5 rounded-2xl bg-surface border border-border ${e.cls}`}>
              <div className="text-[15px] font-semibold text-ink">{e.name}</div>
              <div className="text-xs font-mono text-accent mt-0.5">{e.cls}</div>
              <div className="text-xs text-ink-subtle mt-2">{e.use}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative blob specimen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-ink">Decorative blobs</h3>
          <p className="text-[15px] text-ink-muted">
            <code className="font-mono text-accent">.blob .blob-magenta</code> and{" "}
            <code className="font-mono text-accent">.blob .blob-cyan</code> sit behind a product visual inside a{" "}
            <code className="font-mono text-accent">.blob-stage</code>. They add atmosphere to hero areas only and are
            never used as button, badge or chart fills.
          </p>
        </div>
        <div className="blob-stage h-48 flex items-center justify-center">
          <span aria-hidden="true" className="blob blob-magenta w-32 h-32 -top-2 left-[18%]" />
          <span aria-hidden="true" className="blob blob-cyan w-28 h-28 bottom-0 right-[20%]" />
          <div className="w-56 p-5 rounded-2xl bg-surface border border-border shadow-elevated">
            <div className="eyebrow">Feature visual</div>
            <div className="text-base font-bold text-ink mt-1">White card, floating</div>
            <div className="mt-3 h-2 rounded-full bg-accent-muted">
              <div className="h-2 w-2/3 rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
