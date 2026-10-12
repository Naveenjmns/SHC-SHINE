"use client";

import React from "react";
import {
  Calendar,
  MapPin,
  Theater,
  Laptop,
  CheckCircle2,
  Clock,
  Navigation,
} from "lucide-react";

export interface RegisteredEventItem {
  registrationId: string;
  status: string;
  eventName: string;
  category: string;
  venue: string | null;
  venueZoneId?: string | null;
  hasPrelims?: boolean;
  prelimsVenue?: string | null;
  prelimsVenueZoneId?: string | null;
  rules: string | null;
  staffIncharge: string | null;
  studentIncharge: string | null;
}

interface BadgeEventsScheduleProps {
  events: RegisteredEventItem[];
  onOpenMapForEvent: (event: RegisteredEventItem) => void;
}

export default function BadgeEventsSchedule({
  events,
  onOpenMapForEvent,
}: BadgeEventsScheduleProps) {
  if (events.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center text-xs text-[var(--ink-muted)]">
        No registered competitions assigned to this delegate pass.
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <span>Competition Schedule ({events.length})</span>
        </h3>
        <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
          Reporting Venue Guide
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {events.map((ev) => {
          const isConfirmed = ev.status === "CONFIRMED";
          return (
            <div key={ev.registrationId} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">{ev.eventName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-muted)]">
                      {ev.category === "ON_STAGE" ? (
                        <>
                          <Theater className="w-3 h-3 text-[var(--accent)]" />
                          <span>On-Stage</span>
                        </>
                      ) : (
                        <>
                          <Laptop className="w-3 h-3 text-[var(--accent)]" />
                          <span>Off-Stage</span>
                        </>
                      )}
                    </span>
                    <span className="text-[var(--border)]">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {isConfirmed ? "Confirmed" : "Pending Confirmation"}
                    </span>
                  </div>
                </div>

                {ev.venue && (
                  <button
                    type="button"
                    onClick={() => onOpenMapForEvent(ev)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--ink)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Open Indoor Floor Plan Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Locate</span>
                  </button>
                )}
              </div>

              {/* Venue Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)]">
                {ev.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="font-medium text-[var(--ink)]">{ev.venue}</span>
                  </span>
                )}
                {ev.hasPrelims && ev.prelimsVenue && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Prelims: {ev.prelimsVenue}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

