import React from "react";
import { Building2, Trophy, Users, Award } from "lucide-react";

interface FestStatsStripProps {
  prizePool?: string;
  expectedDelegates?: string;
  eventsCount?: number;
}

export default function FestStatsStrip({
  prizePool = "₹25K+",
  expectedDelegates = "500+",
  eventsCount = 14,
}: FestStatsStripProps) {
  const stats = [
    {
      label: "Affiliated Institutions",
      value: "40+",
      subtext: "Across Tamil Nadu & South India",
      icon: <Building2 className="w-5 h-5 text-accent" />,
    },
    {
      label: "Fest Competitions",
      value: `${eventsCount}`,
      subtext: "On-Stage & Off-Stage Arenas",
      icon: <Award className="w-5 h-5 text-accent" />,
    },
    {
      label: "Cash & Trophy Pool",
      value: prizePool,
      subtext: "Plus Distinction Certificates",
      icon: <Trophy className="w-5 h-5 text-gold" />,
    },
    {
      label: "Expected Delegates",
      value: expectedDelegates,
      subtext: "UG & PG Tech Innovators",
      icon: <Users className="w-5 h-5 text-accent" />,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
      <div className="rounded-[12px] bg-surface border border-border divide-y sm:divide-y-0 sm:divide-x divide-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-5 flex items-start gap-3.5 bg-surface">
            <div className="w-10 h-10 rounded-[8px] bg-surface-raised border border-border flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-ink truncate">
                {stat.label}
              </div>
              <div className="text-[11px] text-ink-muted truncate">
                {stat.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
