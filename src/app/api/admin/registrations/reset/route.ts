import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/admin/registrations/reset - Alternate dedicated endpoint to clear registrations and revenue
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    let clearStudentAccounts = true;
    try {
      const body = await req.json();
      if (body && typeof body.clearStudentAccounts === "boolean") {
        clearStudentAccounts = body.clearStudentAccounts;
      }
    } catch {
      // Body may be empty
    }

    const [deletedRegs, deletedMembers, deletedDelegations, deletedStudents] = await prisma.$transaction(
      async (tx) => {
        // 1. Delete all event registrations
        const regs = await tx.registration.deleteMany({});

        // 2. Delete all delegation members
        const members = await tx.delegationMember.deleteMany({});

        // 3. Delete all delegations (clearing totalFee, paymentStatus, and revenue)
        const delegations = await tx.delegation.deleteMany({});

        // 4. Delete attendee student accounts (only those not assigned as coordinators)
        let students = { count: 0 };
        if (clearStudentAccounts) {
          students = await tx.user.deleteMany({
            where: {
              role: "STUDENT",
              coordEvents: { none: {} },
              staffCoordEvents: { none: {} },
              studentCoordEvents: { none: {} },
            },
          });
        }

        return [regs, members, delegations, students];
      }
    );

    // Audit log
    const { logActivity } = await import("@/lib/activityLogger");
    await logActivity({
      action: "RESET_REGISTRATIONS_AND_REVENUE",
      actorId: session.user.id,
      actorName: session.user.name || "System Admin",
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "Registration",
      targetTitle: "Admin Reset: Purged Registrations & Reset Revenue to ₹0",
      details: {
        deletedRegistrations: deletedRegs.count,
        deletedDelegationMembers: deletedMembers.count,
        deletedDelegations: deletedDelegations.count,
        deletedStudentUsers: deletedStudents.count,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedRegs.count} registrations, ${deletedDelegations.count} delegations, and reset revenue to ₹0. Events, editions, coordinators, and settings are preserved.`,
      stats: {
        deletedRegistrations: deletedRegs.count,
        deletedDelegationMembers: deletedMembers.count,
        deletedDelegations: deletedDelegations.count,
        deletedStudentUsers: deletedStudents.count,
      },
    });
  } catch (error) {
    console.error("Error in reset endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset registrations and revenue." },
      { status: 500 }
    );
  }
}
