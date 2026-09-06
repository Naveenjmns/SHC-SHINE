"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Theater, Laptop, Search, MapPin, Clock, User } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  dateTime: string;
  coordinator?: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  _count?: {
    registrations: number;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ON_STAGE" | "OFF_STAGE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) {
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

  const filteredEvents = events.filter((e) => {
    const matchesCategory = activeTab === "ALL" || e.category === activeTab;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />

      {/* Header Banner */}
      <section className="pt-32 pb-14 border-b border-[#1C1917]/10 bg-white/70">
        <div className="container-shine text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
            Competitions Directory
          </span>
          <h1
            className="text-fluid-h1 font-black text-[#1C1917] tracking-tight mb-4"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            All 10 Fest <span className="hero-wordmark-gradient">Arenas</span>
          </h1>
          <p className="text-fluid-body text-[#57534E] max-w-2xl mx-auto">
            Review event descriptions, venues, rules, and entry fees. Register individually or select multiple events in one go.
          </p>

          {/* Search Bar & Category Controls (44px tap targets) */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search event name, topic, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-[#1C1917]/15 rounded-xl px-4 pl-11 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
              />
              <svg
                className="w-5 h-5 absolute left-3.5 top-3.5 text-[#78716C]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex bg-stone-200/60 border border-[#1C1917]/10 rounded-xl p-1 shrink-0 self-center sm:self-auto">
              {(["ALL", "ON_STAGE", "OFF_STAGE"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tap-target px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === tab
                      ? "bg-[#FF6B1A] text-white shadow-sm"
                      : "text-[#57534E] hover:text-[#1C1917]"
                  }`}
                >
                  {tab === "ALL" && "All Arenas"}
                  {tab === "ON_STAGE" && (
                    <>
                      <Theater className="w-3.5 h-3.5" />
                      <span>On-Stage</span>
                    </>
                  )}
                  {tab === "OFF_STAGE" && (
                    <>
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Off-Stage</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-14 flex-1 container-shine">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-[#FF6B1A]/20 border-t-[#FF6B1A] rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#57534E]">Loading competitions...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="fest-card p-12 text-center max-w-md mx-auto">
            <Search className="w-10 h-10 text-[#57534E] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[#1C1917] mb-2" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              No Competitions Found
            </h3>
            <p className="text-xs text-[#57534E] mb-6">
              No events matched your search query or filter. Try a different keyword or view all arenas.
            </p>
            <button
              onClick={() => {
                setActiveTab("ALL");
                setSearchQuery("");
              }}
              className="btn-ember text-xs px-6 py-2.5 rounded-xl cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const isOnStage = ev.category === "ON_STAGE";
              const formattedTime = new Date(ev.dateTime).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={ev.id}
                  className="fest-card p-6 flex flex-col justify-between group h-full"
                >
                  <div>
                    {/* Header: Category & Fee */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isOnStage
                            ? "bg-[#FF6B1A]/10 text-[#EA580C] border border-[#FF6B1A]/20"
                            : "bg-[#D9A441]/12 text-[#B45309] border border-[#D9A441]/30"
                        }`}
                      >
                        {isOnStage ? <Theater className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                        {isOnStage ? "On-Stage" : "Off-Stage"}
                      </span>

                      <span className="text-sm font-bold text-[#1C1917] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#1C1917]/15 tabular-nums">
                        ₹{ev.fee}
                      </span>
                    </div>

                    <h3
                      className="text-xl font-bold text-[#1C1917] mb-2 group-hover:text-[#FF6B1A] transition-colors"
                      style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                    >
                      {ev.name}
                    </h3>

                    <p className="text-sm text-[#57534E] leading-relaxed mb-6 line-clamp-3">
                      {ev.description || "Compete against peer colleges in this signature SHINE 26 challenge."}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-[#57534E] pt-4 border-t border-[#1C1917]/10 mb-6">
                      {ev.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                        <span>{formattedTime}</span>
                        {ev.capacity && <span>• Max {ev.capacity} seats</span>}
                      </div>
                      {ev.coordinator && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#57534E]/80 shrink-0" />
                          <span className="truncate">Coord: {ev.coordinator.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Register CTA with 44px min tap target */}
                  <Link
                    href={`/register?eventId=${ev.id}`}
                    className="btn-ember w-full text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    Register for Event
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
