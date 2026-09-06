import Link from "next/link";
import { Zap, Theater, Laptop, MapPin } from "lucide-react";

interface EventItemData {
  id?: string;
  name?: string;
  description?: string | null;
  category?: "ON_STAGE" | "OFF_STAGE";
  fee?: number;
  venue?: string | null;
}

interface EventCardProps {
  id?: string;
  name?: string;
  description?: string;
  category?: "ON_STAGE" | "OFF_STAGE";
  fee?: number;
  venue?: string;
  icon?: React.ReactNode;
  index?: number;
  event?: EventItemData;
}

export default function EventCard(props: EventCardProps) {
  const eventObj = props.event || {};
  const id = props.id || eventObj.id;
  const name = props.name || eventObj.name || "Competition Event";
  const description = props.description || eventObj.description || "";
  const category = props.category || eventObj.category || "ON_STAGE";
  const fee = props.fee ?? eventObj.fee ?? 0;
  const venue = props.venue || eventObj.venue || "";
  const icon = props.icon;
  const index = props.index || 0;

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
                ? "bg-[#FF6B1A]/10 text-[#EA580C] border border-[#FF6B1A]/20"
                : "bg-[#D9A441]/12 text-[#B45309] border border-[#D9A441]/30"
            }`}
          >
            {isOnStage ? <Theater className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
            {isOnStage ? "On-Stage" : "Off-Stage"}
          </span>

          <span className="text-sm font-bold text-[#1C1917] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#1C1917]/15 tabular-nums">
            ₹{fee}
          </span>
        </div>

        {/* Icon & Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#1C1917]/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            {icon || defaultIcon}
          </div>
          <h3
            className="text-lg font-bold text-[#1C1917] group-hover:text-[#FF6B1A] transition-colors leading-snug"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            {name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-[#57534E] leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>
      </div>

      {/* Meta info & Action */}
      <div className="pt-4 border-t border-[#1C1917]/10 mt-auto">
        {venue && (
          <div className="flex items-center gap-2 text-xs text-[#57534E] mb-4">
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
