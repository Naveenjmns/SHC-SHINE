"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import CountdownTimer from "@/components/CountdownTimer";
import { ActiveEditionConfig, DEFAULT_EDITION_CONFIG, festTitle } from "@/lib/editionDefaults";
import { Calendar, MapPin, ArrowRight, Trophy, Sparkles } from "lucide-react";
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

  return (
    <section className="relative bg-surface text-ink pt-28 pb-16 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Accreditation & Institution Pill */}
        {(institutionName || accreditationText) && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-xs font-semibold text-ink-muted mb-6 select-none">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
            {institutionName && (
              <span className="truncate max-w-[280px] sm:max-w-none">{institutionName}</span>
            )}
            {institutionName && accreditationText && (
              <span className="hidden sm:inline text-ink-subtle">•</span>
            )}
            {accreditationText && (
              <span className="hidden sm:inline text-accent font-bold truncate max-w-[320px]">
                {accreditationText}
              </span>
            )}
          </div>
        )}

        {/* Edition Logo if present */}
        {logoUrl && (
          <div className="mb-6 relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt={`${fullTitle} Logo`}
              width={160}
              height={160}
              priority
              className="object-contain max-h-full w-auto"
            />
          </div>
        )}

        {/* Hero Title & Year */}
        <div className="space-y-3 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-ink tracking-tight">
            <span className="text-accent">{eventName}</span>
            {editionYear && (
              <>
                {" "}
                <span className="text-ink font-light">{editionYear}</span>
              </>
            )}
          </h1>

          {/* Acronym Expansion */}
          {acronymExpansion && (
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink-muted max-w-2xl mx-auto">
              {acronymExpansion}
            </p>
          )}

          {/* Tagline */}
          {description && (
            <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed pt-1">
              {description}
            </p>
          )}
        </div>

        {/* Event Key Metadata Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs sm:text-sm font-medium text-ink-muted">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-surface-raised border border-border">
            <Calendar className="w-4 h-4 text-accent shrink-0" />
            <span>{targetDate ? formatDateSafe(targetDate) : "Date to be announced"}</span>
          </div>

          {venue && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-surface-raised border border-border">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-none">{venue}</span>
            </div>
          )}
        </div>

        {/* Live Countdown Timer */}
        <div className="mt-8 w-full max-w-xl">
          <CountdownTimer targetDate={targetDate} eventName={fullTitle} />
        </div>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link href="/register">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register Delegation
            </Button>
          </Link>

          <Link href="/events">
            <Button variant="secondary" size="lg">
              Explore Competitions
            </Button>
          </Link>

          <Link href="/leaderboard">
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Trophy className="w-4 h-4 text-gold" />}
            >
              Live Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
