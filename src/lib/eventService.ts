import prisma from "@/lib/prisma";

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

  navItems: [
    { id: "1", label: "About", url: "#about", order: 1, isEnabled: true },
    { id: "2", label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
    { id: "3", label: "Events", url: "#events", order: 3, isEnabled: true },
    { id: "4", label: "Rules", url: "#rules", order: 4, isEnabled: true },
    { id: "5", label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
  ],
  scheduleItems: [],
};

export async function getActiveEdition(): Promise<ActiveEditionConfig> {
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

      navItems: active.navItems && active.navItems.length > 0 ? active.navItems : DEFAULT_EDITION_CONFIG.navItems,
      scheduleItems: active.scheduleItems || [],
    };
  } catch (error) {
    console.error("Error fetching active event edition:", error);
    return DEFAULT_EDITION_CONFIG;
  }
}
