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
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between selection:bg-accent selection:text-white">
      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-8 py-5 border-b border-border bg-surface/90 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-[8px] bg-accent flex items-center justify-center text-accent-ink font-bold text-sm">
            S
          </div>
          <div>
            <span className="text-sm font-bold text-ink block">
              SHINE 2026
            </span>
            <span className="text-xs text-ink-muted font-medium">
              Indoor Wayfinding & Checkpoints
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="text-xs font-semibold px-3 py-2 rounded-[8px] border border-border bg-surface text-ink hover:border-accent hover:text-accent transition-colors"
          >
            Events
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-2 rounded-[8px] bg-accent text-accent-ink border border-transparent hover:bg-accent-hover transition-colors"
          >
            My Badge
          </Link>
        </div>
      </header>

      {/* Main Checkpoint Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-center space-y-6">
        {/* Verification Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-elevated relative overflow-hidden space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-surface text-success-ink border border-success-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>QR Checkpoint Verified</span>
            </span>

            <span className="text-xs text-ink-subtle">
              Saved to Device
            </span>
          </div>

          {/* Location Title & Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-muted text-accent flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="eyebrow">
                  Current Location
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                  {waypointDisplayName}
                </h1>
                <p className="text-xs text-ink-muted mt-0.5">
                  ID: <span className="font-mono text-ink font-semibold">{waypointId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action: Open Map */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleStartNavigation()}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-[8px] bg-accent hover:bg-accent-hover active:bg-accent-active text-accent-ink font-semibold text-base flex items-center justify-center gap-2 hover:shadow-button transition-colors cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              <span>Open Interactive Floor Plan</span>
            </button>
          </div>

          {/* Quick Destination Navigation */}
          <div className="space-y-3 pt-5 border-t border-border">
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-accent" />
              <span>Where are you heading?</span>
            </span>

            {zones.length > 0 ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="flex-1 min-w-0 px-4 py-3 rounded-[8px] bg-surface border border-border text-sm font-medium text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                    className="px-4 py-3 rounded-[8px] border border-border bg-surface text-ink hover:border-accent hover:text-accent disabled:opacity-50 disabled:pointer-events-none font-semibold text-sm flex items-center gap-1 transition-colors cursor-pointer"
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
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-raised hover:bg-accent-muted text-ink-muted hover:text-accent-strong transition-colors flex items-center gap-1"
                      >
                        <span>{zone.label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-subtle italic">
                Loading campus destination zones...
              </p>
            )}
          </div>

          {/* Zero-Tracking Privacy Notice */}
          <div className="p-4 rounded-2xl bg-surface-raised flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block mb-0.5 font-semibold">
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
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-ink-muted border-t border-border bg-surface">
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

