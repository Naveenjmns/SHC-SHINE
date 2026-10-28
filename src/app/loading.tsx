"use client";

import { useEffect, useState } from "react";
import { Sparkles, Zap, Shield, Cpu } from "lucide-react";

const BOOT_STAGES = [
  "Synchronizing symposium arena & stage...",
  "Calibrating digital passes & access matrix...",
  "Synthesizing live event telemetry...",
  "Illuminating festival experience...",
];

export default function Loading() {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(24);

  useEffect(() => {
    // Dynamic message cycler
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % BOOT_STAGES.length);
    }, 1400);

    // Dynamic progress bar incrementer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96;
        const jump = Math.floor(Math.random() * 14) + 6;
        return Math.min(prev + jump, 96);
      });
    }, 450);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-canvas text-ink overflow-hidden px-4 selection:bg-accent selection:text-white">
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Core loader mark */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          {/* Sonar ring */}
          <div className="absolute inset-0 rounded-full border border-accent/30 animate-sonar" />

          {/* Outer dashed orbit ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-border-strong animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ink-disabled" />
          </div>

          {/* Spinning arc */}
          <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-accent border-r-accent/40 animate-spin-reverse-slow" />

          {/* Center tile */}
          <div className="relative w-14 h-14 rounded-2xl bg-surface border border-border shadow-elevated flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent animate-sparkle" />
          </div>
        </div>

        {/* Live system status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border shadow-card mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-sm font-semibold text-ink-muted">
            System initializing
          </span>
          <span className="text-xs font-mono font-semibold text-accent-strong bg-accent-muted px-1.5 rounded-full">
            v2.6
          </span>
        </div>

        {/* Wordmark */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-ink">
          SHINE <span className="text-accent">FEST</span>
        </h1>

        {/* Stage narrative */}
        <div className="h-6 flex items-center justify-center mb-6">
          <p
            key={stageIndex}
            className="text-sm sm:text-[15px] text-ink-muted transition-all duration-300 animate-fade-in font-medium"
          >
            {BOOT_STAGES[stageIndex]}
          </p>
        </div>

        {/* Progress track */}
        <div className="w-64 sm:w-80 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-surface-raised relative overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-ink-subtle pt-0.5 px-0.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Arena protocol
            </span>
            <span className="tabular-nums font-semibold text-ink-muted">
              {progress}%
            </span>
          </div>
        </div>

        {/* Telemetry chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-xs text-ink-subtle font-medium">
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-success" />
            TLS 1.3 secured
          </span>
          <span className="text-ink-disabled">•</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent" />
            Turbopack active
          </span>
          <span className="text-ink-disabled">•</span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="w-3 h-3 text-ink-muted" />
            60 FPS engine
          </span>
        </div>
      </div>
    </div>
  );
}
