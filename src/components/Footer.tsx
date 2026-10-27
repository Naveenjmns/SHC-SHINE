"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { ActiveEditionConfig, DEFAULT_EDITION_CONFIG, festTitle } from "@/lib/editionDefaults";
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

  const eventName = edition?.name || DEFAULT_EDITION_CONFIG.name;
  const editionYear = edition?.edition || DEFAULT_EDITION_CONFIG.edition;
  const fullTitle = festTitle(edition);
  const institutionName = edition?.institutionName || DEFAULT_EDITION_CONFIG.institutionName;
  const hostDepartment = edition?.hostDepartment || DEFAULT_EDITION_CONFIG.hostDepartment;
  const contactEmail = edition?.contactEmail || DEFAULT_EDITION_CONFIG.contactEmail;
  const contactPhone = edition?.contactPhone || DEFAULT_EDITION_CONFIG.contactPhone;
  const location =
    edition?.institutionLocation || edition?.venue || DEFAULT_EDITION_CONFIG.institutionLocation;
  const logoUrl = edition?.logoUrl || DEFAULT_EDITION_CONFIG.logoUrl;
  const organizer = [hostDepartment, institutionName].filter(Boolean).join(", ");
  const description =
    edition?.description ||
    DEFAULT_EDITION_CONFIG.description ||
    (organizer
      ? `${fullTitle} is the annual intercollegiate flagship symposium organized by ${organizer}.`
      : null);
  const startDate = edition?.startDate || DEFAULT_EDITION_CONFIG.startDate;

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
                {eventName}
                {editionYear && (
                  <>
                    {" "}
                    <span className="text-[var(--accent)]">{editionYear}</span>
                  </>
                )}
              </span>
            </Link>
            {description && (
              <p className="leading-relaxed mb-3 text-stone-400 text-xs max-w-sm">
                {description}
              </p>
            )}
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
            institutionName={institutionName ?? ""}
            location={location ?? ""}
            contactEmail={contactEmail ?? ""}
            contactPhone={contactPhone ?? ""}
            websiteUrl={edition?.websiteUrl}
            onOpenAboutModal={() => setShowAboutModal(true)}
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} {organizer || fullTitle}. All rights reserved.
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
            <span className="text-stone-500">{eventName} Symposium OS</span>
          </div>
        </div>
      </div>

      {/* About Modal */}
      <AboutAppModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        eventName={eventName}
        hostDepartment={hostDepartment}
        institutionName={institutionName}
      />
    </footer>
  );
}
