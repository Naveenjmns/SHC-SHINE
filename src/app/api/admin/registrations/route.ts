import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";

// GET /api/admin/registrations - List all registrations across the fest
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: {
      eventId?: string;
      status?: RegistrationStatus;
      user?: {
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" };
          email?: { contains: string; mode: "insensitive" };
          college?: { contains: string; mode: "insensitive" };
        }>;
      };
    } = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status && Object.values(RegistrationStatus).includes(status as RegistrationStatus)) {
      where.status = status as RegistrationStatus;
    }

    if (search) {
      const s = search.trim();
      where.user = {
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { college: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    const registrations = await prisma.registration.findMany({
      where,
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
        event: {
          select: {
            id: true,
            name: true,
            category: true,
            fee: true,
            venue: true,
            coordinator: {
              select: {
                name: true,
              },
            },
          },
        },
        delegation: {
          select: {
            id: true,
            collegeName: true,
            teamName: true,
            teamLeadName: true,
            staffInchargeName: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error("Error fetching all registrations:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch registrations." }, { status: 500 });
  }
}

// PATCH /api/admin/registrations - Admin can override any registration
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { registrationId, status, result } = body;

    if (!registrationId) {
      return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
    }

    const updateData: { status?: RegistrationStatus; result?: string | null } = {};
    if (status && Object.values(RegistrationStatus).includes(status)) {
      updateData.status = status as RegistrationStatus;
    }
    if (result !== undefined) {
      updateData.result = result ? result.trim() : null;
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("Error overriding registration:", error);
    return NextResponse.json({ success: false, message: "Failed to update registration." }, { status: 500 });
  }
}
