import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "COORDINATOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        staffCoordinator: {
          select: { id: true, name: true, email: true },
        },
        studentCoordinator: {
          select: { id: true, name: true, email: true },
        },
        coordinator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    // Access control: User must be Admin, Staff Coordinator, Student Coordinator, or Legacy Coordinator
    const isManager =
      session.user.role === "ADMIN" ||
      event.staffCoordinatorId === session.user.id ||
      event.studentCoordinatorId === session.user.id ||
      event.coordinatorId === session.user.id;

    if (!isManager) {
      return NextResponse.json(
        { success: false, message: "Access forbidden. You do not coordinate this event." },
        { status: 403 }
      );
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            college: true,
          },
        },
        delegation: {
          select: {
            id: true,
            collegeName: true,
            teamName: true,
            teamLeadName: true,
            teamLeadPhone: true,
            staffInchargeName: true,
            staffInchargePhone: true,
          },
        },
        delegationMember: {
          select: {
            id: true,
            badgeCode: true,
            foodTokenCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      event,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch event registrations." }, { status: 500 });
  }
}
