import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// GET: List all editions or current active edition
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const editions = await prisma.eventEdition.findMany({
      include: {
        navItems: { orderBy: { order: "asc" } },
        scheduleItems: { orderBy: { order: "asc" } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (editions.length > 0) {
      try {
        const rawEditions: any = await prisma.$queryRaw`
          SELECT "id", "prizePool", "expectedDelegates",
                 "rulesEligibilityTitle", "rulesEligibilityText",
                 "rulesTimingsTitle", "rulesTimingsText",
                 "rulesChampionshipTitle", "rulesChampionshipText",
                 "defaultFirstPrize", "defaultSecondPrize", "defaultThirdPrize",
                 "showStageModeInStudentPortal"
          FROM "event_editions"
        `;
        if (Array.isArray(rawEditions)) {
          const rawMap = new Map(rawEditions.map((r: any) => [r.id, r]));
          for (const ed of editions as any[]) {
            const raw: any = rawMap.get(ed.id);
            if (raw) {
              if (raw.prizePool !== undefined) ed.prizePool = raw.prizePool;
              if (raw.expectedDelegates !== undefined) ed.expectedDelegates = raw.expectedDelegates;
              if (raw.rulesEligibilityTitle !== undefined) ed.rulesEligibilityTitle = raw.rulesEligibilityTitle;
              if (raw.rulesEligibilityText !== undefined) ed.rulesEligibilityText = raw.rulesEligibilityText;
              if (raw.rulesTimingsTitle !== undefined) ed.rulesTimingsTitle = raw.rulesTimingsTitle;
              if (raw.rulesTimingsText !== undefined) ed.rulesTimingsText = raw.rulesTimingsText;
              if (raw.rulesChampionshipTitle !== undefined) ed.rulesChampionshipTitle = raw.rulesChampionshipTitle;
              if (raw.rulesChampionshipText !== undefined) ed.rulesChampionshipText = raw.rulesChampionshipText;
              if (raw.defaultFirstPrize !== undefined) ed.defaultFirstPrize = raw.defaultFirstPrize;
              if (raw.defaultSecondPrize !== undefined) ed.defaultSecondPrize = raw.defaultSecondPrize;
              if (raw.defaultThirdPrize !== undefined) ed.defaultThirdPrize = raw.defaultThirdPrize;
              if (raw.showStageModeInStudentPortal !== undefined) ed.showStageModeInStudentPortal = Boolean(raw.showStageModeInStudentPortal);
            }
          }
        }
      } catch (rawErr) {
        console.error("GET /api/admin/edition raw query error:", rawErr);
      }
    }

    return NextResponse.json({ success: true, editions });
  } catch (error: any) {
    console.error("GET /api/admin/edition error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new Event Edition (e.g. SHINE 2027)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, edition, tagline, metadataText, description, venue, logoUrl, makeActive } = body;

    if (!name || !edition) {
      return NextResponse.json({ success: false, error: "Event Name and Edition are required" }, { status: 400 });
    }

    const slug = `${name.toLowerCase()}-${edition.toLowerCase()}`.replace(/[^a-z0-9-]/g, "-");

    // If making active, deactivate all other editions first
    if (makeActive) {
      await prisma.eventEdition.updateMany({ data: { isActive: false } });
    }

    const newEdition = await prisma.eventEdition.create({
      data: {
        name,
        edition,
        slug,
        isActive: !!makeActive,
        status: "LIVE",
        tagline: tagline || "Where Ideas Begin to Shine",
        metadataText: metadataText || "TECHNOLOGY • INNOVATION • CREATIVITY",
        description,
        venue,
        logoUrl,
        primaryCtaText: "EXPLORE " + name.toUpperCase() + " →",
        primaryCtaLink: "#events",
        themePrimaryAccent: "#FF6B1A",
        themeSecondaryAccent: "#D9A441",
        themeBgColor: "#FAF8F5",
        prizePool: body.prizePool || "₹25K+",
        expectedDelegates: body.expectedDelegates || "500+",
        rulesEligibilityTitle: body.rulesEligibilityTitle || "Eligibility & Registration",
        rulesEligibilityText:
          body.rulesEligibilityText ||
          "Open to all bona fide UG and PG students of Computer Science, Applications, IT, and related engineering disciplines with valid college ID cards.",
        rulesTimingsTitle: body.rulesTimingsTitle || "Reporting & Timings",
        rulesTimingsText:
          body.rulesTimingsText ||
          "Participants must report at the registration desk by 09:00 AM sharp on Sep 17, 2026. Spot registrations close at 10:30 AM.",
        rulesChampionshipTitle: body.rulesChampionshipTitle || "Overall Championship",
        rulesChampionshipText:
          body.rulesChampionshipText ||
          "The institution securing maximum cumulative points across both On-Stage and Off-Stage events will be crowned the SHINE Overall Champions.",
      },
    });

    // Create default navigation items for the new edition
    const defaultNavs = [
      { label: "Events", url: "#events", order: 1, isEnabled: true },
      { label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
      { label: "About", url: "#about", order: 3, isEnabled: true },
      { label: "Rules", url: "#rules", order: 4, isEnabled: true },
      { label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
    ];

    for (const nav of defaultNavs) {
      await prisma.navigationItem.create({
        data: { ...nav, editionId: newEdition.id },
      });
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, edition: newEdition });
  } catch (error: any) {
    console.error("POST /api/admin/edition error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update an existing edition or set active
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, makeActive, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Edition ID is required" }, { status: 400 });
    }

    if (makeActive) {
      await prisma.eventEdition.updateMany({ data: { isActive: false } });
    }

    const allowedKeys = [
      "name",
      "edition",
      "tagline",
      "metadataText",
      "description",
      "venue",
      "startDate",
      "endDate",
      "logoUrl",
      "secondaryLogoUrl",
      "faviconUrl",
      "heroBgUrl",
      "primaryCtaText",
      "primaryCtaLink",
      "themePrimaryAccent",
      "themeSecondaryAccent",
      "themeBgColor",
      "institutionName",
      "institutionCrestUrl",
      "accreditationText",
      "jubileeBadgeUrl",
      "hostDepartment",
      "acronymExpansion",
      "deptLogoUrl",
      "stageHeaderBannerUrl",
      "institutionShortName",
      "institutionLocation",
      "institutionAbout",
      "departmentAbout",
      "departmentProgram",
      "contactEmail",
      "contactPhone",
      "websiteUrl",
      "participantFee",
      "isRegistrationOpen",
      "registrationClosedNotice",
      "prizePool",
      "expectedDelegates",
      "rulesEligibilityTitle",
      "rulesEligibilityText",
      "rulesTimingsTitle",
      "rulesTimingsText",
      "rulesChampionshipTitle",
      "rulesChampionshipText",
      "defaultFirstPrize",
      "defaultSecondPrize",
      "defaultThirdPrize",
      "showStageModeInStudentPortal",
      "isActive",
      "status",
    ];

    const sanitizedData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in updateData) {
        const val = updateData[key];
        if ((key === "startDate" || key === "endDate") && val) {
          sanitizedData[key] = new Date(val);
        } else if (key === "participantFee") {
          sanitizedData[key] = parseFloat(val) || 0;
        } else if (key === "isRegistrationOpen" || key === "showStageModeInStudentPortal") {
          sanitizedData[key] = Boolean(val);
        } else {
          sanitizedData[key] = val === "" ? null : val;
        }
      }
    }

    if (makeActive) {
      sanitizedData.isActive = true;
    }

    const dynamicFields = {
      defaultFirstPrize: sanitizedData.defaultFirstPrize,
      defaultSecondPrize: sanitizedData.defaultSecondPrize,
      defaultThirdPrize: sanitizedData.defaultThirdPrize,
      prizePool: sanitizedData.prizePool,
      expectedDelegates: sanitizedData.expectedDelegates,
      rulesEligibilityTitle: sanitizedData.rulesEligibilityTitle,
      rulesEligibilityText: sanitizedData.rulesEligibilityText,
      rulesTimingsTitle: sanitizedData.rulesTimingsTitle,
      rulesTimingsText: sanitizedData.rulesTimingsText,
      rulesChampionshipTitle: sanitizedData.rulesChampionshipTitle,
      rulesChampionshipText: sanitizedData.rulesChampionshipText,
    };

    const safePrismaData = { ...sanitizedData };
    delete safePrismaData.defaultFirstPrize;
    delete safePrismaData.defaultSecondPrize;
    delete safePrismaData.defaultThirdPrize;
    delete safePrismaData.showStageModeInStudentPortal;
    delete safePrismaData.prizePool;
    delete safePrismaData.expectedDelegates;
    delete safePrismaData.rulesEligibilityTitle;
    delete safePrismaData.rulesEligibilityText;
    delete safePrismaData.rulesTimingsTitle;
    delete safePrismaData.rulesTimingsText;
    delete safePrismaData.rulesChampionshipTitle;
    delete safePrismaData.rulesChampionshipText;

    let updated: any;
    try {
      updated = await prisma.eventEdition.update({
        where: { id },
        data: safePrismaData,
      });
    } catch (prismaErr: any) {
      console.error("Prisma update error in edition PATCH:", prismaErr);
      throw prismaErr;
    }

    const dynamicFieldsToUpdate = [
      { key: "prizePool", col: "prizePool" },
      { key: "expectedDelegates", col: "expectedDelegates" },
      { key: "rulesEligibilityTitle", col: "rulesEligibilityTitle" },
      { key: "rulesEligibilityText", col: "rulesEligibilityText" },
      { key: "rulesTimingsTitle", col: "rulesTimingsTitle" },
      { key: "rulesTimingsText", col: "rulesTimingsText" },
      { key: "rulesChampionshipTitle", col: "rulesChampionshipTitle" },
      { key: "rulesChampionshipText", col: "rulesChampionshipText" },
      { key: "defaultFirstPrize", col: "defaultFirstPrize" },
      { key: "defaultSecondPrize", col: "defaultSecondPrize" },
      { key: "defaultThirdPrize", col: "defaultThirdPrize" },
      { key: "showStageModeInStudentPortal", col: "showStageModeInStudentPortal" },
    ];

    for (const field of dynamicFieldsToUpdate) {
      if (field.key in updateData) {
        try {
          const val = sanitizedData[field.key] ?? null;
          await prisma.$executeRawUnsafe(
            `UPDATE "event_editions" SET "${field.col}" = $1 WHERE "id" = $2`,
            val,
            id
          );
        } catch (rawErr) {
          console.error(`ExecuteRaw error updating ${field.col}:`, rawErr);
        }
      }
    }
    Object.assign(updated, sanitizedData);

    const isRegistrationToggled = "isRegistrationOpen" in updateData;
    await logActivity({
      action: isRegistrationToggled
        ? (updated.isRegistrationOpen ? "REGISTRATION_OPENED" : "REGISTRATION_CLOSED")
        : "EDITION_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "System",
      targetId: updated.id,
      targetTitle: isRegistrationToggled
        ? `Registration ${updated.isRegistrationOpen ? "Opened" : "Closed"}: ${updated.name} ${updated.edition}`
        : `Edition Updated: ${updated.name} ${updated.edition}`,
      details: {
        editionName: `${updated.name} ${updated.edition}`,
        participantFee: updated.participantFee,
        isRegistrationOpen: updated.isRegistrationOpen,
        registrationClosedNotice: updated.registrationClosedNotice,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/badge", "layout");
    revalidatePath("/dashboard", "layout");

    return NextResponse.json({ success: true, edition: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/edition error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update edition settings" }, { status: 500 });
  }
}
