import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "COORDINATOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Coordinator access required." }, { status: 403 });
    }

    const isCoordinatorOnly = session.user.role === "COORDINATOR";

    const events = await prisma.event.findMany({
      where: isCoordinatorOnly
        ? { coordinatorId: session.user.id }
        : {},
      include: {
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
