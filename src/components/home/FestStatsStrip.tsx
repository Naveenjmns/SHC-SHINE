import React from "react";

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
    { label: "Affiliated institutions", value: "40+", subtext: "Across Tamil Nadu & South India" },
    { label: "Fest competitions", value: `${eventsCount}`, subtext: "On-stage & off-stage arenas" },
    { label: "Cash & trophy pool", value: prizePool, subtext: "Plus distinction certificates" },
    { label: "Expected delegates", value: expectedDelegates, subtext: "UG & PG tech innovators" },
  ];

  return (
    <section className="bg-canvas border-y border-border">
      <div className="container-shine py-12">
        <p className="text-center text-sm font-medium text-ink-muted mb-8">
          Trusted by student delegations from across the region
        </p>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <dd className="text-4xl sm:text-[2.75rem] leading-none font-bold text-ink tabular-nums">
                {stat.value}
              </dd>
              <dt className="text-sm font-semibold text-ink pt-2">{stat.label}</dt>
              <p className="text-xs text-ink-muted">{stat.subtext}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
