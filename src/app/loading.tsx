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
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#080706] text-stone-100 overflow-hidden px-4 selection:bg-[#FF6B1A] selection:text-white">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary Warm Ember Nebula */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF6B1A]/20 via-[#D9A441]/10 to-transparent blur-[110px] animate-pulse-glow" />

        {/* Secondary Deep Indigo-Amber Radial Accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[380px] h-[260px] rounded-full bg-gradient-to-tr from-orange-600/15 via-amber-500/10 to-transparent blur-3xl opacity-75" />

        {/* High-Tech Dot Matrix Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Subtle Horizon Perspective Grid Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Hero Gyroscopic Core Artifact */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          {/* Sonar Radar Wave */}
          <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-sonar" />
          <div className="absolute inset-2 rounded-full border border-amber-500/20 animate-sonar" style={{ animationDelay: "1.2s" }} />

          {/* Outer Dashed Orbit Ring with Compass Nodes */}
          <div className="absolute inset-0 rounded-full border border-dashed border-stone-700/80 animate-spin-slow">
            {/* 4 Cardinal Orbital Markers */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FF6B1A] shadow-[0_0_10px_#FF6B1A]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D9A441] shadow-[0_0_8px_#D9A441]" />
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" />
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>

          {/* Middle Counter-Spinning Dual-Gradient Arc */}
          <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-[#FF6B1A] border-r-[#D9A441] animate-spin-reverse-slow filter drop-shadow-[0_0_8px_rgba(255,107,26,0.4)]" />

          {/* Inner Accent Ring */}
          <div className="absolute inset-6 rounded-full border border-stone-800/90" />

          {/* Center Gem Prism with Glassmorphic Ember Core */}
          <div className="relative w-16 h-16 rounded-2xl rotate-45 bg-gradient-to-br from-stone-900/95 via-[#FF6B1A]/20 to-stone-950/95 border border-orange-500/50 shadow-[0_0_30px_rgba(255,107,26,0.45)] backdrop-blur-md flex items-center justify-center group">
            {/* Breathing Heart Glow */}
            <div className="absolute inset-0 rounded-2xl bg-[#FF6B1A]/20 blur-md animate-pulse" />

            {/* Radiant Spark Core */}
            <div className="-rotate-45 relative flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-300 filter drop-shadow-[0_0_12px_#FF6B1A] animate-sparkle" />
            </div>
          </div>
        </div>

        {/* Live System Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800/90 shadow-sm mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-300">
            System Initializing
          </span>
          <span className="text-[9px] font-mono text-orange-400/90 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/20">
            v2.6
          </span>
        </div>

        {/* Brand Wordmark & Shimmer Title */}
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight mb-2"
          style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
        >
          <span className="bg-gradient-to-r from-white via-stone-100 to-stone-300 bg-clip-text text-transparent">
            SHINE
          </span>{" "}
          <span className="bg-gradient-to-r from-[#FF6B1A] via-[#FF8A3D] to-[#D9A441] bg-clip-text text-transparent">
            FEST
          </span>
        </h1>

        {/* Dynamic Telemetry Narrative */}
        <div className="h-6 flex items-center justify-center mb-6">
          <p
            key={stageIndex}
            className="text-xs sm:text-sm text-stone-400 tracking-wide transition-all duration-300 animate-fade-in font-medium"
          >
            {BOOT_STAGES[stageIndex]}
          </p>
        </div>

        {/* High-Precision Laser Progress Track */}
        <div className="w-64 sm:w-80 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-stone-900/90 border border-stone-800 relative overflow-hidden p-[1px] shadow-inner">
            {/* Progressive Fill Bar */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B1A] via-amber-400 to-[#D9A441] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(255,107,26,0.8)]"
              style={{ width: `${progress}%` }}
            />
            {/* Traveling Laser Shimmer Beam */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-20 animate-laser" />
          </div>

          {/* Micro Telemetry Footnote */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-0.5 px-0.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]" />
              ARENA PROTOCOL
            </span>
            <span className="tabular-nums font-bold text-stone-400">
              {progress}%
            </span>
          </div>
        </div>

        {/* Hardware & Security Telemetry Chips */}
        <div className="flex items-center gap-3 mt-8 text-[10px] text-stone-500 font-mono">
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            TLS 1.3 SECURED
          </span>
          <span className="text-stone-700">•</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            TURBOPACK ACTIVE
          </span>
          <span className="text-stone-700">•</span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="w-3 h-3 text-sky-400" />
            60 FPS ENGINE
          </span>
        </div>
      </div>
    </div>
  );
}
