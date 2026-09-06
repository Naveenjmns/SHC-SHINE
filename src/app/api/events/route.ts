import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventCategory } from "@prisma/client";

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
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
    const { name, description, category, fee, capacity, venue, dateTime, coordinatorId } = body;

    if (!name || !category || !dateTime) {
      return NextResponse.json(
        { success: false, message: "Name, category, and date/time are required." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as EventCategory,
        fee: parseFloat(fee) || 0,
        capacity: capacity ? parseInt(capacity, 10) : null,
        venue: venue?.trim() || null,
        dateTime: new Date(dateTime),
        coordinatorId: coordinatorId || null,
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
