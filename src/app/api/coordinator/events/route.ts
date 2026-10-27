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
            // Same assignment rule as the event detail & check-in APIs: by account id or by the
            // coordinator email entered on the event form
            OR: [
              { staffCoordinatorId: session.user.id },
              { studentCoordinatorId: session.user.id },
              { coordinatorId: session.user.id },
              ...(session.user.email
                ? [
                    { staffCoordinatorEmail: { equals: session.user.email, mode: "insensitive" as const } },
                    { studentCoordinatorEmail: { equals: session.user.email, mode: "insensitive" as const } },
                  ]
                : []),
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

    const activeEdition = await prisma.eventEdition.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        edition: true,
        logoUrl: true,
        institutionCrestUrl: true,
      },
    });

    return NextResponse.json({ success: true, events, edition: activeEdition });
  } catch (error) {
    console.error("Error fetching coordinator events:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch events." }, { status: 500 });
  }
}
