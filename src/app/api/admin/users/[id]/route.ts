import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";

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

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json({ success: false, message: "Cannot delete your own admin account." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.user.delete({
      where: { id },
    });

    if (existing) {
      await logActivity({
        action: "USER_DELETED",
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "User",
        targetId: existing.id,
        targetTitle: `User Deleted: ${existing.name} (${existing.email})`,
        details: { role: existing.role, email: existing.email },
      });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ success: false, message: "Failed to delete user." }, { status: 500 });
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
    const { name, email, phone, college, role, password } = body;

    const updateData: {
      name?: string;
      email?: string;
      phone?: string | null;
      college?: string | null;
      role?: Role;
      passwordHash?: string;
    } = {};

    if (name) updateData.name = name.trim();
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const duplicate = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: `An account with email "${normalizedEmail}" already exists.` },
          { status: 400 }
        );
      }
      updateData.email = normalizedEmail;
    }
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (college !== undefined) updateData.college = college ? college.trim() : null;
    if (role && Object.values(Role).includes(role as Role)) updateData.role = role as Role;
    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        role: true,
      },
    });

    await logActivity({
      action: "USER_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "User",
      targetId: updated.id,
      targetTitle: `User Updated: ${updated.name}`,
      details: { role: updated.role, email: updated.email },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, message: "A user with this email or phone already exists." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Failed to update user: " + (error?.message || "Internal error") }, { status: 500 });
  }
}
