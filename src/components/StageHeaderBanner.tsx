"use client";

import { ActiveEditionConfig } from "@/lib/eventService";

interface StageHeaderBannerProps {
  edition?: ActiveEditionConfig;
}

export default function StageHeaderBanner({ edition }: StageHeaderBannerProps) {
  const fullBannerUrl = edition?.stageHeaderBannerUrl;
  const crestUrl = edition?.institutionCrestUrl;
  const deptLogoUrl = edition?.deptLogoUrl;
  const jubileeBadgeUrl = edition?.jubileeBadgeUrl;

  // Header Banner ONLY renders if a custom banner image or graphic logos are explicitly uploaded
  const isBannerUploaded = !!(fullBannerUrl && fullBannerUrl.trim().length > 0);
  const isAnyGraphicUploaded = !!(
    crestUrl?.trim() ||
    deptLogoUrl?.trim() ||
    jubileeBadgeUrl?.trim()
  );

  if (!isBannerUploaded && !isAnyGraphicUploaded) {
    return null;
  }

  const institutionName = edition?.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR";
  const accreditationText = edition?.accreditationText || "Accredited by NAAC (5th Cycle - Under RAF) with a CGPA of 3.53/4 at 'A++' Grade, Affiliated to Thiruvalluvar University Tirupattur - 635 601";
  const hostDept = edition?.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS(PG)";

  // Render accreditation in 2 neat lines
  const renderAccreditationText = () => {
    if (!accreditationText) return null;

    // Handle explicit newlines
    if (accreditationText.includes("\n")) {
      const lines = accreditationText.split("\n").map((l) => l.trim()).filter(Boolean);
      return (
        <div className="text-[10px] sm:text-xs md:text-sm font-bold text-[#FDE047] leading-tight mt-1 mb-1.5 flex flex-col items-center">
          {lines.map((line, idx) => (
            <span key={idx}>{line}</span>
          ))}
        </div>
      );
    }

    // Split at "Affiliated" (case insensitive)
    const match = accreditationText.match(/(.*?),?\s*(affiliated\b.*)/i);
    if (match) {
      const rawPart1 = match[1].trim();
      const line1 = rawPart1.endsWith(",") ? rawPart1 : `${rawPart1},`;
      const line2 = match[2].trim();
      return (
        <div className="text-[10px] sm:text-xs md:text-sm font-bold text-[#FDE047] leading-tight mt-1 mb-1.5 flex flex-col items-center">
          <span>{line1}</span>
          <span>{line2}</span>
        </div>
      );
    }

    return (
      <p className="text-[10px] sm:text-xs md:text-sm font-bold text-[#FDE047] leading-tight mt-1 mb-1.5">
        {accreditationText}
      </p>
    );
  };

  return (
    <div className="stage-header-banner w-full bg-[#0E0D0D] border-b border-[#D9A441]/35 py-3 px-4 sm:px-8 text-white relative z-50 overflow-hidden shadow-2xl">
      {/* Background Solar Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF4500]/12 via-[#FF6B1A]/18 to-[#FF4500]/12 blur-xl pointer-events-none" />

      {isBannerUploaded ? (
        <div className="max-w-7xl mx-auto flex justify-center items-center relative z-10">
          <img
            src={fullBannerUrl}
            alt="Stage Header Banner"
            className="w-full max-h-44 sm:max-h-56 md:max-h-64 object-contain rounded-xl shadow-lg"
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative z-10">
          
          {/* LEFT ASIDE: Sacred Heart College Crest */}
          <div className="shrink-0 flex items-center gap-3">
            {crestUrl && (
              <img
                src={crestUrl}
                alt="Sacred Heart College Crest"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_4px_16px_rgba(255,107,26,0.35)] transition-transform hover:scale-105"
              />
            )}
          </div>

          {/* CENTER: Clean 2-Line Accreditation Text Column */}
          <div className="flex-1 text-center px-2 sm:px-4">
            <h2
              className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FF7B2F] via-[#FF6B1A] to-[#D9A441]"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              {institutionName}
            </h2>

            {renderAccreditationText()}

            <h3
              className="text-sm sm:text-lg md:text-xl lg:text-2xl font-extrabold uppercase tracking-wider text-[#FF6B1A] drop-shadow-xs"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              {hostDept}
            </h3>
          </div>

          {/* RIGHT ASIDE: 75th Jubilee Logo & MCA Department Seal side-by-side */}
          <div className="shrink-0 flex items-center gap-3 sm:gap-4">
            {jubileeBadgeUrl && (
              <img
                src={jubileeBadgeUrl}
                alt="75 Years SHC Jubilee Badge"
                className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            )}

            {deptLogoUrl && (
              <img
                src={deptLogoUrl}
                alt="MCA Department Logo"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_4px_16px_rgba(255,107,26,0.35)] transition-transform hover:scale-105"
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
