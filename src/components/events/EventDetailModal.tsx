"use client";

import React from "react";
import Link from "next/link";
import { Modal, Badge, Button, Avatar } from "@/components/ui";
import {
  MapPin,
  Clock,
  BookOpen,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { formatDateSafe, formatTimeSafe } from "@/lib/dateUtils";

export interface EventDetailData {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  venue: string | null;
  venueZoneId?: string | null;
  dateTime: Date | string;
  rules?: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: Date | string | null;
  prelimsVenue?: string | null;
  prelimsRules?: string | null;
  fee?: number;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetailData | null;
}

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
}: EventDetailModalProps) {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Badge
            variant={event.category === "ON_STAGE" ? "confirmed" : "neutral"}
            size="sm"
          >
            {event.category === "ON_STAGE" ? "On-Stage Arena" : "Off-Stage Challenge"}
          </Badge>
          <span className="truncate">{event.name}</span>
        </div>
      }
      description={`${formatDateSafe(event.dateTime)} • ${formatTimeSafe(event.dateTime)}`}
      maxWidth="lg"
    >
      <div className="space-y-6 text-sm text-ink">
        {/* Venue & Location Waypoint */}
        <div className="p-4 rounded-[8px] bg-surface-raised border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center text-accent shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">Arena Venue</div>
              <div className="text-xs text-ink-muted">{event.venue || "Main Auditorium Complex"}</div>
            </div>
          </div>

          {event.venueZoneId && (
            <Link href={`/loc/${event.venueZoneId}`}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Indoor Navigation
              </Button>
            </Link>
          )}
        </div>

        {/* Rules & Guidelines */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <BookOpen className="w-4 h-4 text-accent" /> Rules & Evaluation Criteria
          </div>
          <div className="p-4 rounded-[8px] border border-border bg-surface text-xs leading-relaxed text-ink space-y-2 max-h-48 overflow-y-auto whitespace-pre-line">
            {event.rules ||
              "1. Valid bona fide college ID card is mandatory.\n2. Maximum 2 participants per institution.\n3. Decision of the judging panel will be final and binding."}
          </div>
        </div>

        {/* Prelims Schedule (if applicable) */}
        {event.hasPrelims && (
          <div className="p-4 rounded-[8px] border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Calendar className="w-4 h-4 text-amber-600" /> Preliminary Round Schedule
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
              Venue: <span className="font-semibold">{event.prelimsVenue || "Lab 3"}</span>
              {event.prelimsDateTime && ` at ${formatTimeSafe(event.prelimsDateTime)}`}
            </p>
            {event.prelimsRules && (
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 italic">
                {event.prelimsRules}
              </p>
            )}
          </div>
        )}

        {/* Event Coordinators Strip */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Event Coordinators
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.staffCoordinatorName && (
              <div className="p-3 rounded-[8px] border border-border bg-surface-raised flex items-center gap-3">
                <Avatar name={event.staffCoordinatorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink truncate">
                    {event.staffCoordinatorName}
                  </div>
                  <div className="text-[11px] text-ink-muted">Staff Coordinator</div>
                  {event.staffCoordinatorPhone && (
                    <a
                      href={`tel:${event.staffCoordinatorPhone}`}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {event.staffCoordinatorPhone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {event.studentCoordinatorName && (
              <div className="p-3 rounded-[8px] border border-border bg-surface-raised flex items-center gap-3">
                <Avatar name={event.studentCoordinatorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink truncate">
                    {event.studentCoordinatorName}
                  </div>
                  <div className="text-[11px] text-ink-muted">Student Coordinator</div>
                  {event.studentCoordinatorPhone && (
                    <a
                      href={`tel:${event.studentCoordinatorPhone}`}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {event.studentCoordinatorPhone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom CTA */}
        <div className="pt-2 flex items-center justify-between border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          <Link href="/register">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Register for this Event
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

