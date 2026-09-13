import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface ActiveEditionConfig {
  id: string;
  name: string;
  edition: string;
  slug: string;
  isActive: boolean;
  status: string;
  tagline: string | null;
  metadataText: string | null;
  description: string | null;
  venue: string | null;
  startDate: Date | null;
  endDate: Date | null;
  logoUrl: string | null;
  secondaryLogoUrl: string | null;
  faviconUrl: string | null;
  heroBgUrl: string | null;
  primaryCtaText: string | null;
  primaryCtaLink: string | null;
  themePrimaryAccent: string | null;
  themeSecondaryAccent: string | null;
  themeBgColor: string | null;

  // Stage View Header Banner fields (CMS Driven)
  institutionName: string | null;
  institutionCrestUrl: string | null;
  accreditationText: string | null;
  jubileeBadgeUrl: string | null;
  hostDepartment: string | null;
  acronymExpansion: string | null;
  deptLogoUrl: string | null;
  stageHeaderBannerUrl: string | null;

  // Reusable Institution & Department Details
  institutionShortName: string | null;
  institutionLocation: string | null;
  institutionAbout: string | null;
  departmentAbout: string | null;
  departmentProgram: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  participantFee: number;
  isRegistrationOpen: boolean;
  registrationClosedNotice: string | null;
  prizePool?: string | null;
  expectedDelegates?: string | null;
  defaultFirstPrize?: string | null;
  defaultSecondPrize?: string | null;
  defaultThirdPrize?: string | null;
  showStageModeInStudentPortal?: boolean;

  // Symposium Rules & Guidelines
  rulesEligibilityTitle?: string | null;
  rulesEligibilityText?: string | null;
  rulesTimingsTitle?: string | null;
  rulesTimingsText?: string | null;
  rulesChampionshipTitle?: string | null;
  rulesChampionshipText?: string | null;

  navItems: {
    id: string;
    label: string;
    url: string;
    order: number;
    isEnabled: boolean;
  }[];
  scheduleItems?: {
    id: string;
    time: string;
    title: string;
    venue: string | null;
    description: string | null;
    tag: string | null;
    order: number;
  }[];
}

// Fallback configuration matching Sacred Heart College banner
export const DEFAULT_EDITION_CONFIG: ActiveEditionConfig = {
  id: "default-shine",
  name: "SHINE",
  edition: "2026",
  slug: "shine-2026",
  isActive: true,
  status: "LIVE",
  tagline: "Where Ideas Begin to Shine",
  metadataText: "TECHNOLOGY • INNOVATION • CREATIVITY",
  description:
    "SHINE 26 is the annual intercollegiate flagship symposium organized by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur.",
  venue: "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur",
  startDate: new Date("2026-09-17T09:30:00Z"),
  endDate: new Date("2026-09-17T18:00:00Z"),
  logoUrl: null,
  secondaryLogoUrl: null,
  faviconUrl: null,
  heroBgUrl: null,
  primaryCtaText: "EXPLORE SHINE →",
  primaryCtaLink: "#events",
  themePrimaryAccent: "#FF6B1A",
  themeSecondaryAccent: "#D9A441",
  themeBgColor: "#FAF8F5",

  // Stage Banner Fallbacks
  institutionName: "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR",
  institutionCrestUrl: null,
  accreditationText: "Accredited by NAAC (5th Cycle - Under RAF) with a CGPA of 3.53/4 at 'A++' Grade, Affiliated to Thiruvalluvar University Tirupattur - 635 601",
  jubileeBadgeUrl: null,
  hostDepartment: "DEPARTMENT OF COMPUTER APPLICATIONS(PG)",
  acronymExpansion: "SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES",
  deptLogoUrl: null,
  stageHeaderBannerUrl: null,

  // Reusable Institution & Department Details
  institutionShortName: "SHC",
  institutionLocation: "Tirupattur — 635 601, Tamil Nadu",
  institutionAbout: "Premier institution recognized with NAAC accreditation, providing world-class infrastructure, research excellence, and academic distinction.",
  departmentAbout: "Nurturing top-tier engineers, developers, and technical leaders through state-of-the-art labs, hands-on curricula, and hackathons.",
  departmentProgram: "MCA Program",
  contactEmail: "shine@shctpt.edu",
  contactPhone: "+91 4175 240464",
  websiteUrl: null,
  participantFee: 0,
  isRegistrationOpen: true,
  registrationClosedNotice: "Registrations for this edition are currently closed. Please contact the event coordinators for queries.",
  prizePool: "₹25K+",
  expectedDelegates: "500+",
  defaultFirstPrize: "Cash Prize - 1000Rs + Certificate",
  defaultSecondPrize: "Cash Prize - 750Rs + Certificate",
  defaultThirdPrize: "Cash Prize - 500Rs + Certificate",
  showStageModeInStudentPortal: false,

  rulesEligibilityTitle: "Eligibility & Registration",
  rulesEligibilityText:
    "Open to all bona fide UG and PG students of Computer Science, Applications, IT, and related engineering disciplines with valid college ID cards.",
  rulesTimingsTitle: "Reporting & Timings",
  rulesTimingsText:
    "Participants must report at the registration desk by 09:00 AM sharp on Sep 17, 2026. Spot registrations close at 10:30 AM.",
  rulesChampionshipTitle: "Overall Championship",
  rulesChampionshipText:
    "The institution securing maximum cumulative points across both On-Stage and Off-Stage events will be crowned the SHINE Overall Champions.",

  navItems: [
    { id: "1", label: "About", url: "#about", order: 1, isEnabled: true },
    { id: "2", label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
    { id: "3", label: "Events", url: "#events", order: 3, isEnabled: true },
    { id: "4", label: "Rules", url: "#rules", order: 4, isEnabled: true },
    { id: "5", label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
  ],
  scheduleItems: [],
};

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
      participantFee: active.participantFee ?? 0,
      isRegistrationOpen: active.isRegistrationOpen ?? true,
      registrationClosedNotice: active.registrationClosedNotice || DEFAULT_EDITION_CONFIG.registrationClosedNotice,
      prizePool: pool || DEFAULT_EDITION_CONFIG.prizePool,
      expectedDelegates: delegates || DEFAULT_EDITION_CONFIG.expectedDelegates,
      defaultFirstPrize: defaultFirst || DEFAULT_EDITION_CONFIG.defaultFirstPrize,
      defaultSecondPrize: defaultSecond || DEFAULT_EDITION_CONFIG.defaultSecondPrize,
      defaultThirdPrize: defaultThird || DEFAULT_EDITION_CONFIG.defaultThirdPrize,
      showStageModeInStudentPortal: showStageModeInStudentPortal !== undefined ? showStageModeInStudentPortal : false,

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
