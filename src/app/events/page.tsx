"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { Input, Badge, EmptyState } from "@/components/ui";
import { Search, Theater, Laptop, Sparkles, Filter } from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  venueZoneId?: string | null;
  dateTime: string;
  rules: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | null;
  prelimsVenue?: string | null;
  prelimsVenueZoneId?: string | null;
  prelimsRules?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "ON_STAGE" | "OFF_STAGE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await safeJson(res, { success: false, events: [] });
        if (data.success && data.events) {
          setEvents(data.events);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesCategory =
      categoryFilter === "ALL" || evt.category === categoryFilter;
    const matchesSearch =
      searchQuery === "" ||
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.venue && evt.venue.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const onStageCount = events.filter((e) => e.category === "ON_STAGE").length;
  const offStageCount = events.filter((e) => e.category === "OFF_STAGE").length;

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-8">
        {/* Header Title & Intro */}
        <div className="space-y-2 border-b border-border pb-6">
          <Badge variant="accent">COMPETITIONS DIRECTORY</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-ink tracking-tight">
            Fest Competitions & Arenas
          </h1>
          <p className="text-sm text-ink-muted max-w-2xl">
            Explore all 14 symposium competitions across on-stage presentations and technical coding labs.
            Review venue waypoints, evaluation rules, and coordinator contacts.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Filter Chips */}
          <div className="inline-flex items-center p-1 rounded-[8px] bg-surface-raised border border-border gap-1 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`min-h-[38px] px-3.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === "ALL"
                  ? "bg-surface text-ink border border-border shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-surface/40"
              }`}
            >
              All Events ({events.length})
            </button>

            <button
              onClick={() => setCategoryFilter("ON_STAGE")}
              className={`min-h-[38px] px-3.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === "ON_STAGE"
                  ? "bg-surface text-ink border border-border shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-surface/40"
              }`}
            >
              <Theater className="w-3.5 h-3.5 text-accent shrink-0" />
              On-Stage ({onStageCount})
            </button>

            <button
              onClick={() => setCategoryFilter("OFF_STAGE")}
              className={`min-h-[38px] px-3.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === "OFF_STAGE"
                  ? "bg-surface text-ink border border-border shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-surface/40"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-accent shrink-0" />
              Off-Stage ({offStageCount})
            </button>
          </div>

          {/* Search Field */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search competitions, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className="w-4 h-4 text-ink-subtle" />}
            />
          </div>
        </div>

        {/* Content Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-[12px] bg-surface-raised border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No Competitions Found"
            description={
              searchQuery
                ? `No event matches your search query "${searchQuery}". Try searching for another keyword.`
                : "No events are available in this category."
            }
            action={
              searchQuery
                ? {
                    label: "Clear Search Filter",
                    onClick: () => setSearchQuery(""),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <EventCard key={evt.id} {...evt} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
