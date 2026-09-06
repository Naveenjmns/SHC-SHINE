"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Landmark } from "lucide-react";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  // Fest date: October 15, 2026
  const eventDate = new Date("2026-10-15T09:00:00+05:30");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-32 pb-12 overflow-hidden bg-[#0B0A0A]">
      {/* Background Ambience: Subtle warm ember and gold glow (restrained, not rainbow gaming neon) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] h-[400px] bg-gradient-to-br from-[#FF6B1A]/12 to-[#D9A441]/08 rounded-full blur-[120px]" />
        <div className="absolute -top-32 right-10 w-[350px] h-[350px] bg-[#FF6B1A]/08 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container-shine relative z-10 my-auto text-center">
        {/* Department & Institution Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1818] border border-white/10 text-xs text-[#9CA3AF] mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#FF6B1A] animate-ping" />
          <span className="font-semibold text-white">Dept. of Computer Applications (PG)</span>
          <span className="text-white/40">•</span>
          <span>Sacred Heart College</span>
        </div>

        {/* Hero Title with clamp fluid type */}
        <h1
          className="text-fluid-hero font-black text-white max-w-4xl mx-auto mb-5 tracking-tight"
          style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
        >
          Unleash Your Intellect at{" "}
          <span className="hero-wordmark-gradient inline-block drop-shadow-sm">
            SHINE 26
          </span>
        </h1>

        <p className="text-fluid-body text-[#9CA3AF] max-w-2xl mx-auto mb-10 font-normal">
          The premier intercollegiate technical & management fest. 10+ on-stage and off-stage arenas, cash prize pool of ₹25,000+, and certificates for all college delegates.
        </p>

        {/* Dual CTAs (44px min tap targets) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/register"
            className="btn-ember w-full sm:w-auto text-base px-8 py-3.5 font-bold"
          >
            <span>Register for Events</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/events"
            className="btn-gold-outline w-full sm:w-auto text-base px-8 py-3.5 font-semibold"
          >
            Explore 10 Competitions
          </Link>

          <Link
            href="/leaderboard"
            className="tap-target px-5 py-3.5 text-sm font-semibold text-[#D9A441] hover:text-[#F2C94C] transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-[#D9A441]" />
            Stage Leaderboard
          </Link>
        </div>

        {/* Live Countdown Timer (Tabular Numerals) */}
        <div className="max-w-xl mx-auto bg-[#141212]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="text-[11px] font-bold text-[#D9A441] uppercase tracking-widest mb-3">
            Fest Inauguration Countdown • Oct 15, 2026
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
            {[
              { label: "Days", val: timeLeft.days },
              { label: "Hours", val: timeLeft.hours },
              { label: "Minutes", val: timeLeft.minutes },
              { label: "Seconds", val: timeLeft.seconds },
            ].map((unit) => (
              <div key={unit.label} className="bg-[#1C1919] rounded-xl p-2.5 sm:p-3 border border-white/5">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tabular-nums">
                  {mounted ? String(unit.val).padStart(2, "0") : "--"}
                </div>
                <div className="text-[10px] sm:text-xs text-[#9CA3AF] uppercase font-medium mt-0.5">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clean Institution & Accreditation Strip (Not a cluttered grid) */}
      <div className="sponsor-strip mt-12 py-4">
        <div className="container-shine flex flex-wrap items-center justify-between gap-6 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span className="font-semibold text-white">Sacred Heart College (Autonomous)</span>
            <span className="hidden sm:inline text-white/40">• NAAC Accredited 'A+'</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Affiliated with Thiruvalluvar University</span>
            <span className="hidden md:inline text-white/40">•</span>
            <span className="hidden md:inline text-[#D9A441]">₹25,000+ Prize Pool</span>
          </div>
        </div>
      </div>
    </section>
  );
}
