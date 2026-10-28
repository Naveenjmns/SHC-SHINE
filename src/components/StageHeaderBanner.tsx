import { ActiveEditionConfig } from "@/lib/eventService";

interface StageHeaderBannerProps {
  edition?: ActiveEditionConfig;
  forceVisible?: boolean;
  showFestLogo?: boolean;
}

export default function StageHeaderBanner({
  edition,
  forceVisible,
  showFestLogo = false,
}: StageHeaderBannerProps) {
  const fullBannerUrl = edition?.stageHeaderBannerUrl;
  const crestUrl = edition?.institutionCrestUrl || "/uploads/1788791902171_collegelogo-nobg.png";
  const deptLogoUrl = edition?.deptLogoUrl || "/uploads/1788791911208_mcalogo-nobg.png";
  const jubileeBadgeUrl = edition?.jubileeBadgeUrl || "/uploads/1788792021326_SHC.png";
  const festLogoUrl = edition?.logoUrl || "/uploads/1788792011099_SHINE_26_LOGO.png";

  // Header Banner ONLY renders if a custom banner image or graphic logos are explicitly uploaded (or forceVisible is true)
  const isBannerUploaded = !!(fullBannerUrl && fullBannerUrl.trim().length > 0);
  const isAnyGraphicUploaded = !!(
    crestUrl?.trim() ||
    deptLogoUrl?.trim() ||
    jubileeBadgeUrl?.trim() ||
    (showFestLogo && festLogoUrl?.trim())
  );

  if (!forceVisible && !isBannerUploaded && !isAnyGraphicUploaded) {
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
        <div className="text-xs sm:text-sm md:text-[15px] font-semibold text-[#C9D7E6] leading-tight mt-1 mb-1.5 flex flex-col items-center">
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
        <div className="text-xs sm:text-sm md:text-[15px] font-semibold text-[#C9D7E6] leading-tight mt-1 mb-1.5 flex flex-col items-center">
          <span>{line1}</span>
          <span>{line2}</span>
        </div>
      );
    }

    return (
      <p className="text-xs sm:text-sm md:text-[15px] font-semibold text-[#C9D7E6] leading-tight mt-1 mb-1.5">
        {accreditationText}
      </p>
    );
  };

  return (
    <div className={`${forceVisible ? "" : "stage-header-banner "}w-full bg-[#071E33] border-b border-white/10 py-3 px-4 sm:px-8 text-white relative z-50 overflow-hidden`}>
      {isBannerUploaded ? (
        <div className="max-w-7xl mx-auto flex justify-center items-center relative z-10 min-h-[100px] sm:min-h-[140px] md:min-h-[180px]">
          <img
            src={fullBannerUrl}
            alt="Stage Header Banner"
            width={1152}
            height={256}
            loading="eager"
            // @ts-ignore
            fetchPriority="high"
            decoding="async"
            className="w-full max-h-44 sm:max-h-56 md:max-h-64 object-contain rounded-2xl"
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between gap-2 sm:gap-4 relative z-10">
          
          {/* LEFT ASIDE: Sacred Heart College Crest & SHINE Fest Logo (Between College Logo and College Details) */}
          <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 min-w-[40px] sm:min-w-[80px] min-h-[40px] sm:min-h-[80px]">
            {crestUrl && (
              <img
                src={crestUrl}
                alt="Sacred Heart College Crest"
                width={112}
                height={112}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="async"
                className="h-10 sm:h-20 md:h-28 w-auto object-contain transition-transform hover:scale-105"
              />
            )}

            {showFestLogo && festLogoUrl && (
              <img
                src={festLogoUrl}
                alt={edition?.name || "SHINE Fest Logo"}
                width={112}
                height={112}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="async"
                className="h-10 sm:h-20 md:h-28 w-auto object-contain transition-transform hover:scale-105"
              />
            )}
          </div>

          {/* CENTER: Clean 2-Line Accreditation Text Column (College Details) */}
          <div className="flex-1 min-w-[200px] text-center px-1 sm:px-4">
            <h2 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-wide text-white">
              {institutionName}
            </h2>

            {renderAccreditationText()}

            <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-wide text-[#7FB2FF]">
              {hostDept}
            </h3>
          </div>

          {/* RIGHT ASIDE: 75th Jubilee Logo & MCA Department Seal */}
          <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-4 min-h-[32px] sm:min-h-[56px]">
            {jubileeBadgeUrl && (
              <img
                src={jubileeBadgeUrl}
                alt="75 Years SHC Jubilee Badge"
                width={80}
                height={80}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="async"
                className="h-8 sm:h-14 md:h-20 w-auto object-contain hover:scale-105 transition-transform"
              />
            )}

            {deptLogoUrl && (
              <img
                src={deptLogoUrl}
                alt="MCA Department Logo"
                width={112}
                height={112}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="async"
                className="h-10 sm:h-20 md:h-28 w-auto object-contain transition-transform hover:scale-105"
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
