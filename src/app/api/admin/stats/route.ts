import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const [
      totalUsers,
      totalStudents,
      totalCoordinators,
      totalRegistrations,
      pendingRegistrations,
      confirmedRegistrations,
      rejectedRegistrations,
      events,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "COORDINATOR" } }),
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "PENDING" } }),
      prisma.registration.count({ where: { status: "CONFIRMED" } }),
      prisma.registration.count({ where: { status: "REJECTED" } }),
      prisma.event.findMany({
        include: {
          coordinator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // PERFORMANCE: Use Prisma aggregate instead of fetching all registrations
    const revenueResult = await prisma.event.aggregate({
      _sum: {
        fee: true,
      },
      where: {
        registrations: {
          some: {
            status: "CONFIRMED",
          },
        },
      },
    });

    // For a more accurate per-registration revenue, use raw count * avg fee
    // or simply sum the event fees weighted by confirmed registration counts
    const confirmedRegCount = confirmedRegistrations;
    const avgFee = events.reduce((sum, e) => sum + e.fee, 0) / (events.length || 1);
    const totalRevenue = Math.round(confirmedRegCount * avgFee * 100) / 100;

    const eventBreakdown = events.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      fee: e.fee,
      capacity: e.capacity,
      venue: e.venue,
      dateTime: e.dateTime,
      coordinatorName: e.coordinator?.name || "Unassigned",
      coordinatorEmail: e.coordinator?.email || null,
      registrationsCount: e._count.registrations,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalCoordinators,
        totalRegistrations,
        pendingRegistrations,
        confirmedRegistrations,
        rejectedRegistrations,
        totalEvents: events.length,
        totalRevenue,
      },
      eventBreakdown,
    });
  } catch (error) {
    console.error("Error generating admin stats:", error);
    return NextResponse.json({ success: false, message: "Failed to generate admin stats." }, { status: 500 });
  }
}
