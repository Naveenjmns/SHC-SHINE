import Link from "next/link";
import { Trophy, Theater, Laptop } from "lucide-react";
import { ActiveEditionConfig } from "@/lib/eventService";

interface FooterProps {
  edition?: ActiveEditionConfig;
}

export default function Footer({ edition }: FooterProps) {
  const eventName = edition?.name || "Event Fest";
  const editionYear = edition?.edition || "2026";
  const institutionName = edition?.institutionName || "College Campus";
  const hostDepartment = edition?.hostDepartment || "Academic Department";
  const contactEmail = edition?.contactEmail || "fest@college.edu";
  const contactPhone = edition?.contactPhone || "+91 4175 240464";
  const location = edition?.institutionLocation || edition?.venue || "Campus Venue";
  const logoUrl = edition?.logoUrl;

  return (
    <footer className="border-t border-[#1C1917] bg-[#1C1917] text-stone-300 text-xs">
      <div className="container-shine py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo & Mission */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              {logoUrl ? (
                <img src={logoUrl} alt={eventName} className="h-8 w-auto object-contain" />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-base shadow-sm"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {eventName.charAt(0)}
                </div>
              )}
              <span
                className="text-lg font-extrabold text-white"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {eventName} <span className="hero-wordmark-gradient">{editionYear}</span>
              </span>
            </Link>
            <p className="leading-relaxed mb-4 text-stone-400">
              {edition?.description ||
                `Annual Intercollegiate Symposium organized by ${hostDepartment}, ${institutionName}.`}
            </p>
            {edition?.startDate && (
              <div className="text-[#D9A441] font-bold">
                {new Date(edition.startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">About {eventName}</Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">All Competitions</Link>
              </li>
              <li>
                <Link href="/#schedule" className="hover:text-white transition-colors">Schedule & Timeline</Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-[#D9A441] hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#D9A441]" /> Live Stage Results
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-[#FF6B1A] hover:text-orange-400 font-bold transition-colors">
                  Online Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Arenas */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Fest Arenas
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/events?category=ON_STAGE" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <Theater className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                  <span>On-Stage Competitions & Live Presentations</span>
                </Link>
              </li>
              <li>
                <Link href="/events?category=OFF_STAGE" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                  <span>Off-Stage Technical & Creative Challenges</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Venue */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Reach Us
            </h4>
            <div className="space-y-2 leading-relaxed text-stone-400">
              <div className="text-white font-bold">{institutionName}</div>
              <div>{location}</div>
              <div>Email: <a href={`mailto:${contactEmail}`} className="text-[#D9A441] hover:underline font-semibold">{contactEmail}</a></div>
              <div>Phone: <a href={`tel:${contactPhone}`} className="text-[#D9A441] hover:underline font-semibold">{contactPhone}</a></div>
              {edition?.websiteUrl && (
                <div>Web: <a href={edition.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{edition.websiteUrl}</a></div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} {hostDepartment}, {institutionName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <span>•</span>
            <span className="text-stone-500">Event Management Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
