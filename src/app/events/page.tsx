"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import {
  Theater,
  Laptop,
  Search,
  Sparkles,
} from "lucide-react";

interface CoordinatorInfo {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  imageUrl?: string | null;
}

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  dateTime: string;
  rules: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | null;
  prelimsVenue?: string | null;
  prelimsRules?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  staffCoordinatorImageUrl?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
  studentCoordinatorImageUrl?: string | null;
  staffCoordinator?: CoordinatorInfo | null;
  studentCoordinator?: CoordinatorInfo | null;
  coordinator?: CoordinatorInfo | null;
  _count?: {
    registrations: number;
  };
}

import { safeJson } from "@/lib/safeFetch";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ON_STAGE" | "OFF_STAGE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingRulesEvent, setViewingRulesEvent] = useState<EventItem | null>(null);

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

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = activeTab === "ALL" || ev.category === activeTab;
    const matchesSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      {/* Header Section */}
      <section className="pt-28 pb-12 bg-white border-b border-[#1C1917]/10">
        <div className="container-shine text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#EA580C] text-xs font-bold uppercase tracking-wider mb-4 border border-[#FF6B1A]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fest Competitions</span>
          </div>

          <h1
            className="text-fluid-h1 font-black text-[#1C1917] tracking-tight mb-4"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            All Event <span className="hero-wordmark-gradient">Arenas</span>
          </h1>
          <p className="text-fluid-body text-[#57534E] max-w-2xl mx-auto">
            Review competition descriptions, rules & regulations, venues, and incharge coordinators. Register as a delegate to participate.
          </p>

          {/* Search Bar & Category Controls */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search event name, topic, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-[#1C1917]/15 rounded-xl px-4 pl-11 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
              />
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#78716C]" />
            </div>

            <div className="flex flex-wrap justify-center bg-stone-200/60 border border-[#1C1917]/10 rounded-xl p-1 shrink-0 self-center sm:self-auto max-w-full">
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
            <h3 className="text-lg font-bold text-[#1C1917] mb-1">No Competitions Found</h3>
            <p className="text-xs text-[#78716C] mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredEvents.map((ev, index) => (
              <EventCard
                key={ev.id}
                id={ev.id}
                name={ev.name}
                description={ev.description}
                category={ev.category}
                capacity={ev.capacity}
                venue={ev.venue}
                dateTime={ev.dateTime}
                rules={ev.rules}
                hasPrelims={ev.hasPrelims}
                prelimsDateTime={ev.prelimsDateTime}
                prelimsVenue={ev.prelimsVenue}
                prelimsRules={ev.prelimsRules}
                imageUrl={ev.imageUrl}
                logoUrl={ev.logoUrl}
                staffCoordinator={ev.staffCoordinator}
                studentCoordinator={ev.studentCoordinator}
                coordinator={ev.coordinator}
                staffCoordinatorName={ev.staffCoordinatorName}
                staffCoordinatorEmail={ev.staffCoordinatorEmail}
                staffCoordinatorPhone={ev.staffCoordinatorPhone}
                staffCoordinatorImageUrl={ev.staffCoordinatorImageUrl}
                studentCoordinatorName={ev.studentCoordinatorName}
                studentCoordinatorEmail={ev.studentCoordinatorEmail}
                studentCoordinatorPhone={ev.studentCoordinatorPhone}
                studentCoordinatorImageUrl={ev.studentCoordinatorImageUrl}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
