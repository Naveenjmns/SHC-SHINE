import React from "react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { ArrowRight, Theater, Laptop, MapPin, Clock, Trophy } from "lucide-react";
import { formatTimeSafe } from "@/lib/dateUtils";

interface EventSummary {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  venue: string | null;
  venueZoneId?: string | null;
  dateTime: Date | string;
  fee: number;
}

interface FestArenasGridProps {
  events: EventSummary[];
}

export default function FestArenasGrid({ events }: FestArenasGridProps) {
  const onStageEvents = events.filter((e) => e.category === "ON_STAGE");
  const offStageEvents = events.filter((e) => e.category === "OFF_STAGE");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Badge variant="accent">COMPETITION ARENAS</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
            Flagship Symposium Events
          </h2>
          <p className="text-sm text-ink-muted max-w-xl">
            Compete across live auditorium presentations and technical laboratory challenges.
          </p>
        </div>

        <Link href="/events" className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            All Competitions ({events.length})
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* On-Stage Arena Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-ink">
            <Theater className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold font-display">On-Stage Presentations</h3>
            <span className="text-xs text-ink-muted font-mono">({onStageEvents.length})</span>
          </div>

          <div className="space-y-3">
            {onStageEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-[12px] bg-surface border border-border hover:border-border-strong transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="confirmed" size="sm">On-Stage</Badge>
                    <span className="text-xs font-mono text-ink-muted">
                      {formatTimeSafe(evt.dateTime)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-ink truncate">{evt.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <span className="truncate">{evt.venue || "Main Auditorium"}</span>
                  </div>
                </div>

                <Link href={`/events#${evt.id}`} className="shrink-0 self-end sm:self-center">
                  <Button variant="secondary" size="sm">
                    Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Off-Stage Arena Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-ink">
            <Laptop className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold font-display">Off-Stage Technical Challenges</h3>
            <span className="text-xs text-ink-muted font-mono">({offStageEvents.length})</span>
          </div>

          <div className="space-y-3">
            {offStageEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-[12px] bg-surface border border-border hover:border-border-strong transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">Off-Stage</Badge>
                    <span className="text-xs font-mono text-ink-muted">
                      {formatTimeSafe(evt.dateTime)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-ink truncate">{evt.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <span className="truncate">{evt.venue || "Computer Science Labs"}</span>
                  </div>
                </div>

                <Link href={`/events#${evt.id}`} className="shrink-0 self-end sm:self-center">
                  <Button variant="secondary" size="sm">
                    Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
