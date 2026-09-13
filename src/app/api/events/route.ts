import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventCategory } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { getActiveEdition } from "@/lib/eventService";
import { revalidatePath } from "next/cache";

// GET /api/events - Public list of events
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const whereClause: { category?: EventCategory } = {};
    if (category && (category === "ON_STAGE" || category === "OFF_STAGE")) {
      whereClause.category = category as EventCategory;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        staffCoordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        studentCoordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    if (events.length > 0) {
      try {
        const rawPrizes: any = await prisma.$queryRaw`
          SELECT "id", "firstPrize", "secondPrize", "thirdPrize" FROM "events"
        `;
        if (Array.isArray(rawPrizes)) {
          const pMap = new Map(rawPrizes.map((p: any) => [p.id, p]));
          for (const ev of events as any[]) {
            const p: any = pMap.get(ev.id);
            if (p) {
              if (p.firstPrize !== undefined) ev.firstPrize = p.firstPrize;
              if (p.secondPrize !== undefined) ev.secondPrize = p.secondPrize;
              if (p.thirdPrize !== undefined) ev.thirdPrize = p.thirdPrize;
            }
          }
        }
      } catch (_) {}
    }

    return NextResponse.json(
      { success: true, events },
      {
        headers: {
          "Cache-Control": "public, max-age=5, s-maxage=15, stale-while-revalidate=59",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Admin create event
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      category,
      capacity,
      venue,
      dateTime,
      rules,
      imageUrl,
      logoUrl,
      staffCoordinatorName,
      staffCoordinatorEmail,
      staffCoordinatorPhone,
      staffCoordinatorImageUrl,
      studentCoordinatorName,
      studentCoordinatorEmail,
      studentCoordinatorPhone,
      studentCoordinatorImageUrl,
      staffCoordinatorId,
      studentCoordinatorId,
      coordinatorId,
      hasPrelims,
      prelimsDateTime,
      prelimsVenue,
      prelimsRules,
      firstPrize,
      secondPrize,
      thirdPrize,
    } = body;

    if (!name || !category || !dateTime) {
      return NextResponse.json(
        { success: false, message: "Name, category, and date/time are required." },
        { status: 400 }
      );
    }

    const activeEdition = await getActiveEdition();
    const editionId = activeEdition.id && activeEdition.id !== "default-shine" ? activeEdition.id : null;
    const defaultFirst = (activeEdition as any)?.defaultFirstPrize || "Cash Prize + Trophy + Certificate";
    const defaultSecond = (activeEdition as any)?.defaultSecondPrize || "Cash Prize + Merit Certificate";
    const defaultThird = (activeEdition as any)?.defaultThirdPrize || "Distinction Certificate";

    const event = await prisma.event.create({
      data: {
        editionId,
        name: name.trim(),
        description: description?.trim() || null,
        category: category as EventCategory,
        fee: 0,
        capacity: capacity ? parseInt(capacity, 10) : null,
        venue: venue?.trim() || null,
        dateTime: new Date(dateTime),
        rules: rules?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        staffCoordinatorName: staffCoordinatorName?.trim() || null,
        staffCoordinatorEmail: staffCoordinatorEmail?.trim() || null,
        staffCoordinatorPhone: staffCoordinatorPhone?.trim() || null,
        staffCoordinatorImageUrl: staffCoordinatorImageUrl?.trim() || null,
        studentCoordinatorName: studentCoordinatorName?.trim() || null,
        studentCoordinatorEmail: studentCoordinatorEmail?.trim() || null,
        studentCoordinatorPhone: studentCoordinatorPhone?.trim() || null,
        studentCoordinatorImageUrl: studentCoordinatorImageUrl?.trim() || null,
        staffCoordinatorId: staffCoordinatorId || coordinatorId || null,
        studentCoordinatorId: studentCoordinatorId || null,
        coordinatorId: coordinatorId || staffCoordinatorId || null,
        hasPrelims: Boolean(hasPrelims),
        prelimsDateTime: prelimsDateTime ? new Date(prelimsDateTime) : null,
        prelimsVenue: prelimsVenue?.trim() || null,
        prelimsRules: prelimsRules?.trim() || null,
      } as any,
      include: {
        staffCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        studentCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
    });

    const finalFirst = firstPrize !== undefined ? (firstPrize?.trim() || null) : defaultFirst;
    const finalSecond = secondPrize !== undefined ? (secondPrize?.trim() || null) : defaultSecond;
    const finalThird = thirdPrize !== undefined ? (thirdPrize?.trim() || null) : defaultThird;

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "events" SET "firstPrize" = $1, "secondPrize" = $2, "thirdPrize" = $3 WHERE "id" = $4`,
        finalFirst,
        finalSecond,
        finalThird,
        event.id
      );
    } catch (rawErr) {
      console.error("ExecuteRaw error on event create prizes:", rawErr);
    }

    (event as any).firstPrize = finalFirst;
    (event as any).secondPrize = finalSecond;
    (event as any).thirdPrize = finalThird;

    await logActivity({
      action: "EVENT_CREATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "Event",
      targetId: event.id,
      targetTitle: `Event Created: "${event.name}"`,
      details: {
        category: event.category,
        venue: event.venue,
        capacity: event.capacity ?? "Unlimited",
        staffCoordinator: event.staffCoordinator?.name || null,
        studentCoordinator: event.studentCoordinator?.name || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/events");

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create event" },
      { status: 500 }
    );
  }
}
