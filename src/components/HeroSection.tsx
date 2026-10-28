import Link from "next/link";
import Image from "next/image";
import ParticleField from "@/components/ParticleField";
import { ActiveEditionConfig, DEFAULT_EDITION_CONFIG, festTitle } from "@/lib/editionDefaults";
import { Sparkles, Calendar, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

interface HeroSectionProps {
  edition?: ActiveEditionConfig;
}

export default function HeroSection({ edition }: HeroSectionProps) {
  const eventName = edition?.name || DEFAULT_EDITION_CONFIG.name;
  const editionYear = edition?.edition || DEFAULT_EDITION_CONFIG.edition;
  const fullTitle = festTitle(edition);
  const tagline = edition?.tagline || DEFAULT_EDITION_CONFIG.tagline;
  const metadataText = edition?.metadataText || "TECHNOLOGY • INNOVATION • CREATIVITY";
  const acronymExpansion = edition?.acronymExpansion || DEFAULT_EDITION_CONFIG.acronymExpansion;
  const primaryCtaText = edition?.primaryCtaText || DEFAULT_EDITION_CONFIG.primaryCtaText || "EXPLORE EVENTS →";
  const primaryCtaLink = edition?.primaryCtaLink || DEFAULT_EDITION_CONFIG.primaryCtaLink || "#events";
  const logoUrl = edition?.logoUrl || DEFAULT_EDITION_CONFIG.logoUrl;
  const institutionLabel = edition?.institutionShortName || edition?.institutionName;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-canvas text-ink pt-24 pb-20 border-b border-border">
      {/* Subtle drifting particles */}
      <ParticleField particleCount={80} />

      {/* 16:9 Stage Presentation Canvas Container */}
      <div className="container-shine relative z-10 w-full flex flex-col items-center justify-center text-center py-6 md:py-12">

        {/* Stage 2: Extra-Large Logo over decorative blobs */}
        <div className="mb-6 md:mb-8 animate-stage-logo w-full flex justify-center">
          {logoUrl ? (
            <div className="blob-stage inline-flex items-center justify-center min-h-[180px] sm:min-h-[240px] md:min-h-[320px] lg:min-h-[400px]">
              <div
                aria-hidden="true"
                className="blob blob-magenta w-40 h-40 sm:w-56 sm:h-56 top-0 -right-6 sm:-right-12"
              />
              <div
                aria-hidden="true"
                className="blob blob-cyan w-36 h-36 sm:w-48 sm:h-48 bottom-0 -left-6 sm:-left-12"
              />
              <img
                src={logoUrl}
                alt={`${fullTitle} Logo`}
                width={768}
                height={512}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="async"
                className="relative max-h-56 sm:max-h-72 md:max-h-96 lg:max-h-[440px] w-auto object-contain mx-auto transition-transform duration-500 hover:scale-105"
              />
            </div>
          ) : (
            <div className="relative inline-flex flex-col items-center justify-center p-8 md:p-12" suppressHydrationWarning>
              <div
                suppressHydrationWarning
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-accent flex items-center justify-center text-accent-ink font-bold text-4xl md:text-5xl shadow-elevated"
              >
                {eventName.charAt(0)}
              </div>
              <div
                suppressHydrationWarning
                className="pill-badge mt-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>{institutionLabel ? `${institutionLabel} • Symposium` : "Symposium"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stage 3: Event Title & Edition */}
        <div className="max-w-5xl mx-auto mb-3 md:mb-4 animate-stage-title">
          <h1 className="text-fluid-hero font-bold text-ink tracking-tight">
            {eventName}
            {editionYear && (
              <>
                {" "}
                <span className="text-accent">{editionYear}</span>
              </>
            )}
          </h1>
        </div>

        {/* Acronym Expansion right under the fest title */}
        {acronymExpansion && (
          <div className="mb-5 md:mb-6 animate-stage-title px-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent-muted text-sm sm:text-[15px] font-semibold text-accent-strong break-words max-w-[92vw]">
              {acronymExpansion}
            </span>
          </div>
        )}

        {/* Stage 4: Configurable Metadata */}
        <div className="animate-stage-meta mb-5 md:mb-6 px-3">
          <p className="eyebrow break-words">
            {metadataText}
          </p>
        </div>

        {/* Stage 5: Configurable Tagline */}
        {tagline && (
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 animate-stage-tagline px-4">
            <p className="text-fluid-body text-ink-muted font-medium text-lg sm:text-xl md:text-2xl">
              "{tagline}"
            </p>
          </div>
        )}

        {/* Stage 6: Configurable CTA Buttons (Responsive Stacking) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-stage-cta w-full max-w-sm sm:max-w-none px-4 sm:px-0">
          <Link href={primaryCtaLink} className="btn-primary group text-base !py-3.5 !px-7 sm:!px-9 font-semibold flex items-center justify-center gap-2">
            <span>{primaryCtaText}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/events" className="btn-outline text-base !py-3.5 !px-7 sm:!px-9 font-semibold flex items-center justify-center">
            View All Events
          </Link>
        </div>

      </div>
    </section>
  );
}
