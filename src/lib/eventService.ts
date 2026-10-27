import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { DEFAULT_EDITION_CONFIG, type ActiveEditionConfig } from "./editionDefaults";

export { DEFAULT_EDITION_CONFIG, festTitle } from "./editionDefaults";
export type { ActiveEditionConfig } from "./editionDefaults";

async function fetchActiveEditionFromDb(): Promise<ActiveEditionConfig> {
  try {
    const active = await prisma.eventEdition.findFirst({
      where: { isActive: true },
      include: {
        navItems: {
          where: { isEnabled: true },
          orderBy: { order: "asc" },
        },
        scheduleItems: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!active) {
      return DEFAULT_EDITION_CONFIG;
    }

    let pool = (active as any).prizePool;
    let delegates = (active as any).expectedDelegates;
    let rulesEligibilityTitle = (active as any).rulesEligibilityTitle;
    let rulesEligibilityText = (active as any).rulesEligibilityText;
    let rulesTimingsTitle = (active as any).rulesTimingsTitle;
    let rulesTimingsText = (active as any).rulesTimingsText;
    let rulesChampionshipTitle = (active as any).rulesChampionshipTitle;
    let rulesChampionshipText = (active as any).rulesChampionshipText;
    let defaultFirst = (active as any).defaultFirstPrize;
    let defaultSecond = (active as any).defaultSecondPrize;
    let defaultThird = (active as any).defaultThirdPrize;
    let showStageModeInStudentPortal = (active as any).showStageModeInStudentPortal;

    try {
      const rawList: any = await prisma.$queryRaw`
        SELECT "prizePool", "expectedDelegates",
               "rulesEligibilityTitle", "rulesEligibilityText",
               "rulesTimingsTitle", "rulesTimingsText",
               "rulesChampionshipTitle", "rulesChampionshipText",
               "defaultFirstPrize", "defaultSecondPrize", "defaultThirdPrize",
               "showStageModeInStudentPortal"
        FROM "event_editions"
        WHERE "id" = ${active.id}
        LIMIT 1
      `;
      if (rawList && rawList[0]) {
        const r = rawList[0];
        if (r.prizePool !== undefined) pool = r.prizePool;
        if (r.expectedDelegates !== undefined) delegates = r.expectedDelegates;
        if (r.rulesEligibilityTitle !== undefined) rulesEligibilityTitle = r.rulesEligibilityTitle;
        if (r.rulesEligibilityText !== undefined) rulesEligibilityText = r.rulesEligibilityText;
        if (r.rulesTimingsTitle !== undefined) rulesTimingsTitle = r.rulesTimingsTitle;
        if (r.rulesTimingsText !== undefined) rulesTimingsText = r.rulesTimingsText;
        if (r.rulesChampionshipTitle !== undefined) rulesChampionshipTitle = r.rulesChampionshipTitle;
        if (r.rulesChampionshipText !== undefined) rulesChampionshipText = r.rulesChampionshipText;
        if (r.defaultFirstPrize !== undefined) defaultFirst = r.defaultFirstPrize;
        if (r.defaultSecondPrize !== undefined) defaultSecond = r.defaultSecondPrize;
        if (r.defaultThirdPrize !== undefined) defaultThird = r.defaultThirdPrize;
        if (r.showStageModeInStudentPortal !== undefined) showStageModeInStudentPortal = Boolean(r.showStageModeInStudentPortal);
      }
    } catch (_) {}

    return {
      id: active.id,
      name: active.name || DEFAULT_EDITION_CONFIG.name,
      edition: active.edition || DEFAULT_EDITION_CONFIG.edition,
      slug: active.slug,
      isActive: active.isActive,
      status: active.status,
      tagline: active.tagline,
      metadataText: active.metadataText,
      description: active.description,
      venue: active.venue,
      startDate: active.startDate,
      endDate: active.endDate,
      logoUrl: active.logoUrl,
      secondaryLogoUrl: active.secondaryLogoUrl,
      faviconUrl: active.faviconUrl,
      heroBgUrl: active.heroBgUrl,
      primaryCtaText: active.primaryCtaText || DEFAULT_EDITION_CONFIG.primaryCtaText,
      primaryCtaLink: active.primaryCtaLink || DEFAULT_EDITION_CONFIG.primaryCtaLink,
      themePrimaryAccent: active.themePrimaryAccent || DEFAULT_EDITION_CONFIG.themePrimaryAccent,
      themeSecondaryAccent: active.themeSecondaryAccent || DEFAULT_EDITION_CONFIG.themeSecondaryAccent,
      themeBgColor: active.themeBgColor || DEFAULT_EDITION_CONFIG.themeBgColor,

      // Stage Header Fields
      institutionName: active.institutionName || DEFAULT_EDITION_CONFIG.institutionName,
      institutionCrestUrl: active.institutionCrestUrl,
      accreditationText: active.accreditationText || DEFAULT_EDITION_CONFIG.accreditationText,
      jubileeBadgeUrl: active.jubileeBadgeUrl,
      hostDepartment: active.hostDepartment || DEFAULT_EDITION_CONFIG.hostDepartment,
      acronymExpansion: active.acronymExpansion || DEFAULT_EDITION_CONFIG.acronymExpansion,
      deptLogoUrl: active.deptLogoUrl,
      stageHeaderBannerUrl: active.stageHeaderBannerUrl,

      // Reusable Institution & Department Details
      institutionShortName: active.institutionShortName || DEFAULT_EDITION_CONFIG.institutionShortName,
      institutionLocation: active.institutionLocation || DEFAULT_EDITION_CONFIG.institutionLocation,
      institutionAbout: active.institutionAbout || DEFAULT_EDITION_CONFIG.institutionAbout,
      departmentAbout: active.departmentAbout || DEFAULT_EDITION_CONFIG.departmentAbout,
      departmentProgram: active.departmentProgram || DEFAULT_EDITION_CONFIG.departmentProgram,
      contactEmail: active.contactEmail || DEFAULT_EDITION_CONFIG.contactEmail,
      contactPhone: active.contactPhone || DEFAULT_EDITION_CONFIG.contactPhone,
      websiteUrl: active.websiteUrl || DEFAULT_EDITION_CONFIG.websiteUrl,

      diningHallVenue: (active as any).diningHallVenue || DEFAULT_EDITION_CONFIG.diningHallVenue,
      diningFacilityInfo: (active as any).diningFacilityInfo || DEFAULT_EDITION_CONFIG.diningFacilityInfo,
      mealOptions: (active as any).mealOptions || DEFAULT_EDITION_CONFIG.mealOptions || "BOTH",

      participantFee: active.participantFee ?? 0,
      isRegistrationOpen: active.isRegistrationOpen ?? true,
      registrationClosedNotice: active.registrationClosedNotice || DEFAULT_EDITION_CONFIG.registrationClosedNotice,
      prizePool: pool || DEFAULT_EDITION_CONFIG.prizePool,
      expectedDelegates: delegates || DEFAULT_EDITION_CONFIG.expectedDelegates,
      defaultFirstPrize: defaultFirst || DEFAULT_EDITION_CONFIG.defaultFirstPrize,
      defaultSecondPrize: defaultSecond || DEFAULT_EDITION_CONFIG.defaultSecondPrize,
      defaultThirdPrize: defaultThird || DEFAULT_EDITION_CONFIG.defaultThirdPrize,
      showStageModeInStudentPortal: showStageModeInStudentPortal !== undefined ? showStageModeInStudentPortal : false,
      floorPlanUrl: (active as any).floorPlanUrl || DEFAULT_EDITION_CONFIG.floorPlanUrl,
      waypointGraph: (active as any).waypointGraph || null,
      campusLatitude: active.campusLatitude ?? null,
      campusLongitude: active.campusLongitude ?? null,

      rulesEligibilityTitle:
        rulesEligibilityTitle || DEFAULT_EDITION_CONFIG.rulesEligibilityTitle,
      rulesEligibilityText:
        rulesEligibilityText || DEFAULT_EDITION_CONFIG.rulesEligibilityText,
      rulesTimingsTitle:
        rulesTimingsTitle || DEFAULT_EDITION_CONFIG.rulesTimingsTitle,
      rulesTimingsText:
        rulesTimingsText || DEFAULT_EDITION_CONFIG.rulesTimingsText,
      rulesChampionshipTitle:
        rulesChampionshipTitle || DEFAULT_EDITION_CONFIG.rulesChampionshipTitle,
      rulesChampionshipText:
        rulesChampionshipText || DEFAULT_EDITION_CONFIG.rulesChampionshipText,

      navItems: active.navItems && active.navItems.length > 0 ? active.navItems : DEFAULT_EDITION_CONFIG.navItems,
      scheduleItems: active.scheduleItems || [],
    };
  } catch (error) {
    console.error("Error fetching active event edition:", error);
    return DEFAULT_EDITION_CONFIG;
  }
}

// PERFORMANCE: Cache the active edition for 60 seconds to avoid redundant DB queries.
// unstable_cache was already imported but never used — now it powers this cache layer.
const getCachedActiveEdition = unstable_cache(
  async () => {
    return fetchActiveEditionFromDb();
  },
  ["active-edition"],
  { revalidate: 15, tags: ["active-edition"] }
);

export async function getActiveEdition(): Promise<ActiveEditionConfig> {
  try {
    return await getCachedActiveEdition();
  } catch {
    // Fallback to direct fetch if cache layer fails
    return fetchActiveEditionFromDb();
  }
}
