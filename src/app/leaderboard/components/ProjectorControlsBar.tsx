"use client";

import React from "react";
import Link from "next/link";
import { RotateCw, Pause, Maximize2, Minimize2, ArrowLeft } from "lucide-react";

interface ProjectorControlsBarProps {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function ProjectorControlsBar({
  autoRotate,
  onToggleAutoRotate,
  isFullscreen,
  onToggleFullscreen,
}: ProjectorControlsBarProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-surface text-ink p-2 rounded-2xl border border-border shadow-popover">
      {/* Keyboard Shortcuts Pill (Desktop only) */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-ink-muted px-2.5 py-1 rounded-[8px] bg-surface-raised">
        <span>Space: Pause</span>
        <span>•</span>
        <span>←/→: Arenas</span>
        <span>•</span>
        <span>F: Fullscreen</span>
      </div>

      {/* Auto-Cycle Toggle */}
      <button
        type="button"
        onClick={onToggleAutoRotate}
        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
          autoRotate
            ? "bg-accent-muted border-transparent text-accent-strong"
            : "bg-surface border-border text-ink-muted hover:text-ink"
        }`}
        title="Toggle auto-cycling through events (Shortcut: Space)"
      >
        {autoRotate ? (
          <>
            <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
            <span className="hidden sm:inline">Auto-Cycle (7s)</span>
          </>
        ) : (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paused</span>
          </>
        )}
      </button>

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="px-3 py-1.5 bg-surface hover:border-accent hover:text-accent border border-border text-ink rounded-[8px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
        title="Toggle fullscreen stage mode (Shortcut: F)"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Fullscreen (F)</span>
          </>
        )}
      </button>

      {/* Exit to Home */}
      <Link
        href="/"
        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-ink rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        title="Exit stage presentation view"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit</span>
      </Link>
    </div>
  );
}

