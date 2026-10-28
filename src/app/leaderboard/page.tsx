"use client";

import { useEffect, useState } from "react";
import StageHeaderBanner from "@/components/StageHeaderBanner";
import { ActiveEditionConfig, festTitle } from "@/lib/editionDefaults";
import { safeJson } from "@/lib/safeFetch";
import ArenaResultsCarousel, { EventWithResults } from "./components/ArenaResultsCarousel";
import ProjectorControlsBar from "./components/ProjectorControlsBar";

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
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

  // Keyboard navigation for 16:9 stage remotes and operators
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

  // Keep fullscreen state in sync with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    if (!autoRotate || events.length === 0) return;
    const interval = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % events.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [autoRotate, events.length]);

  const currentEvent = events[activeEventIndex];
  const footerMeta = [
    festTitle(edition),
    edition?.hostDepartment,
    edition?.institutionName,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <main className="min-h-screen flex flex-col justify-between bg-canvas text-ink select-none">
      {/* Institutional Stage Header */}
      <StageHeaderBanner edition={edition || undefined} forceVisible showFestLogo />

      {/* Floating Operator Controls */}
      <ProjectorControlsBar
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Arena Showcase */}
      <section className={`my-auto px-4 sm:px-8 w-full ${isFullscreen ? "py-4 sm:py-6" : "py-8 sm:py-12"}`}>
        {loading || !currentEvent ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-base font-semibold text-ink">
              Loading live auditorium stage board...
            </div>
          </div>
        ) : (
          <ArenaResultsCarousel
            currentEvent={currentEvent}
            totalEvents={events.length}
            currentIndex={activeEventIndex}
            onPrev={() => {
              setActiveEventIndex((prev) => (prev - 1 + Math.max(1, events.length)) % Math.max(1, events.length));
              setAutoRotate(false);
            }}
            onNext={() => {
              setActiveEventIndex((prev) => (prev + 1) % Math.max(1, events.length));
              setAutoRotate(false);
            }}
            isFullscreen={isFullscreen}
          />
        )}
      </section>

      {/* Subdued Bottom Metadata Strip */}
      <div className="py-3 px-6 text-center border-t border-border bg-surface text-sm font-medium text-ink-muted">
        {footerMeta}
      </div>
    </main>
  );
}
