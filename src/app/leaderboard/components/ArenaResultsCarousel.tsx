"use client";

import React from "react";
import {
  Theater,
  Laptop,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LeaderboardPodium, { PodiumTeam } from "./LeaderboardPodium";

export interface EventWithResults {
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

interface ArenaResultsCarouselProps {
  currentEvent: EventWithResults;
  totalEvents: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  isFullscreen: boolean;
}

export default function ArenaResultsCarousel({
  currentEvent,
  totalEvents,
  currentIndex,
  onPrev,
  onNext,
  isFullscreen,
}: ArenaResultsCarouselProps) {
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
    <div className="max-w-6xl mx-auto text-center space-y-6">
      {/* Category & Pagination Pill */}
      <div className="flex items-center justify-center gap-3">
        <div className="pill-badge">
          {currentEvent.category === "ON_STAGE" ? (
            <>
              <Theater className="w-3.5 h-3.5" />
              <span>On-Stage Arena</span>
            </>
          ) : (
            <>
              <Laptop className="w-3.5 h-3.5" />
              <span>Off-Stage Arena</span>
            </>
          )}
        </div>

        <span className="text-sm font-semibold text-ink-muted tabular-nums px-3 py-1 rounded-full bg-surface border border-border">
          {currentIndex + 1} of {totalEvents}
        </span>
      </div>

      {/* Title & Remote Navigation */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={onPrev}
          className="p-2 sm:p-2.5 rounded-[8px] bg-surface border border-border hover:border-accent text-ink hover:text-accent shadow-card transition-colors cursor-pointer shrink-0"
          title="Previous Competition (Left Arrow key)"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight flex-1 text-center">
          {currentEvent.name}
        </h2>

        <button
          type="button"
          onClick={onNext}
          className="p-2 sm:p-2.5 rounded-[8px] bg-surface border border-border hover:border-accent text-ink hover:text-accent shadow-card transition-colors cursor-pointer shrink-0"
          title="Next Competition (Right Arrow key)"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Venue Room */}
      <p className="text-[15px] sm:text-base font-medium text-ink-muted flex items-center justify-center gap-1.5 pb-2">
        <MapPin className="w-4 h-4 text-accent" />
        <span>{currentEvent.venue || "Sacred Heart College Campus"}</span>
      </p>

      {/* 3-Tier Podium */}
      <LeaderboardPodium first={first} second={second} third={third} />
    </div>
  );
}

