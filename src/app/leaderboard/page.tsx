"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StageHeaderBanner from "@/components/StageHeaderBanner";
import { ActiveEditionConfig } from "@/lib/eventService";
import { safeJson } from "@/lib/safeFetch";
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
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from "lucide-react";

interface PodiumTeam {
  rank: 1 | 2 | 3;
  positionTitle: string;
  collegeName: string;
  teamName: string | null;
  participants: string[];
  score: number | null;
  result: string;
  award?: string;
}

interface EventWithResults {
  id: string;
  name: string;
  category: string;
  venue: string | null;
  awards?: {
    first: string;
    second: string;
    third: string;
  };
  podium: {
    first: PodiumTeam | null;
    second: PodiumTeam | null;
    third: PodiumTeam | null;
  };
  teams?: PodiumTeam[];
  results?: Array<{
    id: string;
    result: string;
    user: {
      name: string;
      college: string | null;
    };
  }>;
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
        const data = await safeJson(res, { success: false, edition: null, events: [] });
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

  // Keyboard shortcut navigation for Projector operators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.code === "Space") {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        setActiveEventIndex((prev) => (prev + 1) % Math.max(1, events.length));
        setAutoRotate(false);
      } else if (e.key === "ArrowLeft") {
        setActiveEventIndex((prev) => (prev - 1 + Math.max(1, events.length)) % Math.max(1, events.length));
        setAutoRotate(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [events.length]);

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

  // Derive podium winners safely from structured podium or fallback to results
  const first =
    currentEvent?.podium?.first ||
    (() => {
      const match = currentEvent?.results?.find((r) =>
        r.result?.toLowerCase().includes("1")
      );
      if (!match) return null;
      return {
        rank: 1 as const,
        positionTitle: "1st Place • Champion",
        collegeName: match.user.college || "Delegation College",
        teamName: null,
        participants: [match.user.name],
        score: null,
        result: match.result,
        award: currentEvent?.awards?.first || "Cash Prize + Trophy + Certificate",
      };
    })();

  const second =
    currentEvent?.podium?.second ||
    (() => {
      const match = currentEvent?.results?.find((r) =>
        r.result?.toLowerCase().includes("2")
      );
      if (!match) return null;
      return {
        rank: 2 as const,
        positionTitle: "2nd Place • Runner-Up",
        collegeName: match.user.college || "Delegation College",
        teamName: null,
        participants: [match.user.name],
        score: null,
        result: match.result,
        award: currentEvent?.awards?.second || "Cash Prize + Merit Certificate",
      };
    })();

  const third =
    currentEvent?.podium?.third ||
    (() => {
      const match = currentEvent?.results?.find((r) =>
        r.result?.toLowerCase().includes("3")
      );
      if (!match) return null;
      return {
        rank: 3 as const,
        positionTitle: "3rd Place • Finalist",
        collegeName: match.user.college || "Delegation College",
        teamName: null,
        participants: [match.user.name],
        score: null,
        result: match.result,
        award: currentEvent?.awards?.third || "Distinction Certificate",
      };
    })();

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

            {/* Event Name with Previous & Next Controls for Stage Remotes */}
            <div className="flex items-center justify-center gap-2 sm:gap-5 mb-3 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveEventIndex((prev) => (prev - 1 + Math.max(1, events.length)) % Math.max(1, events.length));
                  setAutoRotate(false);
                }}
                className="tap-target p-2 sm:p-3 rounded-2xl bg-white border border-stone-200 hover:border-orange-500 text-stone-700 hover:text-orange-600 shadow-sm transition-all cursor-pointer shrink-0"
                title="Previous Competition (Left Arrow key)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <h2
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight leading-tight flex-1 text-center"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {currentEvent.name}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setActiveEventIndex((prev) => (prev + 1) % Math.max(1, events.length));
                  setAutoRotate(false);
                }}
                className="tap-target p-2 sm:p-3 rounded-2xl bg-white border border-stone-200 hover:border-orange-500 text-stone-700 hover:text-orange-600 shadow-sm transition-all cursor-pointer shrink-0"
                title="Next Competition (Right Arrow key)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Venue Location */}
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#57534E] mb-8 sm:mb-10 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#D9A441]" />
              <span>{currentEvent.venue || "Sacred Heart College Campus"}</span>
            </p>

            {/* Podium Cards Grid (Auditorium Projector Optimized) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
              
              {/* 1st Place Champion (Elevated & Prominent) */}
              <div className="fest-card p-7 sm:p-8 border-2 border-[#D9A441] bg-white shadow-xl shadow-amber-500/10 order-1 md:order-2 flex flex-col justify-between transform md:-translate-y-3 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent pointer-events-none rounded-bl-full" />
                
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#D9A441]/15 border border-[#D9A441]/30 flex items-center justify-center text-[#D9A441] shadow-2xs">
                      <Crown className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-black text-[#B45309] uppercase tracking-widest bg-amber-100 px-3.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                      1st Place • Champion
                    </span>
                  </div>

                  {first ? (
                    <>
                      {/* College Name: BIG & PROMINENT */}
                      <h3
                        className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1C1917] mb-1.5 leading-tight tracking-tight uppercase"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        {first.collegeName}
                      </h3>

                      {first.teamName && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wide mb-3">
                          <span>Team:</span>
                          <span className="text-[#B45309]">{first.teamName}</span>
                        </div>
                      )}

                      {/* Participants Displayed Cleanly Below */}
                      <div className="mt-4 mb-5 pt-3 border-t border-amber-100/80">
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#B45309] flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-[#D9A441]" />
                          <span>
                            {first.participants.length > 1 ? "Winning Team Members" : "Champion Participant"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {first.participants.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-slate-900 font-bold text-xs sm:text-sm shadow-2xs"
                            >
                              <User className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                              <span>{name}</span>
                            </span>
                          ))}
                        </div>
                        {first.score !== null && first.score !== undefined && (
                          <div className="mt-3 text-xs font-semibold text-stone-500">
                            Evaluated Mark:{" "}
                            <strong className="text-[#B45309] font-black text-sm tabular-nums">
                              {first.score}
                            </strong>{" "}
                            / 100
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-6">
                      <h3
                        className="text-2xl font-black text-stone-400 mb-2 leading-tight"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        Awaiting Champion Verdict
                      </h3>
                      <p className="text-sm font-semibold text-stone-400">
                        Judges evaluation and marks tabulation in progress
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2 mt-2">
                  <Trophy className="w-4 h-4 text-[#D9A441] shrink-0" />
                  <span>Award: {first?.award || currentEvent.awards?.first || "Cash Prize + Trophy + Certificate"}</span>
                </div>
              </div>

              {/* 2nd Place Runner-Up */}
              <div className="fest-card p-7 sm:p-8 border-2 border-stone-300 bg-white shadow-md order-2 md:order-1 flex flex-col justify-between rounded-3xl relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs">
                      <Medal className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-black text-stone-800 uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-full border border-stone-300">
                      2nd Place • Runner-Up
                    </span>
                  </div>

                  {second ? (
                    <>
                      {/* College Name: BIG & PROMINENT */}
                      <h3
                        className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1C1917] mb-1.5 leading-tight tracking-tight uppercase"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        {second.collegeName}
                      </h3>

                      {second.teamName && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wide mb-3">
                          <span>Team:</span>
                          <span className="text-stone-900">{second.teamName}</span>
                        </div>
                      )}

                      {/* Participants Displayed Cleanly Below */}
                      <div className="mt-4 mb-5 pt-3 border-t border-stone-100">
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-stone-500" />
                          <span>
                            {second.participants.length > 1 ? "Team Members" : "Runner-Up Participant"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {second.participants.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-slate-900 font-bold text-xs sm:text-sm shadow-2xs"
                            >
                              <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <span>{name}</span>
                            </span>
                          ))}
                        </div>
                        {second.score !== null && second.score !== undefined && (
                          <div className="mt-3 text-xs font-semibold text-stone-500">
                            Evaluated Mark:{" "}
                            <strong className="text-stone-800 font-black text-sm tabular-nums">
                              {second.score}
                            </strong>{" "}
                            / 100
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-6">
                      <h3
                        className="text-xl font-black text-stone-400 mb-2 leading-tight"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        Awaiting Score
                      </h3>
                      <p className="text-sm font-semibold text-stone-400">
                        Panel review and evaluation pending
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2 mt-2">
                  <Medal className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>Award: {second?.award || currentEvent.awards?.second || "Cash Prize + Merit Certificate"}</span>
                </div>
              </div>

              {/* 3rd Place Finalist */}
              <div className="fest-card p-7 sm:p-8 border-2 border-[#FF6B1A]/30 bg-white shadow-md order-3 flex flex-col justify-between rounded-3xl relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] shadow-2xs">
                      <Medal className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-black text-[#C2410C] uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
                      3rd Place • Finalist
                    </span>
                  </div>

                  {third ? (
                    <>
                      {/* College Name: BIG & PROMINENT */}
                      <h3
                        className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1C1917] mb-1.5 leading-tight tracking-tight uppercase"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        {third.collegeName}
                      </h3>

                      {third.teamName && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold uppercase tracking-wide mb-3">
                          <span>Team:</span>
                          <span className="text-orange-950">{third.teamName}</span>
                        </div>
                      )}

                      {/* Participants Displayed Cleanly Below */}
                      <div className="mt-4 mb-5 pt-3 border-t border-orange-100">
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#C2410C] flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-[#FF6B1A]" />
                          <span>
                            {third.participants.length > 1 ? "Team Members" : "Finalist Participant"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {third.participants.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 border border-orange-200 text-slate-900 font-bold text-xs sm:text-sm shadow-2xs"
                            >
                              <User className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                              <span>{name}</span>
                            </span>
                          ))}
                        </div>
                        {third.score !== null && third.score !== undefined && (
                          <div className="mt-3 text-xs font-semibold text-stone-500">
                            Evaluated Mark:{" "}
                            <strong className="text-[#C2410C] font-black text-sm tabular-nums">
                              {third.score}
                            </strong>{" "}
                            / 100
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-6">
                      <h3
                        className="text-xl font-black text-stone-400 mb-2 leading-tight"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        Awaiting Score
                      </h3>
                      <p className="text-sm font-semibold text-stone-400">
                        Panel review and evaluation pending
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1C1917]/10 pt-4 text-xs font-bold text-[#57534E] flex items-center gap-2 mt-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B1A] shrink-0" />
                  <span>Award: {third?.award || currentEvent.awards?.third || "Distinction Certificate"}</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* Bottom Event Carousel Selector */}
      <footer className="bg-white/80 border-t border-[#1C1917]/10 p-4 sm:p-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#57534E] mb-3">
            <span className="font-extrabold uppercase tracking-wider text-[#1C1917]">
              Select Competition Display ({events.length > 0 ? activeEventIndex + 1 : 0} of {events.length})
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-stone-500">
              <span className="hidden sm:inline">Click any competition tab to lock stage view</span>
              <span className="hidden md:inline-flex items-center gap-1.5 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                <kbd className="font-mono bg-white px-1 rounded shadow-2xs text-[10px] text-stone-800">F</kbd> Fullscreen
                <span className="text-stone-300">•</span>
                <kbd className="font-mono bg-white px-1 rounded shadow-2xs text-[10px] text-stone-800">Space</kbd> Pause
                <span className="text-stone-300">•</span>
                <kbd className="font-mono bg-white px-1 rounded shadow-2xs text-[10px] text-stone-800">←/→</kbd> Cycle
              </span>
            </div>
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
