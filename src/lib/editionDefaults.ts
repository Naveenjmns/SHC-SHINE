// Client-safe (no server imports): shared by API routes, server pages and client components.

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

  // Dining & Catering Configuration
  diningHallVenue?: string | null;
  diningFacilityInfo?: string | null;
  mealOptions?: "BOTH" | "VEG_ONLY" | string;

  participantFee: number;
  isRegistrationOpen: boolean;
  registrationClosedNotice: string | null;
  prizePool?: string | null;
  expectedDelegates?: string | null;
  defaultFirstPrize?: string | null;
  defaultSecondPrize?: string | null;
  defaultThirdPrize?: string | null;
  showStageModeInStudentPortal?: boolean;

  // Floor plan & Wayfinding
  floorPlanUrl?: string | null;
  /** Campus GPS position for the "how far am I from campus" check (optional) */
  campusLatitude?: number | null;
  campusLongitude?: number | null;
  waypointGraph?: any;

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

/**
 * Neutral fallbacks used only when no edition has been configured yet (fresh install) or a field
 * is left empty. Every institution / fest specific value (names, venues, contacts, dates, logos)
 * comes from the EventEdition the admin configures; these defaults deliberately contain none, and
 * the UI hides a section when its value is null instead of showing placeholder institution text.
 */
export const DEFAULT_EDITION_CONFIG: ActiveEditionConfig = {
  id: "default-shine",
  name: "College Fest",
  edition: "",
  slug: "default",
  isActive: true,
  status: "LIVE",
  tagline: null,
  metadataText: null,
  description: null,
  venue: null,
  startDate: null,
  endDate: null,
  logoUrl: null,
  secondaryLogoUrl: null,
  faviconUrl: null,
  heroBgUrl: null,
  primaryCtaText: "EXPLORE EVENTS →",
  primaryCtaLink: "#events",
  themePrimaryAccent: "#FF6B1A",
  themeSecondaryAccent: "#D9A441",
  themeBgColor: "#FAF8F5",

  institutionName: null,
  institutionCrestUrl: null,
  accreditationText: null,
  jubileeBadgeUrl: null,
  hostDepartment: null,
  acronymExpansion: null,
  deptLogoUrl: null,
  stageHeaderBannerUrl: null,

  institutionShortName: null,
  institutionLocation: null,
  institutionAbout: null,
  departmentAbout: null,
  departmentProgram: null,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,

  diningHallVenue: null,
  diningFacilityInfo: null,
  mealOptions: "BOTH",

  participantFee: 0,
  isRegistrationOpen: true,
  registrationClosedNotice: "Registrations for this edition are currently closed. Please contact the event coordinators for queries.",
  prizePool: null,
  expectedDelegates: null,
  defaultFirstPrize: "First Prize + Certificate",
  defaultSecondPrize: "Second Prize + Certificate",
  defaultThirdPrize: "Third Prize + Certificate",
  showStageModeInStudentPortal: false,
  floorPlanUrl: "/uploads/campus-floorplan.svg",
  waypointGraph: null,
  campusLatitude: null,
  campusLongitude: null,

  rulesEligibilityTitle: "Eligibility & Registration",
  rulesEligibilityText: null,
  rulesTimingsTitle: "Reporting & Timings",
  rulesTimingsText: null,
  rulesChampionshipTitle: "Overall Championship",
  rulesChampionshipText: null,

  navItems: [
    { id: "1", label: "About", url: "#about", order: 1, isEnabled: true },
    { id: "2", label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
    { id: "3", label: "Events", url: "#events", order: 3, isEnabled: true },
    { id: "4", label: "Rules", url: "#rules", order: 4, isEnabled: true },
    { id: "5", label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
  ],
  scheduleItems: [],
};

/** "<Fest name> <edition>" e.g. "TechFest 2027", without a trailing space when edition is empty */
export function festTitle(edition?: { name?: string | null; edition?: string | null } | null): string {
  const name = edition?.name?.trim() || DEFAULT_EDITION_CONFIG.name;
  const ed = edition?.edition?.trim() || "";
  return ed ? `${name} ${ed}` : name;
}
