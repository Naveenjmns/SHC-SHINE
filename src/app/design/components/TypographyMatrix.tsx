"use client";

import React from "react";

const TYPE_SCALE = [
  {
    step: "Step 1",
    token: "text-xs",
    sizePx: "12px",
    rem: "0.75rem",
    lineHeight: "16px (1.0rem)",
    tracking: "+0.01em",
    weight: "font-medium (500)",
    role: "Table headers, badge text, timestamps, captions",
    sample: "YOUR COLLEGE • YOUR FEST EVENT MANAGEMENT PLATFORM",
    isDisplay: false,
  },
  {
    step: "Step 2",
    token: "text-sm",
    sizePx: "14px",
    rem: "0.875rem",
    lineHeight: "20px (1.25rem)",
    tracking: "0em",
    weight: "font-normal (400) / font-semibold (600)",
    role: "Form labels, helper text, dense table cell body, nav links",
    sample: "Participants must present their QR badge at the registration desk before 09:30 AM.",
    isDisplay: false,
  },
  {
    step: "Step 3",
    token: "text-base",
    sizePx: "16px",
    rem: "1.0rem",
    lineHeight: "24px (1.5rem)",
    tracking: "-0.01em",
    weight: "font-normal (400)",
    role: "Primary body text, card descriptions, input field values",
    sample: "The national inter-collegiate technical fest brings together 40+ institutions across Tamil Nadu.",
    isDisplay: false,
  },
  {
    step: "Step 4",
    token: "text-lg",
    sizePx: "18px",
    rem: "1.125rem",
    lineHeight: "28px (1.75rem)",
    tracking: "-0.01em",
    weight: "font-semibold (600)",
    role: "Card titles, section headers in modals, lead paragraphs",
    sample: "Web Innovation & Prompt Engineering Championship",
    isDisplay: true,
  },
  {
    step: "Step 5",
    token: "text-xl",
    sizePx: "24px",
    rem: "1.5rem",
    lineHeight: "32px (2.0rem)",
    tracking: "-0.02em",
    weight: "font-bold (700)",
    role: "Section headers (h2), modal titles, dashboard metric numbers",
    sample: "1,248 Verified Registrations Across 14 Events",
    isDisplay: true,
  },
  {
    step: "Step 6",
    token: "text-2xl",
    sizePx: "32px",
    rem: "2.0rem",
    lineHeight: "36px (2.25rem)",
    tracking: "-0.02em",
    weight: "font-bold (700)",
    role: "Page titles (h1), major dashboard section headers",
    sample: "Event Operations & Live Wayfinding",
    isDisplay: true,
  },
  {
    step: "Step 7",
    token: "text-3xl",
    sizePx: "48px",
    rem: "3.0rem",
    lineHeight: "52px (3.25rem)",
    tracking: "-0.03em",
    weight: "font-bold (700)",
    role: "Public landing section titles, auditorium stats",
    sample: "Your College Fest",
    isDisplay: true,
  },
  {
    step: "Step 8",
    token: "text-4xl",
    sizePx: "64px",
    rem: "4.0rem",
    lineHeight: "68px (4.25rem)",
    tracking: "-0.04em",
    weight: "font-bold (700)",
    role: "Public hero headline (solid accent color, 0 gradient)",
    sample: "Your Fest",
    isDisplay: true,
  },
];

export default function TypographyMatrix() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink">2. Typography Scale (Fixed 8-Step System)</h2>
        <p className="text-sm text-ink-muted mt-1">
          Zero arbitrary text sizes. Bricolage Grotesque for display (max 700 bold) and Inter for UI (max 600 semibold).
        </p>
      </div>

      {/* Font Stacks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono text-ink-muted uppercase">Display Face</div>
          <div className="text-lg font-bold font-display text-ink mt-1">Bricolage Grotesque</div>
          <div className="text-xs text-ink-subtle mt-1">
            Weights: 600, 700. Used for section headers, page titles, and hero wordmarks.
          </div>
        </div>

        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono text-ink-muted uppercase">UI Body Face</div>
          <div className="text-lg font-semibold font-sans text-ink mt-1">Inter</div>
          <div className="text-xs text-ink-subtle mt-1">
            Weights: 400, 500, 600. Used for controls, labels, tables, navigation, and body copy.
          </div>
        </div>

        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono text-ink-muted uppercase">Tabular Numbers</div>
          <div className="text-lg font-mono font-medium text-ink mt-1">ui-monospace</div>
          <div className="text-xs text-ink-subtle mt-1">
            Monospace numerals for scores, registration badges (FEST-DEMO-RAHUL), and timestamps.
          </div>
        </div>
      </div>

      {/* 8-Step Scale Table & Specimens */}
      <div className="border border-border rounded-[12px] overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs font-semibold text-ink-muted">
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Px / Rem</th>
                <th className="py-3 px-4">Line Height</th>
                <th className="py-3 px-4">Usage & Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {TYPE_SCALE.map((row) => (
                <tr key={row.token} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-ink-muted">{row.step}</td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-accent">
                    {row.token}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-ink">{row.sizePx}</td>
                  <td className="py-3 px-4 font-mono text-xs text-ink-muted">{row.lineHeight}</td>
                  <td className="py-3 px-4 space-y-1">
                    <div className="text-xs text-ink-muted">{row.role}</div>
                    <div
                      className={`${row.token} ${
                        row.isDisplay ? "font-display font-bold text-ink" : "font-sans text-ink"
                      } truncate max-w-xl`}
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
    </section>
  );
}
