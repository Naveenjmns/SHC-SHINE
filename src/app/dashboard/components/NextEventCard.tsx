"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@/components/ui";
import { Clock, MapPin, Phone, ArrowRight, Sparkles, Navigation } from "lucide-react";
import { formatTimeSafe, formatDateSafe } from "@/lib/dateUtils";
import CountdownTimer from "@/components/CountdownTimer";

export interface DashboardEvent {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  venue: string | null;
  venueZoneId?: string | null;
  dateTime: string | Date;
  coordinator?: {
    name: string;
    phone: string | null;
  } | null;
  staffCoordinator?: {
    name: string;
    phone: string | null;
  } | null;
}

interface NextEventCardProps {
  event: DashboardEvent | null;
  festDate?: string | Date | null;
}

export default function NextEventCard({ event, festDate }: NextEventCardProps) {
  if (!event) {
    return (
      <Card className="p-6 bg-surface-raised border-border text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-accent-muted text-accent flex items-center justify-center mx-auto">
          <Sparkles className="w-5 h-5" />
        </div>
        <CardTitle className="text-base">No Registered Arena Yet</CardTitle>
        <CardDescription>
          Explore the symposium competitions and register your team delegation.
        </CardDescription>
        <div className="pt-2">
          <Link href="/events">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Browse Competitions
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const coordName = event.staffCoordinator?.name || event.coordinator?.name;
  const coordPhone = event.staffCoordinator?.phone || event.coordinator?.phone;

  return (
    <Card className="border-accent/40 bg-surface overflow-hidden">
      <div className="bg-accent-muted/40 px-5 py-2.5 border-b border-accent/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            Up Next For You
          </span>
        </div>
        <Badge variant={event.category === "ON_STAGE" ? "confirmed" : "neutral"} size="sm">
          {event.category === "ON_STAGE" ? "On-Stage Arena" : "Off-Stage Challenge"}
        </Badge>
      </div>

      <CardHeader className="pt-4">
        <CardTitle className="text-xl sm:text-2xl text-ink">{event.name}</CardTitle>
        <CardDescription className="text-xs flex items-center gap-2 pt-1">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{formatDateSafe(event.dateTime)} at {formatTimeSafe(event.dateTime)}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Countdown */}
        <div className="p-3.5 rounded-[8px] bg-surface-raised border border-border">
          <CountdownTimer targetDate={event.dateTime} />
        </div>

        {/* Location & Navigation */}
        <div className="p-3.5 rounded-[8px] bg-surface-raised border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center text-accent shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink truncate">Venue Room</div>
              <div className="text-xs text-ink-muted truncate">{event.venue || "Main Auditorium"}</div>
            </div>
          </div>

          {event.venueZoneId ? (
            <Link href={`/loc/${event.venueZoneId}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Navigation className="w-3.5 h-3.5" />}
              >
                Navigate to Room
              </Button>
            </Link>
          ) : (
            <Link href="/loc/wp-entrance">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<MapPin className="w-3.5 h-3.5" />}
              >
                Campus Map
              </Button>
            </Link>
          )}
        </div>

        {/* Coordinator Contact */}
        {coordName && (
          <div className="text-xs text-ink-muted flex items-center justify-between pt-1">
            <span>Coordinator: <strong className="text-ink font-semibold">{coordName}</strong></span>
            {coordPhone && (
              <a
                href={`tel:${coordPhone}`}
                className="text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Phone className="w-3 h-3" /> {coordPhone}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

