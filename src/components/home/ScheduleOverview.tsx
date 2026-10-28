import React from "react";
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
    <section className="bg-surface border-y border-border">
      <div className="container-shine py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">Day itinerary</p>
          <h2 className="text-fluid-h1 mt-3">One day, planned to the minute</h2>
          <p className="mt-4 text-lg text-ink-muted max-w-md">
            From reporting desk to valedictory, here is how the symposium unfolds.
          </p>
        </div>

        <div className="blob-stage">
          <div aria-hidden="true" className="blob blob-cyan w-56 h-56 -top-8 -right-8 hidden sm:block" />
          <ol className="relative rounded-2xl bg-surface border border-border shadow-elevated divide-y divide-border">
            {scheduleItems.map((item) => (
              <li key={item.id} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-6">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-accent tabular-nums">
                  <Clock className="w-4 h-4 shrink-0 sm:hidden" />
                  <span>{item.time}</span>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-lg font-semibold text-ink leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-[15px] text-ink-muted leading-relaxed">{item.description}</p>
                  )}
                  {item.venue && (
                    <p className="flex items-center gap-1.5 text-[15px] text-ink-subtle pt-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.venue}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
