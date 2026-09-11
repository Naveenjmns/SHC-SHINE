import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";

// GET /api/admin/users - List users with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    const where: { role?: Role } = {};
    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true,
          },
        },
        coordEvents: {
          select: { id: true, name: true, category: true },
        },
        staffCoordEvents: {
          select: { id: true, name: true, category: true },
        },
        studentCoordEvents: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((u) => {
      // Deduplicate competitions across legacy coordinatorId, staffCoordinatorId, and studentCoordinatorId
      const eventMap = new Map<string, { id: string; name: string; category?: string }>();
      [
        ...(u.coordEvents || []),
        ...(u.staffCoordEvents || []),
        ...(u.studentCoordEvents || []),
      ].forEach((ev) => {
        eventMap.set(ev.id, ev);
      });
      const assignedEvents = Array.from(eventMap.values());

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        college: u.college,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        assignedEvents,
        _count: {
          registrations: u._count.registrations,
          coordEvents: assignedEvents.length,
        },
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch users." }, { status: 500 });
  }
}

// POST /api/admin/users - Create new Coordinator or Admin user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, college, role, password } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email address already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        college: college ? college.trim() : "Sacred Heart College (Autonomous)",
        role: role as Role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        role: true,
        createdAt: true,
      },
    });

    await logActivity({
      action: "USER_CREATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "User",
      targetId: newUser.id,
      targetTitle: `User Created: ${newUser.name} (${newUser.role})`,
      details: {
        role: newUser.role,
        email: newUser.email,
        college: newUser.college,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, message: "Failed to create user." }, { status: 500 });
  }
}
