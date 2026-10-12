"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { ActiveEditionConfig } from "@/lib/eventService";
import AboutAppModal from "./footer/AboutAppModal";
import FooterLinksGrid from "./footer/FooterLinksGrid";

interface FooterProps {
  edition?: ActiveEditionConfig | null;
}

export default function Footer({ edition: initialEdition }: FooterProps) {
  const [edition, setEdition] = useState<ActiveEditionConfig | null>(initialEdition || null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (initialEdition) {
      setEdition(initialEdition);
      return;
    }
    let isMounted = true;
    fetch("/api/edition/active")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.edition) {
          setEdition(data.edition);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [initialEdition]);

  const eventName = edition?.name || "SHINE";
  const editionYear = edition?.edition || "26";
  const institutionName =
    edition?.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR";
  const hostDepartment =
    edition?.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS (PG)";
  const contactEmail = edition?.contactEmail || "shine@shctpt.edu";
  const contactPhone = edition?.contactPhone || "+91 4175 240464";
  const location =
    edition?.institutionLocation ||
    edition?.venue ||
    "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur";
  const logoUrl = edition?.logoUrl || "/uploads/1788792011099_SHINE_26_LOGO.png";
  const description =
    edition?.description ||
    `SHINE 26 is the annual intercollegiate flagship symposium organized by ${hostDepartment}, ${institutionName}.`;
  const startDate = edition?.startDate || "2026-09-17T04:00:00.000Z";

  return (
    <footer className="border-t border-[#1C1917] bg-[#1C1917] text-stone-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo & Mission */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={eventName}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-base">
                  {eventName.charAt(0)}
                </div>
              )}
              <span className="text-base font-bold text-white tracking-tight">
                {eventName} <span className="text-[var(--accent)]">{editionYear}</span>
              </span>
            </Link>
            <p className="leading-relaxed mb-3 text-stone-400 text-xs max-w-sm">
              {description}
            </p>
            {startDate && (
              <div className="text-[var(--accent)] font-semibold text-xs">
                {new Date(startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Col 2, 3, 4: Quick Links, Arenas, Reach Us */}
          <FooterLinksGrid
            eventName={eventName}
            institutionName={institutionName}
            location={location}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            websiteUrl={edition?.websiteUrl}
            onOpenAboutModal={() => setShowAboutModal(true)}
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} {hostDepartment}, {institutionName}. All rights reserved.
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-stone-300 hover:text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>About the App</span>
            </button>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Portal Login
            </Link>
            <span>•</span>
            <span className="text-stone-500">SHINE Symposium OS</span>
          </div>
        </div>
      </div>

      {/* About Modal */}
      <AboutAppModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </footer>
  );
}
