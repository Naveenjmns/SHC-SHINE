import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

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
        } else {
          sanitizedData[key] = val === "" ? null : val;
        }
      }
    }

    if (makeActive) {
      sanitizedData.isActive = true;
    }

    const updated = await prisma.eventEdition.update({
      where: { id },
      data: sanitizedData,
    });

    await logActivity({
      action: "EDITION_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "System",
      targetId: updated.id,
      targetTitle: `Edition Updated: ${updated.name} ${updated.edition}`,
      details: {
        editionName: `${updated.name} ${updated.edition}`,
        participantFee: updated.participantFee,
      },
    });

    return NextResponse.json({ success: true, edition: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/edition error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update edition settings" }, { status: 500 });
  }
}
