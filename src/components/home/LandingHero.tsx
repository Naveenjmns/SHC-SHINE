"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import CountdownTimer from "@/components/CountdownTimer";
import { ActiveEditionConfig, DEFAULT_EDITION_CONFIG, festTitle } from "@/lib/editionDefaults";
import { Calendar, MapPin, ArrowRight, Trophy, Sparkles, Building2 } from "lucide-react";
import { formatDateSafe } from "@/lib/dateUtils";

interface LandingHeroProps {
  edition?: ActiveEditionConfig;
}

export default function LandingHero({ edition }: LandingHeroProps) {
  const eventName = edition?.name || DEFAULT_EDITION_CONFIG.name;
  const editionYear = edition?.edition || DEFAULT_EDITION_CONFIG.edition;
  const fullTitle = festTitle(edition);
  const acronymExpansion = edition?.acronymExpansion || DEFAULT_EDITION_CONFIG.acronymExpansion;
  const institutionName = edition?.institutionName || DEFAULT_EDITION_CONFIG.institutionName;
  const accreditationText = edition?.accreditationText || DEFAULT_EDITION_CONFIG.accreditationText;
  const venue = edition?.venue || DEFAULT_EDITION_CONFIG.venue;
  const targetDate = edition?.startDate || DEFAULT_EDITION_CONFIG.startDate;
  const description = edition?.description || DEFAULT_EDITION_CONFIG.description;
  const logoUrl = edition?.logoUrl || DEFAULT_EDITION_CONFIG.logoUrl;
  const institutionBadge = [institutionName, accreditationText].filter(Boolean).join(" · ");

  return (
    <section className="relative overflow-hidden bg-canvas text-ink pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="container-shine grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-16 items-center">
        {/* Left column — headline, copy, CTAs */}
        <div className="min-w-0 flex flex-col items-start text-left">
          {institutionBadge && (
            <span
              title={institutionBadge}
              className="pill-badge mb-6 select-none max-w-full !items-start !rounded-2xl !py-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="min-w-0 line-clamp-2">{institutionBadge}</span>
            </span>
          )}

          <h1 className="text-fluid-hero text-ink">
            {eventName}
            {editionYear && (
              <>
                {" "}
                <span className="text-accent">{editionYear}</span>
              </>
            )}
          </h1>

          {acronymExpansion && (
            <p className="mt-3 text-[15px] font-semibold text-ink-muted">
              {acronymExpansion}
            </p>
          )}

          {description && (
            <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-xl">
              {description}
            </p>
          )}

          <div className="mt-9 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Register your delegation
              </Button>
            </Link>
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth>
                Explore competitions
              </Button>
            </Link>
          </div>

          <Link
            href="/leaderboard"
            className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-ink hover:text-accent transition-colors"
          >
            <Trophy className="w-4 h-4 text-gold" />
            View the live leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right column — event card over decorative blobs */}
        <div className="blob-stage min-w-0 w-full max-w-md mx-auto lg:max-w-none">
          <div
            aria-hidden="true"
            className="blob blob-magenta w-56 h-56 sm:w-72 sm:h-72 -top-10 right-0 sm:-right-12"
          />
          <div
            aria-hidden="true"
            className="blob blob-cyan w-48 h-48 sm:w-64 sm:h-64 -bottom-12 -left-6 sm:-left-14"
          />

          <div className="relative rounded-2xl bg-surface shadow-elevated border border-border overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b border-border">
              <div className="w-14 h-14 rounded-[12px] bg-accent-muted flex items-center justify-center shrink-0 overflow-hidden">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${fullTitle} Logo`}
                    width={56}
                    height={56}
                    priority
                    className="object-contain w-full h-full p-1.5"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-accent" />
                )}
              </div>
              <div className="min-w-0">
                {institutionName && (
                  <p className="text-[15px] font-medium text-ink-muted truncate">{institutionName}</p>
                )}
                <p className="text-xl font-bold text-ink truncate">{fullTitle}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
                <span className="text-base font-semibold text-ink">
                  {targetDate ? formatDateSafe(targetDate) : "Date to be announced"}
                </span>
              </div>
              {venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
                  <span className="text-base text-ink-muted">{venue}</span>
                </div>
              )}

              <div className="pt-2">
                <CountdownTimer targetDate={targetDate} eventName={fullTitle} />
              </div>
            </div>

            <div className="px-6 pb-6">
              <Link href="/register">
                <Button variant="primary" fullWidth>
                  Reserve your seat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
