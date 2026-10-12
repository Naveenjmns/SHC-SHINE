import React from "react";
import { Badge } from "@/components/ui";
import { Clock, MapPin, Calendar } from "lucide-react";

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
        {DEFAULT_SCHEDULE.map((item, idx) => (
          <div
            key={idx}
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
              <p className="text-xs text-ink-muted leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-ink-subtle">
              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate">{item.venue}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
