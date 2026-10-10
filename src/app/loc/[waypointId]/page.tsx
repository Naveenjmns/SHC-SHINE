"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Compass,
  Navigation,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import InteractiveFloorPlanModal from "@/components/InteractiveFloorPlanModal";
import { safeJson } from "@/lib/safeFetch";

interface ZoneOption {
  id: string;
  label: string;
  type: string;
}

export default function CheckpointLocationPage() {
  const params = useParams();
  const rawWaypointId = (params?.waypointId as string) || "wp-entrance";

  // Normalize waypoint id
  const waypointId = useMemo(() => {
    return rawWaypointId.startsWith("wp-") ? rawWaypointId : `wp-${rawWaypointId}`;
  }, [rawWaypointId]);

  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string>("/uploads/campus-floorplan.svg");

  // Derive human-readable waypoint name
  const waypointDisplayName = useMemo(() => {
    const clean = waypointId.replace(/^wp-/, "").replace(/-/g, " ");
    return clean.replace(/\b\w/g, (c) => c.toUpperCase());
  }, [waypointId]);

  // 1. Save scanned waypoint to localStorage for persistent indoor location
  useEffect(() => {
    if (typeof window !== "undefined" && waypointId) {
      try {
        localStorage.setItem("shine_last_waypoint", waypointId);
      } catch (e) {
        console.warn("Could not save waypoint to localStorage:", e);
      }
    }
  }, [waypointId]);

  // 2. Fetch available venue zones and active floor plan URL
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/admin/floorplan/zones");
        const data = await safeJson(res, { success: false, zones: [], floorPlanUrl: "" });
        if (isMounted && data.success) {
          if (Array.isArray(data.zones)) {
            setZones(data.zones);
          }
          if (data.floorPlanUrl) {
            setFloorPlanUrl(data.floorPlanUrl);
          }
        }
      } catch (err) {
        console.warn("Could not fetch floor plan zones:", err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartNavigation = (targetZoneId?: string) => {
    if (targetZoneId) {
      setSelectedDestination(targetZoneId);
    }
    setMapModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0A0A] text-stone-100 flex flex-col justify-between selection:bg-[#FF6B1A] selection:text-white">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#FF6B1A]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-8 py-5 border-b border-stone-800/80 bg-[#121111]/80 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B1A] flex items-center justify-center text-white shadow-md shadow-[#FF6B1A]/20 font-black text-sm">
            S
          </div>
          <div>
            <span className="text-sm font-black tracking-wider text-white uppercase block">
              SHINE 2026
            </span>
            <span className="text-[10px] text-stone-400 font-medium">
              Indoor Wayfinding & Checkpoints
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-900/60 text-stone-300 hover:text-white transition"
          >
            Events
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FF6B1A]/15 text-[#FF6B1A] border border-[#FF6B1A]/30 hover:bg-[#FF6B1A]/25 transition"
          >
            My Badge
          </Link>
        </div>
      </header>

      {/* Main Checkpoint Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-center space-y-6">
        {/* Verification Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#141212] border border-stone-800 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 via-[#FF6B1A] to-amber-500" />

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>QR Checkpoint Verified</span>
            </span>

            <span className="text-[11px] text-stone-500 font-mono">
              Saved to Device
            </span>
          </div>

          {/* Location Title & Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/30 text-[#FF6B1A] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Current Location
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {waypointDisplayName}
                </h1>
                <p className="text-xs text-stone-400 font-mono mt-0.5">
                  ID: <span className="text-stone-300 font-semibold">{waypointId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action: Open Map */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleStartNavigation()}
              className="w-full py-4 px-6 rounded-2xl bg-[#FF6B1A] hover:bg-[#E8551F] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/25 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              <span>Open Interactive Floor Plan</span>
            </button>
          </div>

          {/* Quick Destination Navigation */}
          <div className="space-y-3 pt-3 border-t border-stone-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#FF6B1A]" />
              <span>Where are you heading?</span>
            </span>

            {zones.length > 0 ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-xs font-medium text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                  >
                    <option value="">Select a hall, lab or amenity...</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.label} ({zone.id})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedDestination}
                    onClick={() => handleStartNavigation(selectedDestination)}
                    className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Guide Me</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Popular Quick Destinations */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {zones
                    .filter((z) => z.type === "hall" || z.type === "amenity")
                    .slice(0, 4)
                    .map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => handleStartNavigation(zone.id)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition flex items-center gap-1"
                      >
                        <span>{zone.label}</span>
                        <ChevronRight className="w-3 h-3 text-stone-500" />
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Loading campus destination zones...
              </p>
            )}
          </div>

          {/* Zero-Tracking Privacy Notice */}
          <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-start gap-2.5 text-[11px] text-stone-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-300 block mb-0.5 font-semibold">
                Client-Side Privacy Guarantee
              </strong>
              <span>
                Your physical location is stored solely in your local browser state (localStorage). No GPS telemetry or movement history is sent to or stored in any database.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-stone-500 border-t border-stone-800/60">
        <p>
          Sacred Heart College (Autonomous), Tirupattur • Department of Computer Science
        </p>
      </footer>

      {/* Modal Instance */}
      <InteractiveFloorPlanModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        floorPlanUrl={floorPlanUrl}
        highlightZoneId={selectedDestination || undefined}
        initialFromWaypointId={waypointId}
        title="SHINE Indoor Venue Floor Plan"
        subtitle={`Starting from ${waypointDisplayName} (${waypointId})`}
      />
    </div>
  );
}

