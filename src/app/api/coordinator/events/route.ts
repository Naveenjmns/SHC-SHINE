import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    const events = await prisma.event.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { staffCoordinatorId: session.user.id },
              { studentCoordinatorId: session.user.id },
              { coordinatorId: session.user.id },
            ],
          },
      include: {
        staffCoordinator: {
          select: { id: true, name: true, email: true, phone: true },
        },
        studentCoordinator: {
          select: { id: true, name: true, email: true, phone: true },
        },
        coordinator: {
          select: { id: true, name: true, email: true, phone: true },
        },
        registrations: {
          select: {
            id: true,
            status: true,
            result: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Error fetching coordinator events:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch events." }, { status: 500 });
  }
}
