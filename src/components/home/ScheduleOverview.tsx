import React from "react";
import { Badge } from "@/components/ui";
import { Clock, MapPin } from "lucide-react";
import { ActiveEditionConfig, getActiveEdition } from "@/lib/eventService";

interface ScheduleOverviewProps {
  edition?: ActiveEditionConfig;
}

export default async function ScheduleOverview({ edition }: ScheduleOverviewProps) {
  // The schedule is configured per edition by the admin; nothing is rendered until it exists.
  const activeEdition = edition ?? (await getActiveEdition());
  const scheduleItems = [...(activeEdition?.scheduleItems ?? [])].sort((a, b) => a.order - b.order);

  if (scheduleItems.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-1">
        <Badge variant="accent">DAY ITINERARY</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
          Symposium Schedule
        </h2>
        <p className="text-sm text-ink-muted max-w-xl">
          Complete timeline of on-stage presentations, lab sessions, and the grand valedictory ceremony.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduleItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-[12px] bg-surface border border-border hover:border-border-strong transition-colors flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-accent">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{item.time}</span>
              </div>
              <h3 className="text-base font-bold text-ink leading-snug">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs text-ink-muted leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {item.venue && (
              <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-ink-subtle">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{item.venue}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
