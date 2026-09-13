import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLogger";
import { isValidPhone } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        role: true,
        foodPreference: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    let roleStats: Record<string, unknown> = {};

    if (user.role === "STUDENT") {
      const [registrations, memberData] = await Promise.all([
        prisma.registration.findMany({
          where: { userId: user.id },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                category: true,
                venue: true,
                dateTime: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.delegationMember.findFirst({
          where: {
            OR: [
              { email: user.email.toLowerCase().trim() },
              ...(user.phone ? [{ phone: user.phone.trim() }] : []),
            ],
          },
          include: {
            delegation: {
              select: {
                id: true,
                collegeName: true,
                teamName: true,
                paymentStatus: true,
              },
            },
          },
        }),
      ]);

      const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
      const attendedCount = registrations.filter((r) => r.attended).length;
      const wonAwards = registrations.filter((r) => r.result).map((r) => ({
        event: r.event.name,
        result: r.result,
      }));

      roleStats = {
        totalRegistrations: registrations.length,
        confirmedCount,
        attendedCount,
        wonAwards,
        recentRegistrations: registrations.slice(0, 5),
        badgeCode: memberData?.badgeCode || null,
        foodTokenCode: memberData?.foodTokenCode || null,
        foodPreference: memberData?.foodPreference || user.foodPreference || "VEG",
        foodTokenClaimed: !!memberData?.foodTokenClaimed,
        eventCheckedIn: !!memberData?.eventCheckedIn,
        contingentName: memberData?.delegation?.teamName || null,
        collegeName: memberData?.delegation?.collegeName || user.college || null,
      };
    } else if (user.role === "COORDINATOR") {
      const assignedEvents = await prisma.event.findMany({
        where: {
          OR: [
            { staffCoordinatorId: user.id },
            { studentCoordinatorId: user.id },
            { coordinatorId: user.id },
            { staffCoordinatorEmail: user.email },
            { studentCoordinatorEmail: user.email },
          ],
        },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
          registrations: {
            select: {
              id: true,
              attended: true,
              isPrelimsParticipant: true,
              prelimsStatus: true,
            },
          },
        },
      });

      const totalParticipants = assignedEvents.reduce((acc, ev) => acc + ev._count.registrations, 0);
      const checkedInCount = assignedEvents.reduce(
        (acc, ev) => acc + ev.registrations.filter((r) => r.attended).length,
        0
      );

      roleStats = {
        assignedEventsCount: assignedEvents.length,
        totalParticipants,
        checkedInCount,
        events: assignedEvents.map((ev) => ({
          id: ev.id,
          name: ev.name,
          category: ev.category,
          venue: ev.venue,
          dateTime: ev.dateTime,
          participantCount: ev._count.registrations,
          checkedInCount: ev.registrations.filter((r) => r.attended).length,
        })),
      };
    } else if (user.role === "FOOD_COORDINATOR") {
      const [totalMembers, claimedMembers, vegClaimed, nonVegClaimed] = await Promise.all([
        prisma.delegationMember.count(),
        prisma.delegationMember.count({ where: { foodTokenClaimed: true } }),
        prisma.delegationMember.count({ where: { foodTokenClaimed: true, foodPreference: "VEG" } }),
        prisma.delegationMember.count({ where: { foodTokenClaimed: true, foodPreference: "NON_VEG" } }),
      ]);

      roleStats = {
        totalEligible: totalMembers,
        totalClaimed: claimedMembers,
        totalRemaining: Math.max(0, totalMembers - claimedMembers),
        claimRate: totalMembers > 0 ? Math.round((claimedMembers / totalMembers) * 100) : 0,
        vegClaimed,
        nonVegClaimed,
      };
    } else if (user.role === "ADMIN") {
      const [totalUsers, totalEvents, totalRegistrations, totalDelegations] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.registration.count(),
        prisma.delegation.count(),
      ]);

      roleStats = {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalDelegations,
      };
    }

    return NextResponse.json({
      success: true,
      user,
      roleStats,
    });
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error fetching profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      phone,
      college,
      foodPreference,
      avatarUrl,
      currentPassword,
      newPassword,
    } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (phone !== undefined) {
      const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
      if (trimmedPhone) {
        if (!isValidPhone(trimmedPhone)) {
          return NextResponse.json(
            { success: false, message: "Please provide a valid 10-digit mobile number." },
            { status: 400 }
          );
        }
        updateData.phone = trimmedPhone;
      } else {
        updateData.phone = null;
      }
    }
    if (college !== undefined) {
      updateData.college = typeof college === "string" ? college.trim() : null;
    }
    if (foodPreference && ["VEG", "NON_VEG"].includes(foodPreference)) {
      updateData.foodPreference = foodPreference;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : null;
    }

    // Handle Password Change
    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      if (existingUser.passwordHash) {
        const isMatch = await bcrypt.compare(currentPassword.trim(), existingUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { success: false, message: "Current password does not match." },
            { status: 400 }
          );
        }
      }

      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid changes provided to update." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        role: true,
        foodPreference: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If student updated food preference or phone, sync to delegationMember as well
    if (existingUser.role === "STUDENT" && (updateData.foodPreference || updateData.phone || updateData.name)) {
      await prisma.delegationMember.updateMany({
        where: { email: existingUser.email.toLowerCase().trim() },
        data: {
          ...(updateData.name ? { name: updateData.name as string } : {}),
          ...(updateData.phone ? { phone: updateData.phone as string } : {}),
          ...(updateData.foodPreference ? { foodPreference: updateData.foodPreference as string } : {}),
        },
      }).catch((e) => console.error("Error syncing delegation member info:", e));
    }

    await logActivity({
      action: "USER_UPDATE",
      actorId: existingUser.id,
      actorName: existingUser.name,
      actorEmail: existingUser.email,
      actorRole: existingUser.role,
      targetType: "User",
      targetId: existingUser.id,
      targetTitle: `Profile update (${existingUser.email})`,
      details: {
        fieldsUpdated: Object.keys(updateData).filter((k) => k !== "passwordHash"),
        passwordChanged: !!newPassword,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error updating profile." },
      { status: 500 }
    );
  }
}
