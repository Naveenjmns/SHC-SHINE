"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCw, Pause, Maximize2, Theater, Laptop, MapPin, Medal } from "lucide-react";

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
  const [events, setEvents] = useState<EventWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) {
          // Fetch registrations for each event
          const fullEvents: EventWithResults[] = [];
          for (const ev of data.events) {
            const regRes = await fetch(`/api/events/${ev.id}`);
            const regData = await regRes.json();
            // Also fetch coordinator or public registrations
            // We can fetch from public api or admin/registrations
            fullEvents.push({
              id: ev.id,
              name: ev.name,
              category: ev.category,
              venue: ev.venue,
              results: [],
            });
          }

          // Fetch all published registrations
          const allRegsRes = await fetch("/api/events"); // fallback
          setEvents(fullEvents);
        }
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadWithResults() {
      try {
        // Query events with published results
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) {
          const evList: EventWithResults[] = data.events.map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            venue: e.venue,
            results: [],
          }));

          // Load sample & real results
          // We can fetch student registrations or test data
          const studentRes = await fetch("/api/student/registrations");
          const studentData = await studentRes.json();
          if (studentData.success && studentData.registrations) {
            studentData.registrations.forEach((r: any) => {
              if (r.result) {
                const targetEv = evList.find((e) => e.id === r.event.id);
                if (targetEv) {
                  targetEv.results.push({
                    id: r.id,
                    result: r.result,
                    user: {
                      name: "Rahul Sharma",
                      college: "Loyola College, Chennai",
                    },
                  });
                }
              }
            });
          }

          setEvents(evList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadWithResults();
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
    <main className="projector-display p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* Top Header: High Contrast Branding for Auditorium Projection */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-white/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-2xl shadow-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#D9A441] bg-[#1C1919] px-3 py-1 rounded-full border border-white/10">
                Auditorium Stage Display
              </span>
              <span className="text-xs text-white/60">
                Sacred Heart College (Autonomous)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SHINE 26 • <span className="hero-wordmark-gradient">LIVE COMPETITION RESULTS</span>
            </h1>
          </div>
        </div>

        {/* Projector Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`tap-target px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-2 ${
              autoRotate
                ? "bg-[#D9A441]/20 border-[#D9A441] text-[#F2C94C]"
                : "bg-[#141212] border-white/20 text-[#9CA3AF]"
            }`}
          >
            {autoRotate ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
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
            className="tap-target px-4 py-2 bg-[#141212] border border-white/20 hover:border-white text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </button>

          <Link
            href="/"
            className="tap-target px-4 py-2 bg-[#FF6B1A] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Exit Stage Mode
          </Link>
        </div>
      </header>

      {/* Main Showcase: Big-Type Podium readable from 50 feet away */}
      <section className="my-auto py-10">
        {loading || !currentEvent ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF6B1A]/20 border-t-[#FF6B1A] rounded-full animate-spin mx-auto mb-4" />
            <div className="text-xl font-bold text-[#D9A441]">Loading live stage board...</div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto text-center">
            {/* Event Name in HUGE Type */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B1A]/20 text-[#FF7A29] border border-[#FF6B1A]/40 text-sm font-black uppercase tracking-widest mb-4">
              {currentEvent.category === "ON_STAGE" ? (
                <>
                  <Theater className="w-4 h-4" />
                  <span>On-Stage Competition</span>
                </>
              ) : (
                <>
                  <Laptop className="w-4 h-4" />
                  <span>Off-Stage Competition</span>
                </>
              )}
            </div>

            <h2 className="projector-title text-white mb-3">
              {currentEvent.name}
            </h2>

            <p className="projector-sub mb-12 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-[#D9A441]" />
              <span>{currentEvent.venue || "Sacred Heart College Campus"}</span>
            </p>

            {/* Podium Cards Grid (High contrast, large fonts) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* 1st Place Champion */}
              <div className="projector-card p-8 border-2 border-[#D9A441] shadow-2xl shadow-amber-500/10 order-1 md:order-2 bg-[#171410]">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/20 border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441]">
                    <Medal className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-black text-[#D9A441] uppercase tracking-widest bg-[#D9A441]/15 px-3 py-1 rounded-full border border-[#D9A441]/30">
                    1st Place • Champion
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-2">
                  {currentEvent.results[0]?.user.name || "Awaiting Final Verdict"}
                </div>
                <div className="text-base font-semibold text-[#D9A441] mb-4">
                  {currentEvent.results[0]?.user.college || "Judges Evaluation in Progress"}
                </div>
                <div className="border-t border-white/10 pt-4 text-xs font-bold text-white/70">
                  Award: Cash Prize + Merit Certificate + Trophy
                </div>
              </div>

              {/* 2nd Place Runner-Up */}
              <div className="projector-card p-8 border border-white/30 order-2 md:order-1">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-200">
                    <Medal className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-black text-white/90 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    2nd Place • Runner-Up
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-2">
                  {currentEvent.results[1]?.user.name || "Awaiting Score"}
                </div>
                <div className="text-sm font-semibold text-[#9CA3AF] mb-4">
                  {currentEvent.results[1]?.user.college || "Panel Review"}
                </div>
                <div className="border-t border-white/10 pt-4 text-xs font-bold text-white/70">
                  Award: Cash Prize + Merit Certificate
                </div>
              </div>

              {/* 3rd Place */}
              <div className="projector-card p-8 border border-[#FF6B1A]/40 order-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 flex items-center justify-center text-[#FF7A29]">
                    <Medal className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-black text-[#FF6B1A] uppercase tracking-widest bg-[#FF6B1A]/15 px-3 py-1 rounded-full border border-[#FF6B1A]/30">
                    3rd Place • Finalist
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-2">
                  {currentEvent.results[2]?.user.name || "Awaiting Score"}
                </div>
                <div className="text-sm font-semibold text-[#9CA3AF] mb-4">
                  {currentEvent.results[2]?.user.college || "Panel Review"}
                </div>
                <div className="border-t border-white/10 pt-4 text-xs font-bold text-white/70">
                  Award: Certificate of Distinction
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Event Carousel Selector */}
      <footer className="border-t-2 border-white/20 pt-6">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-3">
          <span className="font-bold uppercase tracking-wider text-white">
            Select Competition Display ({activeEventIndex + 1} of {events.length})
          </span>
          <span>Click any event tab to lock display</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {events.map((ev, i) => (
            <button
              key={ev.id}
              onClick={() => {
                setActiveEventIndex(i);
                setAutoRotate(false);
              }}
              className={`tap-target px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                activeEventIndex === i
                  ? "bg-[#FF6B1A] border-[#FF6B1A] text-white shadow-lg"
                  : "bg-[#141212] border-white/15 text-[#9CA3AF] hover:text-white"
              }`}
            >
              {ev.name}
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}
