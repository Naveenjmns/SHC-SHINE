import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventCategory } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { getActiveEdition } from "@/lib/eventService";

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

    return NextResponse.json({ success: true, events });
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
    } = body;

    if (!name || !category || !dateTime) {
      return NextResponse.json(
        { success: false, message: "Name, category, and date/time are required." },
        { status: 400 }
      );
    }

    const activeEdition = await getActiveEdition();
    const editionId = activeEdition.id && activeEdition.id !== "default-shine" ? activeEdition.id : null;

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
      },
      include: {
        staffCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        studentCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
    });

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

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create event" },
      { status: 500 }
    );
  }
}
