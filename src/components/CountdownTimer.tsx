"use client";

import { useEffect, useState } from "react";
import { Clock, Flame, Radio, Sparkles } from "lucide-react";

interface CountdownTimerProps {
  targetDate?: Date | string | null;
  eventDateText?: string;
}

export default function CountdownTimer({
  targetDate = "2026-09-17T09:30:00+05:30",
  eventDateText,
}: CountdownTimerProps) {
  // Initialize with static values to avoid hydration mismatch.
  // Date.now() differs between server (ISR build time) and client (page load time),
  // so we must NOT call it during useState initialization.
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
  });
  const [mounted, setMounted] = useState(false);

  const getFormattedDateText = () => {
    if (eventDateText) return eventDateText;
    if (!targetDate) return "17-09-2026 09:30 AM";
    try {
      const d = new Date(targetDate);
      if (isNaN(d.getTime())) return "17-09-2026 09:30 AM";
      const pad = (n: number) => String(n).padStart(2, "0");
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      let hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const mins = pad(d.getMinutes());
      return `${day}-${month}-${year} ${pad(hours)}:${mins} ${ampm}`;
    } catch {
      return "17-09-2026 09:30 AM";
    }
  };

  const displayDateText = getFormattedDateText();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = targetDate ? new Date(targetDate).getTime() : new Date("2026-09-17T09:30:00+05:30").getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isLive: false });
    };

    calculateTimeLeft();
    setMounted(true);
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatTwoDigits = (num: number) => String(num).padStart(2, "0");

  if (timeLeft.isLive) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 animate-fade-in">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B1A] via-[#D9A441] to-[#FF6B1A] p-6 sm:p-8 rounded-3xl shadow-lg shadow-orange-500/20 text-white text-center border border-white/30">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest bg-black/25 px-3.5 py-1 rounded-full border border-white/30">
              Live Now
            </span>
          </div>
          <h3
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-amber-200 animate-pulse" />
            <span>EVENT IS LIVE!</span>
          </h3>
          <p className="text-xs sm:text-sm font-medium opacity-95 mt-2">
            SHINE 26 is officially underway ({displayDateText})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-8 animate-fade-in">
      {/* Sub-header title with TO GO */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-center px-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B1A] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B1A]" />
        </span>
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#FF6B1A] flex flex-wrap items-center justify-center gap-1.5">
          <span>{displayDateText}</span>
          <span className="text-[#1C1917] font-black bg-[#D9A441]/20 px-2 py-0.5 rounded-md border border-[#D9A441]/30">
            TO GO
          </span>
        </span>
      </div>

      {/* 4 Soft Cream Theme Countdown Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-1 sm:px-2">
        {/* DAYS */}
        <div className="fest-card !p-2.5 sm:!p-4 md:!p-6 text-center border-2 border-[#1C1917]/10 bg-white shadow-sm hover:border-[#FF6B1A]/40 transition-all duration-300 transform hover:-translate-y-1">
          <div
            className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1C1917] tabular-nums tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {formatTwoDigits(timeLeft.days)}
          </div>
          <div className="text-[9px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#57534E] mt-1">
            DAYS
          </div>
        </div>

        {/* HOURS */}
        <div className="fest-card !p-2.5 sm:!p-4 md:!p-6 text-center border-2 border-[#1C1917]/10 bg-white shadow-sm hover:border-[#FF6B1A]/40 transition-all duration-300 transform hover:-translate-y-1">
          <div
            className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1C1917] tabular-nums tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {formatTwoDigits(timeLeft.hours)}
          </div>
          <div className="text-[9px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#57534E] mt-1">
            HOURS
          </div>
        </div>

        {/* MINS */}
        <div className="fest-card !p-2.5 sm:!p-4 md:!p-6 text-center border-2 border-[#1C1917]/10 bg-white shadow-sm hover:border-[#FF6B1A]/40 transition-all duration-300 transform hover:-translate-y-1">
          <div
            className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1C1917] tabular-nums tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {formatTwoDigits(timeLeft.minutes)}
          </div>
          <div className="text-[9px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#57534E] mt-1">
            MINS
          </div>
        </div>

        {/* SECS */}
        <div className="fest-card !p-2.5 sm:!p-4 md:!p-6 text-center border-2 border-[#FF6B1A]/30 bg-[#FF6B1A]/5 shadow-sm hover:border-[#FF6B1A]/60 transition-all duration-300 transform hover:-translate-y-1">
          <div
            className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#FF6B1A] tabular-nums tracking-tight animate-pulse"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {formatTwoDigits(timeLeft.seconds)}
          </div>
          <div className="text-[9px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#FF6B1A] mt-1">
            SECS
          </div>
        </div>
      </div>
    </div>
  );
}
