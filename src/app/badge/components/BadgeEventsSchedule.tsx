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
      <div className="bg-surface border border-border rounded-2xl shadow-card p-6 text-center text-sm text-ink-muted">
        No registered competitions assigned to this delegate pass.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <span>Competition Schedule ({events.length})</span>
        </h3>
        <span className="text-sm font-medium text-ink-muted">
          Reporting Venue Guide
        </span>
      </div>

      <div className="divide-y divide-border">
        {events.map((ev) => {
          const isConfirmed = ev.status === "CONFIRMED";
          return (
            <div key={ev.registrationId} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-[15px] font-bold text-ink">{ev.eventName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
                      {ev.category === "ON_STAGE" ? (
                        <>
                          <Theater className="w-3 h-3 text-accent" />
                          <span>On-Stage</span>
                        </>
                      ) : (
                        <>
                          <Laptop className="w-3 h-3 text-accent" />
                          <span>Off-Stage</span>
                        </>
                      )}
                    </span>
                    <span className="text-border">•</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? "bg-success-surface text-success-ink border border-success-border"
                          : "bg-warning-surface text-warning-ink border border-warning-border"
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
                    className="px-2.5 py-1 rounded-[8px] bg-surface border border-border hover:border-accent hover:text-accent text-ink text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Open Indoor Floor Plan Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5 text-accent" />
                    <span>Locate</span>
                  </button>
                )}
              </div>

              {/* Venue Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                {ev.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span className="font-medium text-ink">{ev.venue}</span>
                  </span>
                )}
                {ev.hasPrelims && ev.prelimsVenue && (
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-warning" />
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

