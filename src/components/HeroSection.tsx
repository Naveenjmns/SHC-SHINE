"use client";

import Link from "next/link";
import Image from "next/image";
import ParticleField from "@/components/ParticleField";
import { ActiveEditionConfig } from "@/lib/eventService";
import { Sparkles, Calendar, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

interface HeroSectionProps {
  edition?: ActiveEditionConfig;
}

export default function HeroSection({ edition }: HeroSectionProps) {
  const eventName = edition?.name || "SHINE";
  const editionYear = edition?.edition || "2026";
  const tagline = edition?.tagline || "Where Ideas Begin to Shine";
  const metadataText = edition?.metadataText || "TECHNOLOGY • INNOVATION • CREATIVITY";
  const acronymExpansion = edition?.acronymExpansion || "SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES";
  const primaryCtaText = edition?.primaryCtaText || "EXPLORE SHINE →";
  const primaryCtaLink = edition?.primaryCtaLink || "#events";
  const logoUrl = edition?.logoUrl;
  const venue = edition?.venue || "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAF8F5] pt-24 pb-20 border-b border-[#1C1917]/10">
      {/* Realistic Rising Flame Embers */}
      <ParticleField particleCount={80} />

      {/* Massive Page-Wide Sunburst Sunshine Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] md:w-[1800px] h-[800px] md:h-[1000px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF6B1A]/22 via-[#D9A441]/14 via-[#FF8A00]/6 to-transparent blur-3xl opacity-90 animate-pulse" style={{ animationDuration: "6s" }} />
      </div>

      {/* Secondary Ambient Sunshine Flare */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] md:w-[1300px] h-[600px] bg-radial from-[#FFB000]/18 via-[#FF4500]/8 to-transparent blur-2xl pointer-events-none z-0" />

      {/* 16:9 Stage Presentation Canvas Container */}
      <div className="container-shine relative z-10 w-full flex flex-col items-center justify-center text-center py-6 md:py-12">
        
        {/* Stage 2: Extra-Large Logo with Natural Sunburst Blend */}
        <div className="mb-6 md:mb-8 animate-stage-logo w-full flex justify-center">
          {logoUrl ? (
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-radial from-[#FF6B1A]/35 via-[#D9A441]/20 to-transparent blur-2xl transform scale-125 pointer-events-none" />
              <img
                src={logoUrl}
                alt={`${eventName} ${editionYear} Logo`}
                className="relative max-h-56 sm:max-h-72 md:max-h-96 lg:max-h-[440px] w-auto object-contain mx-auto drop-shadow-[0_12px_35px_rgba(255,107,26,0.25)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          ) : (
            <div className="relative inline-flex flex-col items-center justify-center p-8 md:p-12">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-4xl md:text-5xl shadow-2xl shadow-orange-500/40">
                {eventName.charAt(0)}
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold uppercase tracking-widest text-[#FF6B1A] mt-4">
                <Sparkles className="w-4 h-4 text-[#D9A441]" />
                <span>Sacred Heart College • Symposium</span>
              </div>
            </div>
          )}
        </div>

        {/* Stage 3: Event Title & Edition */}
        <div className="max-w-5xl mx-auto mb-3 md:mb-4 animate-stage-title">
          <h1
            className="text-fluid-hero font-extrabold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            <span className="hero-wordmark-gradient">{eventName}</span>{" "}
            <span className="text-[#1C1917] font-light">{editionYear}</span>
          </h1>
        </div>

        {/* Acronym Expansion right under SHINE 26 */}
        {acronymExpansion && (
          <div className="mb-5 md:mb-6 animate-stage-title">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B1A]/10 via-[#D9A441]/15 to-[#FF6B1A]/10 border border-[#D9A441]/30 text-xs sm:text-sm md:text-base font-extrabold text-[#D97706] tracking-[0.18em] uppercase shadow-2xs">
              {acronymExpansion}
            </span>
          </div>
        )}

        {/* Stage 4: Configurable Metadata */}
        <div className="animate-stage-meta mb-5 md:mb-6">
          <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.3em] text-[#57534E] uppercase">
            {metadataText}
          </p>
        </div>

        {/* Stage 5: Configurable Tagline */}
        {tagline && (
          <div className="max-w-3xl mx-auto mb-10 md:mb-12 animate-stage-tagline">
            <p className="text-fluid-body text-[#44403C] font-semibold italic text-lg sm:text-xl md:text-2xl">
              "{tagline}"
            </p>
          </div>
        )}

        {/* Stage 6: Premium Configurable CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-5 animate-stage-cta">
          <Link href={primaryCtaLink} className="btn-ember group text-base !py-4 !px-9 text-lg">
            <span>{primaryCtaText}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/events" className="btn-gold-outline text-base !py-4 !px-9 text-lg">
            View All Events
          </Link>
        </div>

      </div>
    </section>
  );
}
