import React from "react";
import { Clock, MapPin } from "lucide-react";

interface ScheduleItem {
  time: string;
  title: string;
  venue: string;
  description: string;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    time: "08:30 AM — 09:30 AM",
    title: "Delegate Reporting & Verification",
    venue: "SGB Entrance Desk",
    description: "Verification of college ID cards, distribution of printed badges and lunch passes.",
  },
  {
    time: "09:30 AM — 10:30 AM",
    title: "Grand Inaugural Ceremony",
    venue: "Kamarajar Arangam Main Hall",
    description: "Welcome address by Head of Department, lighting of Kuthuvilakku, and keynote address.",
  },
  {
    time: "10:30 AM — 01:00 PM",
    title: "Morning Arena Sessions & Prelims",
    venue: "Assigned Competition Labs & Halls",
    description: "Commencement of On-Stage events and Off-Stage technical prelims rounds.",
  },
  {
    time: "01:00 PM — 02:00 PM",
    title: "Networking & Symposium Lunch",
    venue: "SGB Quadrangle Dining Hall",
    description: "Complimentary lunch served for all registered delegates and faculty coordinators.",
  },
  {
    time: "02:00 PM — 04:15 PM",
    title: "Finalist Rounds & Stage Showdowns",
    venue: "Main Stage & Projector Arena",
    description: "Top 5 finalists compete live on stage in front of the judging panel and crowd.",
  },
  {
    time: "04:30 PM — 05:30 PM",
    title: "Valedictory & Awards Distribution",
    venue: "Kamarajar Arangam Main Hall",
    description: "Presentation of cash prizes, medals, trophies, and the prestigious SHINE Overall Championship.",
  },
];

export default function ScheduleOverview() {
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
            {DEFAULT_SCHEDULE.map((item, idx) => (
              <li key={idx} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent tabular-nums">
                  <Clock className="w-4 h-4 shrink-0 sm:hidden" />
                  <span>{item.time.split(" — ")[0]}</span>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-lg font-semibold text-ink leading-snug">{item.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-subtle pt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.venue}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
