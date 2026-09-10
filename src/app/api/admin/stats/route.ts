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
          staffCoordinator: {
            select: { id: true, name: true, email: true },
          },
          studentCoordinator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Calculate real revenue from paid/verified delegations and confirmed registrations:
    const [paidDelegations, pendingDelegations] = await Promise.all([
      prisma.delegation.findMany({
        where: {
          OR: [
            { paymentStatus: "PAID" },
            { paymentStatus: "VERIFIED" },
            {
              AND: [
                { paymentStatus: { not: "REJECTED" } },
                {
                  registrations: {
                    some: {
                      status: "CONFIRMED",
                    },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          totalFee: true,
        },
      }),
      prisma.delegation.findMany({
        where: {
          paymentStatus: "PENDING",
          registrations: {
            none: {
              status: "CONFIRMED",
            },
          },
        },
        select: {
          totalFee: true,
        },
      }),
    ]);

    const delegationRevenue = paidDelegations.reduce((sum, d) => sum + (d.totalFee || 0), 0);
    const pendingRevenue = pendingDelegations.reduce((sum, d) => sum + (d.totalFee || 0), 0);

    // Direct event fees for confirmed registrations not belonging to a paid delegation
    const paidDelegationIds = new Set(paidDelegations.map((d) => d.id));
    const confirmedRegistrationsWithFee = await prisma.registration.findMany({
      where: {
        status: "CONFIRMED",
        event: {
          fee: { gt: 0 },
        },
      },
      select: {
        delegationId: true,
        event: {
          select: { fee: true },
        },
      },
    });

    const directEventRevenue = confirmedRegistrationsWithFee
      .filter((reg) => !reg.delegationId || !paidDelegationIds.has(reg.delegationId))
      .reduce((sum, reg) => sum + (reg.event.fee || 0), 0);

    const totalRevenue = Math.round((delegationRevenue + directEventRevenue) * 100) / 100;

    const eventBreakdown = events.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      fee: e.fee,
      capacity: e.capacity,
      venue: e.venue,
      dateTime: e.dateTime,
      coordinatorName:
        e.staffCoordinator?.name ||
        e.coordinator?.name ||
        e.staffCoordinatorName ||
        e.studentCoordinator?.name ||
        e.studentCoordinatorName ||
        "Unassigned",
      coordinatorEmail:
        e.staffCoordinator?.email ||
        e.coordinator?.email ||
        e.staffCoordinatorEmail ||
        e.studentCoordinator?.email ||
        e.studentCoordinatorEmail ||
        null,
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
        pendingRevenue,
      },
      eventBreakdown,
    });
  } catch (error) {
    console.error("Error generating admin stats:", error);
    return NextResponse.json({ success: false, message: "Failed to generate admin stats." }, { status: 500 });
  }
}
