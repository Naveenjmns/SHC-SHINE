"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, XCircle, Award, ArrowRight, Trash2, Search, SlidersHorizontal } from "lucide-react";

export default function ComponentPreviewMatrix() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink">3. Components, Radii & Hairline Elevation</h2>
        <p className="text-sm text-ink-muted mt-1">
          Strict 8px control / 12px panel radii rules. Hairline 1px borders for depth, zero glowing drop-shadows.
        </p>
      </div>

      {/* Radii & Elevation Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono font-semibold text-accent uppercase">Radius Token</div>
          <div className="text-base font-bold text-ink mt-0.5">8px Controls</div>
          <p className="text-xs text-ink-muted mt-1">
            Applied to buttons, text inputs, selects, filter chips, and interactive table actions.
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-[8px] bg-surface-raised border border-border text-xs font-medium text-ink">
            rounded-[8px] Control
          </div>
        </div>

        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono font-semibold text-accent uppercase">Radius Token</div>
          <div className="text-base font-bold text-ink mt-0.5">12px Panels</div>
          <p className="text-xs text-ink-muted mt-1">
            Applied to cards, dialog modals, side sheets, and data table containers.
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-[12px] bg-surface-raised border border-border text-xs font-medium text-ink">
            rounded-[12px] Panel
          </div>
        </div>

        <div className="p-4 border border-border rounded-[12px] bg-surface">
          <div className="text-xs font-mono font-semibold text-accent uppercase">Elevation Contract</div>
          <div className="text-base font-bold text-ink mt-0.5">1px Hairline Borders</div>
          <p className="text-xs text-ink-muted mt-1">
            Cards have 0px drop shadow. Shadows are restricted to floating layers (popovers & modals).
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <button
              onClick={() => setPopoverOpen(!popoverOpen)}
              className="px-3 py-1.5 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-ink transition-colors"
            >
              Test Popover
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="px-3 py-1.5 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-ink transition-colors"
            >
              Test Modal
            </button>
          </div>
        </div>
      </div>

      {/* Buttons Hierarchy */}
      <div className="p-5 border border-border rounded-[12px] bg-surface space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Button Hierarchy (8px radius, max 600 weight, min 44px touch target)
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button className="h-11 px-4 rounded-[8px] bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm transition-colors flex items-center gap-2">
            Primary Action <ArrowRight className="w-4 h-4" />
          </button>

          <button className="h-11 px-4 rounded-[8px] bg-surface-raised hover:bg-surface-sunken border border-border text-ink font-medium text-sm transition-colors">
            Secondary Button
          </button>

          <button className="h-11 px-4 rounded-[8px] border border-border-strong hover:bg-surface-raised text-ink font-medium text-sm transition-colors">
            Outline Button
          </button>

          <button className="h-11 px-4 rounded-[8px] bg-danger hover:bg-danger/90 text-white font-medium text-sm transition-colors flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> Destructive
          </button>

          <button className="h-11 px-4 rounded-[8px] hover:bg-surface-raised text-ink-muted hover:text-ink font-medium text-sm transition-colors">
            Ghost Button
          </button>

          <button
            disabled
            className="h-11 px-4 rounded-[8px] bg-surface-raised border border-border text-ink-subtle opacity-60 font-medium text-sm cursor-not-allowed"
          >
            Disabled
          </button>
        </div>
      </div>

      {/* Form Controls */}
      <div className="p-5 border border-border rounded-[12px] bg-surface space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Form Controls & Keyboard Focus
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center justify-between">
              <span>Text Field</span>
              <span className="text-ink-subtle font-normal">Optional</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by participant name..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-[8px] bg-surface border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Role / Filter Dropdown</label>
            <select className="w-full h-11 px-3 rounded-[8px] bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all">
              <option value="ALL">All Participants (1,248)</option>
              <option value="CONFIRMED">Confirmed Only (982)</option>
              <option value="PENDING">Pending Review (184)</option>
              <option value="REJECTED">Rejected (82)</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2.5 h-11 px-3 border border-border rounded-[8px] bg-surface cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="w-4 h-4 rounded-[4px] border-border text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-ink font-medium">Send SMS confirmation</span>
            </label>
          </div>
        </div>
      </div>

      {/* Badges & Status Pills */}
      <div className="p-5 border border-border rounded-[12px] bg-surface space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Status Badges (Icon + Label Pair, Never Color Alone)
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-confirmed-bg text-status-confirmed-text border border-status-confirmed-border">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-confirmed" /> Confirmed
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-pending-bg text-status-pending-text border border-status-pending-border">
            <Clock className="w-3.5 h-3.5 text-status-pending" /> Pending Review
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border">
            <XCircle className="w-3.5 h-3.5 text-status-rejected" /> Rejected
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-muted text-accent font-semibold border border-accent/20">
            <SlidersHorizontal className="w-3.5 h-3.5" /> SHINE Orange
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold-muted text-gold-ink font-semibold border border-gold/30">
            <Award className="w-3.5 h-3.5 text-gold" /> 1st Place Trophy
          </span>
        </div>
      </div>

      {/* Floating Popover Specimen */}
      {popoverOpen && (
        <div className="relative inline-block">
          <div
            className="p-4 rounded-[8px] bg-surface border border-border-strong w-72 space-y-2"
            style={{ boxShadow: "var(--shadow-popover)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Floating Popover</span>
              <button
                onClick={() => setPopoverOpen(false)}
                className="text-xs text-ink-muted hover:text-ink"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Elevation is achieved using <code className="font-mono text-accent">--shadow-popover</code> and a 1px border.
            </p>
          </div>
        </div>
      )}

      {/* Modal Dialog Specimen */}
      {dialogOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-md p-6 rounded-[12px] bg-surface border border-border-strong space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-ink">Modal Dialog Specimen</h4>
              <button
                onClick={() => setDialogOpen(false)}
                className="p-1 rounded-[6px] hover:bg-surface-raised text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-ink-muted">
              Modals use <code className="font-mono text-accent">--radius-panel</code> (12px),{" "}
              <code className="font-mono text-accent">--shadow-modal</code>, and a dark scrim backdrop.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-border bg-surface text-sm font-medium text-ink hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
