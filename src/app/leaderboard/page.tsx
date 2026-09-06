"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StageHeaderBanner from "@/components/StageHeaderBanner";
import { ActiveEditionConfig } from "@/lib/eventService";
import {
  RotateCw,
  Pause,
  Maximize2,
  Theater,
  Laptop,
  MapPin,
  Medal,
  Trophy,
  Crown,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

interface ResultEntry {
  id: string;
  result: string;
  user: {
    name: string;
    college: string | null;
  };
}

interface EventWithResults {
  id: string;
  name: string;
  category: string;
  venue: string | null;
  results: ResultEntry[];
}

export default function StageLeaderboardPage() {
  const [edition, setEdition] = useState<ActiveEditionConfig | null>(null);
  const [events, setEvents] = useState<EventWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadStageData() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (data.success) {
          if (data.edition) setEdition(data.edition);
          if (data.events) setEvents(data.events);
        }
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStageData();
  }, []);

  // Auto-rotate every 7 seconds if enabled
  useEffect(() => {
    if (!autoRotate || events.length === 0) return;
    const interval = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % events.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [autoRotate, events.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentEvent = events[activeEventIndex];

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FAF8F5] text-[#1C1917] select-none font-sans">
      {/* Official College Stage Header Banner */}
      {edition && <StageHeaderBanner edition={edition} />}

      {/* Control Bar & Stage View Header */}
      <header className="bg-white/90 border-b border-[#1C1917]/10 px-6 py-4 sticky top-0 z-40 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-xl shadow-md">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 px-2.5 py-0.5 rounded-full">
                  Stage Presentation View
                </span>
                <span className="text-xs text-[#57534E] font-medium hidden sm:inline">
                  {edition ? `${edition.name} ${edition.edition}` : "SHINE 26"}
                </span>
              </div>
              <h1
                className="text-lg sm:text-xl font-black text-[#1C1917] tracking-tight"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                Auditorium Competition Leaderboard
              </h1>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-2 ${
                autoRotate
                  ? "bg-[#D9A441]/15 border-[#D9A441]/40 text-[#B45309]"
                  : "bg-stone-100 border-stone-300 text-[#57534E]"
              }`}
            >
              {autoRotate ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-[#D9A441]" />
                  <span>Auto-Cycling (7s)</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Paused</span>
                </>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3.5 py-2 bg-stone-100 border border-stone-300 hover:border-stone-400 text-[#1C1917] rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>

            <Link
              href="/"
              className="btn-ember !py-2 !px-4 text-xs font-extrabold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Stage View</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Showcase Stage Area */}
      <section className="my-auto py-10 px-4 sm:px-8">
        {loading || !currentEvent ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF6B1A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-lg font-extrabold text-[#1C1917]">Loading live stage board...</div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto text-center animate-fade-in">
            {/* Category Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-4">
              {currentEvent.category === "ON_STAGE" ? (
                <>
                  <Theater className="w-4 h-4" />
                  <span>On-Stage Arena Showcase</span>
                </>
              ) : (
                <>
                  <Laptop className="w-4 h-4" />
                  <span>Off-Stage Arena Showcase</span>
                </>
              )}
            </div>

            {/* Event Name */}
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight mb-3"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              {currentEvent.name}
            </h2>

            {/* Venue Location */}
            <p className="text-sm sm:text-base font-semibold text-[#57534E] mb-10 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#D9A441]" />
              <span>{currentEvent.venue || "Sacred Heart College Campus"}</span>
            </p>

            {/* Podium Cards Grid (Soft Cream Design System) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
              
              {/* 1st Place Champion */}
              <div className="fest-card p-8 border-2 border-[#D9A441] bg-white shadow-xl shadow-amber-500/10 order-1 md:order-2 flex flex-col justify-between transform md:-translate-y-2">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#D9A441]/15 border border-[#D9A441]/30 flex items-center justify-center text-[#D9A441]">
                      <Crown className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-extrabold text-[#B45309] uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      1st Place • Champion
                    </span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl font-black text-[#1C1917] mb-2 leading-tight"
                    style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                  >
                    {currentEvent.results[0]?.user.name || "Awaiting Final Verdict"}
                  </h3>

                  <p className="text-sm font-extrabold text-[#B45309] mb-4">
                    {currentEvent.results[0]?.user.college || "Judges Evaluation in Progress"}
                  </p>
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D9A441]" />
                  <span>Award: Cash Prize + Trophy + Certificate</span>
                </div>
              </div>

              {/* 2nd Place Runner-Up */}
              <div className="fest-card p-8 border-2 border-stone-300 bg-white shadow-md order-2 md:order-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700">
                      <Medal className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-extrabold text-stone-800 uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-full border border-stone-300">
                      2nd Place • Runner-Up
                    </span>
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-black text-[#1C1917] mb-2 leading-tight"
                    style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                  >
                    {currentEvent.results[1]?.user.name || "Awaiting Score"}
                  </h3>

                  <p className="text-sm font-semibold text-[#57534E] mb-4">
                    {currentEvent.results[1]?.user.college || "Panel Review"}
                  </p>
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2">
                  <Medal className="w-4 h-4 text-stone-500" />
                  <span>Award: Cash Prize + Merit Certificate</span>
                </div>
              </div>

              {/* 3rd Place Finalist */}
              <div className="fest-card p-8 border-2 border-[#FF6B1A]/30 bg-white shadow-md order-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A]">
                      <Medal className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-extrabold text-[#C2410C] uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
                      3rd Place • Finalist
                    </span>
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-black text-[#1C1917] mb-2 leading-tight"
                    style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                  >
                    {currentEvent.results[2]?.user.name || "Awaiting Score"}
                  </h3>

                  <p className="text-sm font-semibold text-[#57534E] mb-4">
                    {currentEvent.results[2]?.user.college || "Panel Review"}
                  </p>
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B1A]" />
                  <span>Award: Distinction Certificate</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* Bottom Event Carousel Selector */}
      <footer className="bg-white/80 border-t border-[#1C1917]/10 p-4 sm:p-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-xs text-[#57534E] mb-3">
            <span className="font-extrabold uppercase tracking-wider text-[#1C1917]">
              Select Competition Display ({events.length > 0 ? activeEventIndex + 1 : 0} of {events.length})
            </span>
            <span className="hidden sm:inline">Click any competition tab to lock stage view</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {events.map((ev, i) => (
              <button
                key={ev.id}
                onClick={() => {
                  setActiveEventIndex(i);
                  setAutoRotate(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                  activeEventIndex === i
                    ? "bg-[#FF6B1A] border-[#FF6B1A] text-white shadow-md"
                    : "bg-white border-stone-200 text-[#57534E] hover:text-[#1C1917] hover:border-stone-400"
                }`}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
