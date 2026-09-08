import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventCategory } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { revalidatePath } from "next/cache";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
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
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
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

    const updated = await prisma.event.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        category: category !== undefined ? (category as EventCategory) : undefined,
        capacity: capacity !== undefined ? (capacity ? parseInt(capacity, 10) : null) : undefined,
        venue: venue !== undefined ? venue?.trim() || null : undefined,
        dateTime: dateTime !== undefined ? new Date(dateTime) : undefined,
        rules: rules !== undefined ? rules?.trim() || null : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl?.trim() || null : undefined,
        staffCoordinatorName: staffCoordinatorName !== undefined ? staffCoordinatorName?.trim() || null : undefined,
        staffCoordinatorEmail: staffCoordinatorEmail !== undefined ? staffCoordinatorEmail?.trim() || null : undefined,
        staffCoordinatorPhone: staffCoordinatorPhone !== undefined ? staffCoordinatorPhone?.trim() || null : undefined,
        staffCoordinatorImageUrl: staffCoordinatorImageUrl !== undefined ? staffCoordinatorImageUrl?.trim() || null : undefined,
        studentCoordinatorName: studentCoordinatorName !== undefined ? studentCoordinatorName?.trim() || null : undefined,
        studentCoordinatorEmail: studentCoordinatorEmail !== undefined ? studentCoordinatorEmail?.trim() || null : undefined,
        studentCoordinatorPhone: studentCoordinatorPhone !== undefined ? studentCoordinatorPhone?.trim() || null : undefined,
        studentCoordinatorImageUrl: studentCoordinatorImageUrl !== undefined ? studentCoordinatorImageUrl?.trim() || null : undefined,
        staffCoordinatorId: staffCoordinatorId !== undefined ? staffCoordinatorId || null : undefined,
        studentCoordinatorId: studentCoordinatorId !== undefined ? studentCoordinatorId || null : undefined,
        coordinatorId: coordinatorId !== undefined ? coordinatorId || null : undefined,
        hasPrelims: hasPrelims !== undefined ? Boolean(hasPrelims) : undefined,
        prelimsDateTime: prelimsDateTime !== undefined ? (prelimsDateTime ? new Date(prelimsDateTime) : null) : undefined,
        prelimsVenue: prelimsVenue !== undefined ? prelimsVenue?.trim() || null : undefined,
        prelimsRules: prelimsRules !== undefined ? prelimsRules?.trim() || null : undefined,
      },
      include: {
        staffCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        studentCoordinator: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
    });

    await logActivity({
      action: "EVENT_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "Event",
      targetId: updated.id,
      targetTitle: `Event Updated: "${updated.name}"`,
      details: {
        category: updated.category,
        venue: updated.venue,
        capacity: updated.capacity ?? "Unlimited",
        staffCoordinator: updated.staffCoordinator?.name || null,
        studentCoordinator: updated.studentCoordinator?.name || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/events");

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    await prisma.event.delete({
      where: { id },
    });

    if (existing) {
      await logActivity({
        action: "EVENT_DELETED",
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Event",
        targetId: existing.id,
        targetTitle: `Event Deleted: "${existing.name}"`,
        details: { eventName: existing.name },
      });
    }

    revalidatePath("/");
    revalidatePath("/events");

    return NextResponse.json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ success: false, message: "Failed to delete event" }, { status: 500 });
  }
}
