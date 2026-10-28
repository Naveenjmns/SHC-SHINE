"use client";

import React from "react";

const TYPE_SCALE = [
  {
    token: "text-xs",
    sizePx: "12px",
    weight: "500 / 600",
    role: "Captions, badge text, eyebrows, table metadata",
    sample: "Your College · Your Fest event platform",
  },
  {
    token: "text-sm",
    sizePx: "14px",
    weight: "400 / 600",
    role: "Form labels, helper text, dense table cells, nav links",
    sample: "Participants must present their QR badge at the registration desk before 09:30 AM.",
  },
  {
    token: "text-base",
    sizePx: "16px",
    weight: "400",
    role: "Body copy, card descriptions, input values",
    sample: "The inter-collegiate technical fest brings together 40+ institutions across Tamil Nadu.",
  },
  {
    token: "text-lg",
    sizePx: "18px",
    weight: "600",
    role: "Large buttons, card titles, lead paragraphs",
    sample: "Web Innovation & Prompt Engineering Championship",
  },
  {
    token: "text-xl",
    sizePx: "24px",
    weight: "700",
    role: "Card / modal titles, dashboard metric numbers",
    sample: "1,248 verified registrations across 14 events",
  },
  {
    token: "text-2xl",
    sizePx: "32px",
    weight: "700",
    role: "Page titles (h1) inside dashboards",
    sample: "Event operations & live wayfinding",
  },
  {
    token: "text-3xl",
    sizePx: "48px",
    weight: "700",
    role: "Public section headings (or .text-fluid-h1)",
    sample: "Your College Fest",
  },
  {
    token: "text-4xl",
    sizePx: "64px",
    weight: "700",
    role: "Hero headline (or .text-fluid-hero, up to 80px)",
    sample: "Your Fest",
  },
];

const FLUID_UTILITIES = [
  { cls: "text-fluid-hero", range: "40 → 80px", lh: "1.2", use: "Landing hero headline" },
  { cls: "text-fluid-h1", range: "32 → 50px", lh: "1.2", use: "Public section titles" },
  { cls: "text-fluid-h2", range: "24 → 38px", lh: "1.21", use: "Sub-section titles" },
  { cls: "text-fluid-body", range: "15 → 18px", lh: "1.6", use: "Marketing body copy" },
  { cls: "eyebrow", range: "12px · 600 · 0.08em caps", lh: "—", use: "Small label above a heading" },
];

export default function TypographyMatrix() {
  return (
    <section className="space-y-8">
      <div>
        <p className="eyebrow">Type</p>
        <h2 className="text-2xl font-bold text-ink mt-1">3. Typography Scale</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-3xl">
          One geometric sans, Manrope, for everything. Headings are large, bold (700) and navy; body copy stays at
          400. No black or extra-bold weights, no secondary display face.
        </p>
      </div>

      {/* Font stacks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 border border-border rounded-2xl bg-surface shadow-card">
          <div className="eyebrow">Brand sans</div>
          <div className="text-xl font-bold text-ink mt-1">Manrope</div>
          <div className="text-xs text-ink-subtle mt-1">
            Weights 400, 500, 600, 700. Used for headings, UI, body and numerals (<code className="font-mono">--font-sans</code>,{" "}
            <code className="font-mono">--font-display</code>).
          </div>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-surface shadow-card">
          <div className="eyebrow">Numbers</div>
          <div className="text-xl font-bold text-ink mt-1 tabular-nums">1,248 · 09:30</div>
          <div className="text-xs text-ink-subtle mt-1">
            Use <code className="font-mono">tabular-nums</code> on scores, counts, prices and times so columns align.
          </div>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-surface shadow-card">
          <div className="eyebrow">Code &amp; IDs</div>
          <div className="text-xl font-medium font-mono text-ink mt-1">FEST-DEMO</div>
          <div className="text-xs text-ink-subtle mt-1">
            <code className="font-mono">font-mono</code> only for machine values: badge codes, registration IDs, tokens.
          </div>
        </div>
      </div>

      {/* Scale table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs font-semibold text-ink-muted">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Usage &amp; sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {TYPE_SCALE.map((row) => (
                <tr key={row.token} className="hover:bg-surface-raised/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-accent">{row.token}</td>
                  <td className="py-3 px-4 text-xs text-ink tabular-nums">{row.sizePx}</td>
                  <td className="py-3 px-4 text-xs text-ink-muted tabular-nums">{row.weight}</td>
                  <td className="py-3 px-4 space-y-1">
                    <div className="text-xs text-ink-muted">{row.role}</div>
                    <div
                      className={`${row.token} ${
                        row.weight === "700" ? "font-bold" : row.weight === "600" ? "font-semibold" : ""
                      } text-ink truncate max-w-xl`}
                    >
                      {row.sample}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fluid utilities */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">Fluid editorial utilities (globals.css)</h3>
          <p className="text-xs text-ink-muted mt-0.5">Clamp-based sizes for public pages. Pair a heading with an eyebrow above it.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs font-semibold text-ink-muted">
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Range</th>
                <th className="py-3 px-4">Line height</th>
                <th className="py-3 px-4">Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {FLUID_UTILITIES.map((u) => (
                <tr key={u.cls}>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-accent">.{u.cls}</td>
                  <td className="py-3 px-4 text-xs text-ink tabular-nums">{u.range}</td>
                  <td className="py-3 px-4 text-xs text-ink-muted tabular-nums">{u.lh}</td>
                  <td className="py-3 px-4 text-xs text-ink-muted">{u.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
