import Link from "next/link";
import { Zap, Theater, Laptop, MapPin } from "lucide-react";

interface EventCardProps {
  id?: string;
  name: string;
  description: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee?: number;
  venue?: string;
  icon?: React.ReactNode;
  index?: number;
}

export default function EventCard({
  id,
  name,
  description,
  category,
  fee = 0,
  venue,
  icon,
  index = 0,
}: EventCardProps) {
  const isOnStage = category === "ON_STAGE";
  const defaultIcon = isOnStage ? (
    <Theater className="w-5 h-5 text-[#FF6B1A]" />
  ) : (
    <Laptop className="w-5 h-5 text-[#D9A441]" />
  );

  return (
    <div
      className="fest-card p-6 flex flex-col justify-between group relative overflow-hidden h-full"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div>
        {/* Category & Fee header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isOnStage
                ? "bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20"
                : "bg-[#D9A441]/10 text-[#F2C94C] border border-[#D9A441]/25"
            }`}
          >
            {isOnStage ? <Theater className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
            {isOnStage ? "On-Stage" : "Off-Stage"}
          </span>

          <span className="text-sm font-bold text-white bg-[#252222] px-2.5 py-0.5 rounded-lg border border-white/5 tabular-nums">
            ₹{fee}
          </span>
        </div>

        {/* Icon & Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            {icon || defaultIcon}
          </div>
          <h3
            className="text-lg font-bold text-white group-hover:text-[#FF7A29] transition-colors leading-snug"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>
      </div>

      {/* Meta info & Action */}
      <div className="pt-4 border-t border-white/5 mt-auto">
        {venue && (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-4">
            <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
            <span className="truncate">{venue}</span>
          </div>
        )}

        <Link
          href={id ? `/register?eventId=${id}` : "/register"}
          className="btn-ember w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          Register for {name}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
