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
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[var(--surface)] text-[var(--ink)] p-2 rounded-xl border border-[var(--border)] shadow-lg backdrop-blur-md">
      {/* Keyboard Shortcuts Pill (Desktop only) */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-[var(--ink-muted)] px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
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
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
          autoRotate
            ? "bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--accent)]"
            : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
        }`}
        title="Toggle auto-cycling through events (Shortcut: Space)"
      >
        {autoRotate ? (
          <>
            <RotateCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
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
        className="px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
        title="Toggle fullscreen stage mode (Shortcut: F)"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Fullscreen (F)</span>
          </>
        )}
      </button>

      {/* Exit to Home */}
      <Link
        href="/"
        className="px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-ink)] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-opacity"
        title="Exit stage presentation view"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit</span>
      </Link>
    </div>
  );
}

