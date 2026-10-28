import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, EmptyState } from "@/components/ui";
import { Theater, Laptop, MapPin, Clock, ArrowRight, BookOpen } from "lucide-react";
import { formatTimeSafe, formatDateSafe } from "@/lib/dateUtils";

export interface StudentRegistrationItem {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result?: string | null;
  score?: number | null;
  event: {
    id: string;
    name: string;
    category: "ON_STAGE" | "OFF_STAGE";
    venue: string | null;
    venueZoneId?: string | null;
    dateTime: string | Date;
    hasPrelims?: boolean;
    prelimsVenue?: string | null;
    prelimsDateTime?: string | Date | null;
  };
}

interface RegisteredEventsListProps {
  registrations: StudentRegistrationItem[];
}

export default function RegisteredEventsList({ registrations }: RegisteredEventsListProps) {
  if (registrations.length === 0) {
    return (
      <EmptyState
        title="No Competitions Registered"
        description="You have not been assigned to any symposium competition arena yet."
        action={{
          label: "Explore Competitions",
          onClick: () => {
            if (typeof window !== "undefined") window.location.href = "/events";
          },
        }}
      />
    );
  }

  const getStatusBadge = (status: "PENDING" | "CONFIRMED" | "REJECTED") => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="confirmed" size="sm">Confirmed</Badge>;
      case "PENDING":
        return <Badge variant="pending" size="sm">Pending Review</Badge>;
      case "REJECTED":
        return <Badge variant="rejected" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">
          My Registered Arenas ({registrations.length})
        </h3>
        <Link href="/events" className="text-sm text-accent hover:underline font-semibold">
          View All Events →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {registrations.map((reg) => (
          <Card key={reg.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={reg.event.category === "ON_STAGE" ? "confirmed" : "neutral"}
                    size="sm"
                  >
                    {reg.event.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                  </Badge>
                  {getStatusBadge(reg.status)}
                </div>
                <h4 className="text-[15px] font-bold text-ink truncate">{reg.event.name}</h4>
              </div>

              {reg.result && (
                <Badge variant="gold" size="sm">
                  {reg.result}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5 pt-1 text-sm text-ink-muted">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{formatDateSafe(reg.event.dateTime)} at {formatTimeSafe(reg.event.dateTime)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{reg.event.venue || "Main Auditorium"}</span>
              </div>

              {reg.event.hasPrelims && (
                <div className="text-xs text-warning-ink font-medium">
                  Prelims: {reg.event.prelimsVenue || "Lab 3"}
                  {reg.event.prelimsDateTime && ` at ${formatTimeSafe(reg.event.prelimsDateTime)}`}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              {reg.event.venueZoneId ? (
                <Link href={`/loc/${reg.event.venueZoneId}`}>
                  <Button variant="ghost" size="sm">
                    Navigate
                  </Button>
                </Link>
              ) : (
                <span />
              )}

              <Link href={`/events#${reg.event.id}`}>
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                  Rules
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

