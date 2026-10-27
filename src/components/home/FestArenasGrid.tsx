import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowRight, Theater, Laptop, MapPin, ChevronRight } from "lucide-react";
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

function ArenaPanel({
  title,
  description,
  icon,
  events,
  fallbackVenue,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  events: EventSummary[];
  fallbackVenue: string;
}) {
  return (
    <div className="feature-panel p-6 sm:p-8 flex flex-col">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[12px] bg-accent-muted text-accent flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-ink">{title}</h3>
          <p className="text-sm text-ink-muted mt-1">{description}</p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border border-t border-border flex-1">
        {events.slice(0, 4).map((evt) => (
          <li key={evt.id}>
            <Link
              href={`/events#${evt.id}`}
              className="group flex items-center justify-between gap-4 py-4 transition-colors"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-base font-semibold text-ink truncate group-hover:text-accent transition-colors">
                  {evt.name}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <span className="tabular-nums font-medium">{formatTimeSafe(evt.dateTime)}</span>
                  <span aria-hidden="true">·</span>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{evt.venue || fallbackVenue}</span>
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-disabled group-hover:text-accent shrink-0 transition-colors" />
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="py-6 text-sm text-ink-muted">Events will be announced soon.</li>
        )}
      </ul>
    </div>
  );
}

export default function FestArenasGrid({ events }: FestArenasGridProps) {
  const onStageEvents = events.filter((e) => e.category === "ON_STAGE");
  const offStageEvents = events.filter((e) => e.category === "OFF_STAGE");

  return (
    <section className="container-shine py-20 lg:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="eyebrow">Competition arenas</p>
        <h2 className="text-fluid-h1 mt-3">Compete where you shine best</h2>
        <p className="mt-4 text-lg text-ink-muted">
          Live auditorium presentations and hands-on technical lab challenges, all in one day.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <ArenaPanel
          title="On-stage"
          description={`${onStageEvents.length} live presentations in front of judges and crowd`}
          icon={<Theater className="w-6 h-6" />}
          events={onStageEvents}
          fallbackVenue="Main Auditorium"
        />
        <ArenaPanel
          title="Off-stage"
          description={`${offStageEvents.length} technical challenges across the CS labs`}
          icon={<Laptop className="w-6 h-6" />}
          events={offStageEvents}
          fallbackVenue="Computer Science Labs"
        />
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/events">
          <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
            View all {events.length} competitions
          </Button>
        </Link>
      </div>
    </section>
  );
}
